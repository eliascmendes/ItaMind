// guia de tipos de gráficos disponíveis:
// (grafico_rosca): gráfico de rosca e pizza
// (grafico_area): gráfico de área
// (grafico_barras): clássico gráfico de barras
// (grafico_bolhas): gráfico de bolhas
// (grafico_linhas): clássico gráfico de linhas
// é possível ainda combinar tipos de gráficos em apenas um gráfico, como por exemplo:
// conjuntoDados: [{
//     tipo: 'bar',
//     rotulo: 'dados em barra',
//     dados: [10, 20, 30, 40]
// }, {
//     tipo: 'line',
//     rotulo: 'dados em linha',
//     dados: [50, 50, 50, 50],
// }],
// (grafico_area_polar): semelhantes ao gráfico de pizza, mas cada segmento tem o mesmo ângulo - o raio do segmento difere dependendo do valor
// (grafico_radar): gráfico de radar é uma maneira de mostrar vários pontos de dados e a variação entre eles
// (grafico_dispersao): gráfico de dispersão são baseados em linhas básicas, com o eixo x alterado para um eixo linear. precisa-se do eixo x e y

// espera o html carregar antes de executar
document.addEventListener('DOMContentLoaded', () => {
  // obtém o contexto dos elementos canvas do html
  const contextoLinha = document.getElementById('lineChart').getContext('2d')
  const contextoBarras = document.getElementById('barChart').getContext('2d')

  // função para buscar dados do usuário
  const buscarDadosUsuario = async () => {
    try {
      const token = localStorage.getItem('jwt_token')
      if (!token) {
        return
      }

      const resposta = await fetch('https://itamind.onrender.com/api/auth/perfil', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (resposta.ok) {
        const dados = await resposta.json()
        const nomeUsuario = dados.data.user.nome
        const elementoSaudacao = document.getElementById('user_saudacao')
        if (elementoSaudacao) {
          elementoSaudacao.textContent = `Bem Vindo, ${nomeUsuario}`
        }
      } else if (resposta.status === 401) {
        console.error('Sessão inválida para buscar dados do usuário.')
      }
    } catch (erro) {
      console.error('Falha ao buscar dados do usuário:', erro)
    }
  }

  // criação do gráfico de linha
  const graficoLinha = new Chart(contextoLinha, {
    type: 'line', // tipo do gráfico
    data: {
      labels: [], // array que guarda as datas no eixo x
      datasets: [
        {
          label: 'Previsão de Vendas (kg)',
          data: [], // array que guarda os valores de venda
          backgroundColor: 'rgba(74, 144, 226, 0.2)',
          borderColor: 'rgba(74, 144, 226, 1)',
          borderWidth: 2,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true, // faz o gráfico se ajustar ao tamanho da tela
      plugins: {
        legend: { display: true, position: 'top' }, // configuração da legenda
        tooltip: {
          callbacks: {
            // personaliza o texto que aparece ao passar o mouse
            label: contexto => `${contexto.dataset.label}: ${contexto.parsed.y} kg`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: false, // eixo y não começa em zero
          title: { display: true, text: 'Vendas Previstas (kg)' }, // título do eixo y
        },
      },
    },
  })

  // função que busca os dados de previsão no servidor
  const buscarPrevisaoPadrao = async () => {
    graficoLinha.data.datasets[0].label = 'Carregando dados...'
    graficoLinha.data.labels = []
    graficoLinha.data.datasets[0].data = []
    graficoLinha.update()

    try {
      const token = localStorage.getItem('jwt_token')
      if (!token) {
        alert('Você não está autenticado. Redirecionando para a página de login.')
        window.location.href = 'Index.html'
        return
      }

      // faz uma requisição get para a api
      const resposta = await fetch('https://itamind.onrender.com/api/previsao/default', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // se a previsão estiver sendo gerada, aguarda e tenta novamente
      if (resposta.status === 202) {
        console.log('Previsão sendo gerada no servidor, tentando novamente em 5 segundos...')
        setTimeout(buscarPrevisaoPadrao, 5000) // tenta novamente após 5 segundos
        return
      }

      if (resposta.status === 401) {
        alert('Sua sessão expirou. Redirecionando para a página de login.')
        localStorage.removeItem('jwt_token')
        window.location.href = 'Index.html'
        return
      }

      if (!resposta.ok) {
        throw new Error(`Erro do servidor: ${resposta.status}`)
      }

      // converte a resposta para json
      const dadosPrevisao = await resposta.json()

      // atualizar métricas RMSE e MAPE
      if (dadosPrevisao.previsoes && dadosPrevisao.previsoes.length > 0) {
        const primeiroSku = dadosPrevisao.previsoes[0]
        document.getElementById('quantidade-RMSE').textContent =
          primeiroSku.rmse?.toFixed(2) || '--'
        document.getElementById('quantidade-MAPE').textContent =
          primeiroSku.mape?.toFixed(2) + '%' || '--'
      }

      // agregador para somar as previsões de todos os SKUs por dia
      const previsoesAgregadas = new Map()

      // itera sobre cada SKU retornado na previsão
      dadosPrevisao.previsoes.forEach(skuData => {
        // itera sobre a lista de previsões para aquele SKU
        skuData.previsoes.forEach(previsao => {
          const data = new Date(previsao.ds).toISOString().split('T')[0]
          const valorPrevisto = previsao.yhat

          if (previsoesAgregadas.has(data)) {
            previsoesAgregadas.set(data, previsoesAgregadas.get(data) + valorPrevisto)
          } else {
            previsoesAgregadas.set(data, valorPrevisto)
          }
        })
      })

      // ordena as datas antes de passá-las para o gráfico
      const datasOrdenadas = Array.from(previsoesAgregadas.keys()).sort()

      // prepara os dados para o gráfico a partir dos dados agregados
      const rotulos = datasOrdenadas.map(data => {
        const d = new Date(data + 'T00:00:00')
        return d.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
      })

      const pontosGrafico = datasOrdenadas.map(data => {
        return parseFloat(previsoesAgregadas.get(data).toFixed(2))
      })

      // atualiza o gráfico com os novos dados
      graficoLinha.data.labels = rotulos
      graficoLinha.data.datasets[0].data = pontosGrafico
      graficoLinha.data.datasets[0].label = 'Previsão de Vendas (kg)'
      graficoLinha.update()

      // buscar relatório diário para os widgets de retirada com data padrão
      const dataInput = document.getElementById('data-selecionada')
      const dataAlvo = dataInput ? dataInput.value : null
      await buscarRelatorioDiario(237479, dataAlvo)
    } catch (erro) {
      // em caso de erro, mostra no console e atualiza o gráfico
      console.error('Falha ao buscar dados da previsão:', erro)
      graficoLinha.data.datasets[0].label = 'Falha ao carregar dados'
      graficoLinha.update()
    }
  }

  // função para buscar relatório diário e atualizar widgets de retirada
  const buscarRelatorioDiario = async (sku = 237479, dataAlvo = null) => {
    try {
      const token = localStorage.getItem('jwt_token')
      if (!token) return

      // usar data de hoje se não especificada
      const data = dataAlvo || new Date().toISOString().split('T')[0]

      const resposta = await fetch(
        ////`https://itamind.onrender.com/api/previsao/relatorio-diario?sku=${sku}&data_alvo=${data}`
        ////`http://localhost:3000/api/previsao/relatorio-diario?sku=${sku}&data_alvo=${data}`,
        `https://itamind.onrender.com/api/previsao/relatorio-diario?sku=${sku}&data_alvo=${data}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (resposta.ok) {
        const dados = await resposta.json()
        const relatorio = dados.relatorio

        // atualizar widgets de retirada com valores distintos
        // kg_a_retirar: quantidade a retirar hoje (com compensação de 15% de perda)
        document.getElementById('kg-retirar-Hoje').textContent = `${
          relatorio.kg_a_retirar || '--'
        } kg`
        // kg_em_descongelamento: produto em descongelamento (com compensação de 15% de perda)
        document.getElementById('kg-retirado-Ontem').textContent = `${
          relatorio.kg_em_descongelamento || '--'
        } kg`
        // kg_disponivel_bruto: produto disponível com compensação de perda aplicada
        document.getElementById('kg-retirado-antes-de-ontem').textContent = `${
          relatorio.kg_disponivel_bruto || '--'
        } kg`
        // kg_para_venda_hoje: quantidade líquida real disponível para venda
        document.getElementById('disponivelParaVenda').textContent = `${
          relatorio.kg_para_venda_hoje || '--'
        } kg`
      } else {
        // se erro na busca, mostra valores padrão
        document.getElementById('kg-retirar-Hoje').textContent = '-- kg'
        document.getElementById('kg-retirado-Ontem').textContent = '-- kg'
        document.getElementById('kg-retirado-antes-de-ontem').textContent = '-- kg'
        document.getElementById('disponivelParaVenda').textContent = '-- kg'
      }
    } catch (erro) {
      console.error('Falha ao buscar relatório diário:', erro)
    }
  }

  // função para gerar previsão customizada
  const gerarPrevisaoCustomizada = async () => {
    const sku = document.getElementById('sku-selecionado').value
    const data = document.getElementById('data-selecionada').value

    if (!sku || !data) {
      alert('Por favor, selecione um SKU e uma data')
      return
    }

    // converter nome do SKU para número (mapeamento simples)
    const skuMap = {
      Asa: 237479,
    }

    const skuNumero = skuMap[sku] || 237479

    try {
      await buscarRelatorioDiario(skuNumero, data)
      alert(`Relatório gerado para ${sku} na data ${data}`)
    } catch (erro) {
      alert('Erro ao gerar previsão customizada')
    }
  }

  // buscar dados de retiradas para a seção de estoque
  const buscarDadosEstoque = async () => {
    try {
      const token = localStorage.getItem('jwt_token')
      if (!token) return

      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - 7) // última semana
      const dataFim = new Date()

      const resposta = await fetch(
        `https://itamind.onrender.com/api/retiradas/relatorio?data_inicio=${
          dataInicio.toISOString().split('T')[0]
        }&data_fim=${dataFim.toISOString().split('T')[0]}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (resposta.ok) {
        const dados = await resposta.json()
        const relatorio = dados.relatorio

        // atualizar seção de estoque se houver dados
        if (relatorio.detalhes.length > 0) {
          const total = relatorio.detalhes[0]

          // encontrar widgets de estoque e atualizar (seção #estoque)
          const estoqueWidgets = document.querySelectorAll('#estoque .widget p')
          if (estoqueWidgets.length >= 4) {
            estoqueWidgets[1].textContent = `${total.quantidade_retirada} kg`
            estoqueWidgets[0].textContent = `${total.quantidade_vendida} kg`
            estoqueWidgets[2].textContent = `${Math.max(
              0,
              total.quantidade_retirada - total.quantidade_vendida
            )} kg` // Ganho
            estoqueWidgets[3].textContent = `${Math.max(
              0,
              total.quantidade_vendida - total.quantidade_retirada
            )} kg` // Perda
          }
        }
      }
    } catch (erro) {
      console.error('Falha ao buscar dados de estoque:', erro)
    }
  }

  // executar funções ao carregar a página
  buscarDadosUsuario()
  buscarPrevisaoPadrao()

  // buscar dados de estoque após um  delay
  setTimeout(buscarDadosEstoque, 2000)

  // adicionar evento ao botão de gerar previsão
  const botaoGerarPrevisao = document.getElementById('botao-gerar-previsao')
  if (botaoGerarPrevisao) {
    botaoGerarPrevisao.addEventListener('click', gerarPrevisaoCustomizada)
  }

  // função para registrar nova retirada
  const registrarNovaRetirada = async () => {
    const quantidade = document.getElementById('retirada-quantidade').value
    const data = document.getElementById('retirada-data').value

    if (!quantidade || !data) {
      alert('Por favor, preencha a quantidade e a data')
      return
    }

    try {
      const token = localStorage.getItem('jwt_token')
      if (!token) {
        alert('Você não está autenticado')
        return
      }

      // calcular data de venda prevista (2 dias após retirada)
      const dataRetirada = new Date(data)
      const dataVendaPrevista = new Date(dataRetirada)
      dataVendaPrevista.setDate(dataVendaPrevista.getDate() + 2)

      const dadosRetirada = {
        id_produto: 237479,
        data_retirada: data,
        quantidade_kg: parseFloat(quantidade),
        data_venda_prevista: dataVendaPrevista.toISOString().split('T')[0],
        observacoes: 'Retirada registrada via painel web',
      }
      //localhost:3000
      //https://itamind.onrender.com/api/retiradas/registrar
      const resposta = await fetch('https://itamind.onrender.com/api/retiradas/registrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dadosRetirada),
      })

      if (resposta.ok) {
        const resultado = await resposta.json()
        alert(`Retirada registrada com sucesso! Lote: ${resultado.retirada.lote}`)

        // limpar campos
        document.getElementById('retirada-quantidade').value = ''
        document.getElementById('retirada-data').value = ''

        // atualizar dados na tela
        await buscarRelatorioDiario()
        await buscarDadosEstoque()
      } else {
        const erro = await resposta.json()
        alert(`Erro ao registrar retirada: ${erro.error}`)
      }
    } catch (erro) {
      alert('Erro ao registrar retirada')
      console.error(erro)
    }
  }

  // função para ver retiradas recentes
  const verRetiradas = async () => {
    try {
      const token = localStorage.getItem('jwt_token')
      if (!token) {
        alert('Você não está autenticado')
        return
      }

      const resposta = await fetch('https://itamind.onrender.com/api/retiradas/buscar?limit=100', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (resposta.ok) {
        const dados = await resposta.json()
        let mensagem = 'Últimas retiradas:\n\n'

        dados.retiradas.forEach((retirada, index) => {
          // string YYYY-MM-DD e formatar para DD/MM/YYYY
          const partesData = retirada.data_retirada.split('-')
          const dataFormatada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`
          mensagem += `${index + 1}. ${dataFormatada} - ${retirada.quantidade_kg}kg - ${
            retirada.estagio_atual
          }\n`
        })

        alert(mensagem)
      } else {
        alert('Erro ao buscar retiradas')
      }
    } catch (erro) {
      alert('Erro ao buscar retiradas')
      console.error(erro)
    }
  }

  // função para gerar relatório
  const gerarRelatorioRetiradas = async () => {
    try {
      const token = localStorage.getItem('jwt_token')
      if (!token) {
        alert('Você não está autenticado')
        return
      }

      const dataFim = new Date()
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - 30) // últimos 30 dias

      const resposta = await fetch(
        `https://itamind.onrender.com/api/retiradas/relatorio?data_inicio=${
          dataInicio.toISOString().split('T')[0]
        }&data_fim=${dataFim.toISOString().split('T')[0]}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (resposta.ok) {
        const dados = await resposta.json()
        const relatorio = dados.relatorio

        let mensagem = `Relatório dos últimos 30 dias:\n\n`
        mensagem += `Total de retiradas: ${relatorio.total_geral_retiradas}\n`
        mensagem += `Quantidade retirada: ${relatorio.quantidade_geral_retirada} kg\n`
        mensagem += `Quantidade vendida: ${relatorio.quantidade_geral_vendida} kg\n`
        mensagem += `Em estoque: ${
          relatorio.quantidade_geral_retirada - relatorio.quantidade_geral_vendida
        } kg`

        alert(mensagem)
      } else {
        alert('Erro ao gerar relatório')
      }
    } catch (erro) {
      alert('Erro ao gerar relatório')
      console.error(erro)
    }
  }

  // função para atualizar todos os dados
  const atualizarTodosDados = async () => {
    try {
      alert('Atualizando todos os dados...')

      await buscarDadosUsuario()
      await buscarPrevisaoPadrao()
      await buscarDadosEstoque()

      // atualizar data selecionada
      const dataInput = document.getElementById('data-selecionada')
      const dataAlvo = dataInput ? dataInput.value : null
      if (dataAlvo) {
        await buscarRelatorioDiario(237479, dataAlvo)
      }

      alert('Dados atualizados com sucesso!')
    } catch (erro) {
      alert('Erro ao atualizar dados')
      console.error(erro)
    }
  }

  // adicionar eventos aos novos botões
  const btnRegistrarRetirada = document.getElementById('btn-registrar-retirada')
  if (btnRegistrarRetirada) {
    btnRegistrarRetirada.addEventListener('click', registrarNovaRetirada)
  }

  const btnVerRetiradas = document.getElementById('btn-ver-retiradas')
  if (btnVerRetiradas) {
    btnVerRetiradas.addEventListener('click', verRetiradas)
  }

  const btnGerarRelatorio = document.getElementById('btn-gerar-relatorio')
  if (btnGerarRelatorio) {
    btnGerarRelatorio.addEventListener('click', gerarRelatorioRetiradas)
  }

  const btnAtualizarDados = document.getElementById('btn-atualizar-dados')
  if (btnAtualizarDados) {
    btnAtualizarDados.addEventListener('click', atualizarTodosDados)
  }

  // adicionar evento para quando o usuário alterar a data
  const inputData = document.getElementById('data-selecionada')
  if (inputData) {
    inputData.addEventListener('change', async () => {
      const novaData = inputData.value
      if (novaData) {
        await buscarRelatorioDiario(237479, novaData)
      }
    })
  }
})
document.querySelector('input').onclick = () => {
  document.body.classList.toggle('dark-mode')
}
