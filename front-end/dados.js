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
    try {
      // faz uma requisição get para a api
      const resposta = await fetch('http://localhost:3000/api/previsao/default')

      if (!resposta.ok) {
        throw new Error(`Erro do servidor: ${resposta.status}`)
      }

      // converte a resposta para json
      const dadosPrevisao = await resposta.json()

      // prepara os dados para o gráfico
      const rotulos = dadosPrevisao.map(item => {
        // converte as datas para formato brasileiro
        const data = new Date(item.data_venda)
        return data.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric', timeZone: 'UTC' })
      })

      // arredonda os valores de previsão para 2 casas decimais
      const pontosGrafico = dadosPrevisao.map(item => parseFloat(item.previsao_kg.toFixed(2)))

      // atualiza o gráfico com os novos dados
      graficoLinha.data.labels = rotulos
      graficoLinha.data.datasets[0].data = pontosGrafico
      graficoLinha.update()
    } catch (erro) {
      // em caso de erro, mostra no console e atualiza o gráfico
      console.error('Falha ao buscar dados da previsão:', erro)
      graficoLinha.data.datasets[0].label = 'Falha ao carregar dados'
      graficoLinha.update()
    }
  }

  // executa a função de buscar dados assim que a página carrega
  buscarPrevisaoPadrao()
})
