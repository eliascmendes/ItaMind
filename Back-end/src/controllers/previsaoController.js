const { spawn } = require('child_process')
const path = require('path')
const fsp = require('fs').promises
const Previsao = require('../models/Previsao')
const Produto = require('../models/Produto')
const Venda = require('../models/Venda')
// resolução de problema de loooooping infinito
// cache em memória para a previsão padrão
let cachePrevisao = {
  dados: null,
  timestamp: null,
  emGeracao: false,
}
// define a duração do cache em 1 hora
const DURACAO_CACHE_MS = 60 * 60 * 1000

// calcula quanto deve ser retirado do freezer considerando perdas
// usado para planejar a retirada baseado na previsão de vendas
const postCalcularRetirada = (req, res) => {
  const { quantidade_prevista, percentual_perda = 15 } = req.body

  if (quantidade_prevista === undefined) {
    return res.status(400).json({ error: 'O campo "quantidade_prevista" é obrigatório.' })
  }

  // calcula considerando que vai haver perda no processo
  const quantidade_congelado = quantidade_prevista / (1 - percentual_perda / 100)
  res.json({ retirada_kg: Math.round(quantidade_congelado, 2) })
}

// calcula em que estágio do ciclo o lote está baseado nas datas
// usado para saber se está esquerda, central ou pronto para venda
const postCalcularIdadeLote = (req, res) => {
  const { data_retirada, data_venda } = req.body

  if (!data_retirada || !data_venda) {
    return res
      .status(400)
      .json({ error: 'Os campos "data_retirada" e "data_venda" são obrigatórios.' })
  }

  const dtRetirada = new Date(data_retirada)
  const dtVenda = new Date(data_venda)

  if (isNaN(dtRetirada.getTime()) || isNaN(dtVenda.getTime())) {
    return res.status(400).json({ error: 'Datas inválidas. Use o formato YYYY-MM-DD.' })
  }

  // calcula quantos dias se passaram entre retirada e venda
  const diferencaTempo = dtVenda.getTime() - dtRetirada.getTime()
  // converte milissegundos para dias: 1000ms * 60s * 60min * 24h = 1 dia
  // math.ceil arredonda para cima garantindo que dias parciais sejam contados
  const diferencaDias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24))

  // classifica o estágio baseado nos dias
  if (diferencaDias === 0) {
    return res.json({ idade_lote: 'Dia 1 (Esquerda)' })
  } else if (diferencaDias === 1) {
    return res.json({ idade_lote: 'Dia 2 (Central)' })
  } else if (diferencaDias === 2) {
    return res.json({ idade_lote: 'Dia 3 (Venda)' })
  } else {
    return res.json({ idade_lote: `Fora do ciclo (${diferencaDias} dias)` })
  }
}

// verifica em que estágio um lote está hoje
// compara a data de retirada com hoje para saber o status atual
const postObterEstagioLote = (req, res) => {
  const { data_retirada } = req.body
  const dataHoje = new Date()

  if (!data_retirada) {
    return res.status(400).json({ error: 'O campo "data_retirada" é obrigatório.' })
  }

  const dtRetirada = new Date(data_retirada)

  if (isNaN(dtRetirada.getTime())) {
    return res.status(400).json({ error: 'Data inválida. Use o formato YYYY-MM-DD.' })
  }

  // zera horas para comparar apenas as datas
  dataHoje.setHours(0, 0, 0, 0)
  dtRetirada.setHours(0, 0, 0, 0)

  const diferencaTempo = dataHoje.getTime() - dtRetirada.getTime()
  // converte milissegundos para dias: 1000ms * 60s * 60min * 24h = 1 dia
  // math.ceil arredonda para cima para contar dias parciais como dia completo
  const dias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24))

  // classifica o estágio atual
  if (dias < 0) {
    return res.json({ estagio_lote: 'A retirar' })
  } else if (dias === 0) {
    return res.json({ estagio_lote: 'Descongelando (Dia 1)' })
  } else if (dias === 1) {
    return res.json({ estagio_lote: 'Descongelando (Dia 2)' })
  } else if (dias === 2) {
    return res.json({ estagio_lote: 'Disponível para a venda' })
  } else {
    return res.json({ estagio_lote: 'Fora do ciclo' })
  }
}

// função interna para salvar previsões no banco de dados
// organiza os dados vindos do python no formato correto para o mongodb
const salvarPrevisao = async (dadosPrevisao, idUsuario) => {
  try {
    const previsao = new Previsao({
      sku: dadosPrevisao.sku,
      rmse: dadosPrevisao.rmse,
      mape: dadosPrevisao.mape,
      // converte cada previsão para o formato do banco
      previsoes: dadosPrevisao.previsoes.map(previsao => ({
        ds: new Date(previsao.ds),
        yhat: previsao.yhat,
        yhat_lower: previsao.yhat_lower,
        yhat_upper: previsao.yhat_upper,
      })),
      usuario_id: idUsuario,
      // salva os parâmetros usados no modelo
      parametros_modelo: {
        weekly_seasonality: true,
        yearly_seasonality: false,
        dias_previsao: 7,
      },
    })

    await previsao.save()
    return previsao
  } catch (erro) {
    console.error('Erro ao salvar previsão:', erro)
    throw erro
  }
}

// gera previsões usando dados csv enviados pelo usuário
// executa o script python e salva os resultados no banco
const getPrevisao = async (req, res) => {
  const { csvData } = req.body
  const idUsuario = req.user?.id

  if (!csvData) {
    return res
      .status(400)
      .json({ error: 'Dados CSV são necessários no corpo da solicitação como "csvData".' })
  }

  if (!idUsuario) {
    return res.status(401).json({ error: 'Usuário não autenticado.' })
  }

  // caminho para o script python que gera as previsões
  const caminhoScriptPython = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'CienciaDeDados',
    'run_prophet.py'
  )

  // executa o script python como processo separado
  const processoPython = spawn('python', [caminhoScriptPython])

  let previsoes = ''
  let erro = ''

  // envia os dados csv para o script python
  processoPython.stdin.write(csvData)
  processoPython.stdin.end()

  // captura a saída do script (previsões em json)
  processoPython.stdout.on('data', dados => {
    previsoes += dados.toString()
  })

  // captura erros se houver
  processoPython.stderr.on('data', dados => {
    erro += dados.toString()
  })

  // quando o script python termina
  processoPython.on('close', async codigo => {
    if (codigo !== 0) {
      console.error(`Encerrado com o seguinte código: ${codigo}`)
      console.error(erro)
      return res
        .status(500)
        .json({ error: 'Falha ao executar o modelo de previsão.', details: erro })
    }

    try {
      // converte a resposta json do python
      const previsoesAnalisadas = JSON.parse(previsoes)

      // salva cada previsão no banco de dados
      const previsoesSalvas = []
      for (const previsao of previsoesAnalisadas) {
        try {
          const previsaoSalva = await salvarPrevisao(previsao, idUsuario)
          previsoesSalvas.push(previsaoSalva)
        } catch (erroSalvar) {
          console.error(`Erro ao salvar previsão para SKU ${previsao.sku}:`, erroSalvar)
        }
      }

      // retorna as previsões e informações sobre o que foi salvo
      res.json({
        previsoes: previsoesAnalisadas,
        salvas_bd: previsoesSalvas.length,
        total_geradas: previsoesAnalisadas.length,
      })
    } catch (erro) {
      res.status(500).json({ error: 'Falha ao analisar previsões do script.', details: previsoes })
    }
  })
}

// gera previsões usando o arquivo csv padrão do sistema
// mesmo processo do getPrevisao mas com dados fixos
const getDefaultPrevisao = async (req, res) => {
  const agora = Date.now()

  // 1. verifica se existe um cache válido e retorna
  if (cachePrevisao.dados && agora - cachePrevisao.timestamp < DURACAO_CACHE_MS) {
    return res.json({
      previsoes: cachePrevisao.dados,
      fonte: 'cache',
    })
  }

  // 2. se uma previsão já estiver sendo gerada
  if (cachePrevisao.emGeracao) {
    return res
      .status(202)
      .json({ message: 'A previsão está sendo gerada. Tente novamente em alguns instantes.' })
  }

  try {
    // 3. trava o cache para evitar execuções concorrentes
    cachePrevisao.emGeracao = true
    const idUsuario = req.user?.id

    if (!idUsuario) {
      return res.status(401).json({ error: 'Usuário não autenticado.' })
    }

    // caminho para o arquivo csv com dados históricos
    const caminhoArquivoCsv = path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'CienciaDeDados',
      'dados_vendas_itamind.csv'
    )

    const caminhoScriptPython = path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'CienciaDeDados',
      'run_prophet.py'
    )

    const dadosCsv = await fsp.readFile(caminhoArquivoCsv, 'utf8')

    // encapsula a execução do script python em uma promise
    const previsoesAnalisadas = await new Promise((resolve, reject) => {
      const processoPython = spawn('python', [caminhoScriptPython])

      let previsoes = ''
      let erroPython = ''

      processoPython.stdin.write(dadosCsv)
      processoPython.stdin.end()

      processoPython.stdout.on('data', dados => {
        previsoes += dados.toString()
      })

      processoPython.stderr.on('data', dados => {
        erroPython += dados.toString()
      })

      processoPython.on('error', err => {
        reject({
          status: 500,
          json: { error: 'Falha ao iniciar o processo python.', details: err.message },
        })
      })

      processoPython.on('close', codigo => {
        if (codigo !== 0) {
          console.error(`Script Python encerrado com código ${codigo}: ${erroPython}`)
          reject({
            status: 500,
            json: { error: 'Falha ao executar o modelo de previsão.', details: erroPython },
          })
        } else {
          try {
            const resultado = JSON.parse(previsoes)
            resolve(resultado)
          } catch (erroParse) {
            reject({
              status: 500,
              json: { error: 'Falha ao analisar previsões do script.', details: previsoes },
            })
          }
        }
      })
    })

    // 4. atualiza o cache com os novos dados
    cachePrevisao.dados = previsoesAnalisadas
    cachePrevisao.timestamp = Date.now()

    // retorna a previsão recém-gerada
    res.json({
      previsoes: previsoesAnalisadas,
      fonte: 'nova',
    })
  } catch (erro) {
    if (erro && erro.status && erro.json) {
      return res.status(erro.status).json(erro.json)
    }
    // erro do readFile ou outro erro inesperado
    console.error('Erro ao buscar previsão padrão:', erro)
    return res
      .status(500)
      .json({ error: 'Falha ao buscar previsão padrão.', details: erro.message })
  } finally {
    // 5. libera a trava do cache
    cachePrevisao.emGeracao = false
  }
}

// busca previsões que já foram salvas no banco, permite filtrar por sku, data e paginar os resultados
const getPrevisoesSalvas = async (req, res) => {
  try {
    const idUsuario = req.user?.id
    const { sku, data_inicio, data_fim, limit = 10, page = 1 } = req.query

    if (!idUsuario) {
      return res.status(401).json({ error: 'Usuário não autenticado.' })
    }

    // usuário só vê suas próprias previsões
    const filtros = { usuario_id: idUsuario }

    // filtro por sku específico se informado
    if (sku) {
      filtros.sku = parseInt(sku)
    }

    // filtro por período se informado
    if (data_inicio || data_fim) {
      filtros.data_previsao = {}
      if (data_inicio) {
        filtros.data_previsao.$gte = new Date(data_inicio)
      }
      if (data_fim) {
        filtros.data_previsao.$lte = new Date(data_fim)
      }
    }

    // paginação
    const pular = (page - 1) * limit

    // busca as previsões com informações do usuário
    const previsoes = await Previsao.find(filtros)
      .sort({ data_previsao: -1 }) // mais recentes primeiro
      .skip(pular)
      .limit(parseInt(limit))
      .populate('usuario_id', 'nome email')

    const total = await Previsao.countDocuments(filtros)

    res.json({
      previsoes,
      total,
      page: parseInt(page),
      total_pages: Math.ceil(total / limit),
    })
  } catch (erro) {
    console.error('Erro ao buscar previsões:', erro)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}

// busca uma previsão específica pelo id
// usuário só pode ver suas próprias previsões
const getPrevisaoById = async (req, res) => {
  try {
    const idUsuario = req.user?.id
    const { id } = req.params

    if (!idUsuario) {
      return res.status(401).json({ error: 'Usuário não autenticado.' })
    }

    // busca apenas se for do usuário logado
    const previsao = await Previsao.findOne({ _id: id, usuario_id: idUsuario }).populate(
      'usuario_id',
      'nome email'
    )

    if (!previsao) {
      return res.status(404).json({ error: 'Previsão não encontrada.' })
    }

    res.json(previsao)
  } catch (erro) {
    console.error('Erro ao buscar previsão:', erro)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}

// remove uma previsão específica
// usuário só pode deletar suas próprias previsões
const deletePrevisao = async (req, res) => {
  try {
    const idUsuario = req.user?.id
    const { id } = req.params

    if (!idUsuario) {
      return res.status(401).json({ error: 'Usuário não autenticado.' })
    }

    // deleta apenas se for do usuário logado
    const previsao = await Previsao.findOneAndDelete({ _id: id, usuario_id: idUsuario })

    if (!previsao) {
      return res.status(404).json({ error: 'Previsão não encontrada.' })
    }

    res.json({ message: 'Previsão deletada com sucesso.' })
  } catch (erro) {
    console.error('Erro ao deletar previsão:', erro)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}

// gera relatório diário com base nos dados de previsão
const getRelatorioDiario = async (req, res) => {
  try {
    const idUsuario = req.user?.id
    const { sku, data_alvo } = req.query

    if (!idUsuario) {
      return res.status(401).json({ error: 'Usuário não autenticado.' })
    }

    if (!sku) {
      return res.status(400).json({ error: 'SKU é obrigatório.' })
    }

    if (!data_alvo) {
      return res.status(400).json({ error: 'Data alvo é obrigatória (formato AAAA-MM-DD).' })
    }

    // caminho para o arquivo csv com dados históricos
    const caminhoArquivoCsv = path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'CienciaDeDados',
      'dados_vendas_itamind.csv'
    )

    const caminhoScriptPython = path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'CienciaDeDados',
      'run_prophet.py'
    )

    // executa o script python com os parâmetros para gerar relatório
    const relatorio = await new Promise((resolve, reject) => {
      const processoPython = spawn('python', [
        caminhoScriptPython,
        caminhoArquivoCsv,
        sku,
        data_alvo,
      ])

      let resultado = ''
      let erro = ''

      processoPython.stdout.on('data', dados => {
        resultado += dados.toString()
      })

      processoPython.stderr.on('data', dados => {
        erro += dados.toString()
      })

      processoPython.on('error', err => {
        reject({
          status: 500,
          json: { error: 'Falha ao executar o script Python.', details: err.message },
        })
      })

      processoPython.on('close', codigo => {
        if (codigo !== 0) {
          console.error(`Script Python encerrado com código ${codigo}: ${erro}`)
          reject({
            status: 500,
            json: { error: 'Falha ao gerar relatório.', details: erro },
          })
        } else {
          try {
            // analisa o json retornado pelo script python
            const relatorioJson = JSON.parse(resultado)

            // verifica se houve erro no script
            if (relatorioJson.error) {
              reject({
                status: 400,
                json: { error: relatorioJson.error },
              })
            } else {
              resolve(relatorioJson)
            }
          } catch (erroParse) {
            reject({
              status: 500,
              json: { error: 'Falha ao processar relatório.', details: erroParse.message },
            })
          }
        }
      })
    })

    res.json({
      relatorio,
      sku: parseInt(sku),
      data_alvo,
    })
  } catch (erro) {
    if (erro && erro.status && erro.json) {
      return res.status(erro.status).json(erro.json)
    }
    console.error('Erro ao gerar relatório diário:', erro)
    return res
      .status(500)
      .json({ error: 'Falha ao gerar relatório diário.', details: erro.message })
  }
}

// gera dados para gráfico de barras com vendas por dia da semana
const getDadosGraficoBarras = async (req, res) => {
  try {
    const { sku } = req.query

    if (!sku) {
      return res.status(400).json({ error: 'SKU é obrigatório.' })
    }

    // caminho para o arquivo csv com dados históricos
    const caminhoArquivoCsv = path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'CienciaDeDados',
      'dados_vendas_itamind.csv'
    )

    // le o arquivo csv e processa os dados diretamente
    const csv = await fsp.readFile(caminhoArquivoCsv, 'latin1')
    const linhas = csv.split('\n')
    const dadosVendas = []

    // processa cada linha do csv
    for (let i = 1; i < linhas.length; i++) {
      const linha = linhas[i].trim()
      if (linha) {
        const colunas = linha.split(';')
        if (colunas.length >= 4) {
          const [data, idProduto, descricao, totalVenda] = colunas
          if (parseInt(idProduto) === parseInt(sku)) {
            const [dia, mes, ano] = data.split('/')
            if (dia && mes && ano && !isNaN(Date.parse(`${ano}-${mes}-${dia}`))) {
              const dataFormatada = new Date(ano, mes - 1, dia)
              const diaSemana = dataFormatada.getDay()

              // converte domingo de 0 para 6, e ajusta outros dias
              const diaSemanaAjustado = diaSemana === 0 ? 6 : diaSemana - 1
              const nomesDias = [
                'segunda',
                'terça',
                'quarta',
                'quinta',
                'sexta',
                'sábado',
                'domingo',
              ]
              const nomeDia = nomesDias[diaSemanaAjustado]

              const anoMes = `${ano}-${mes.padStart(2, '0')}`
              const vendasValor = parseFloat(totalVenda.replace(',', '.'))

              // valida se o valor é válido
              if (!isNaN(vendasValor) && vendasValor >= 0) {
                dadosVendas.push({
                  data: data,
                  diaSemana: nomeDia,
                  anoMes: anoMes,
                  vendas: vendasValor,
                })
              }
            }
          }
        }
      }
    }

    //  se encontrou dados
    if (dadosVendas.length === 0) {
      return res.status(404).json({
        error: `Nenhum dado encontrado para o SKU ${sku}`,
      })
    }

    // agrupa dados por dia da semana e mês
    const dadosPorDia = {}
    const diasSemana = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']

    diasSemana.forEach(dia => {
      dadosPorDia[dia] = {}
    })

    dadosVendas.forEach(venda => {
      if (!dadosPorDia[venda.diaSemana][venda.anoMes]) {
        dadosPorDia[venda.diaSemana][venda.anoMes] = 0
      }
      dadosPorDia[venda.diaSemana][venda.anoMes] += venda.vendas
    })

    // arredonda os valores
    Object.keys(dadosPorDia).forEach(dia => {
      Object.keys(dadosPorDia[dia]).forEach(mes => {
        dadosPorDia[dia][mes] = Math.round(dadosPorDia[dia][mes] * 100) / 100
      })
    })

    // calcula estatísticas resumidas
    const totalVendas = dadosVendas.reduce((total, venda) => total + venda.vendas, 0)
    const mediaVendas = totalVendas / dadosVendas.length
    const vendasPorDia = {}

    Object.keys(dadosPorDia).forEach(dia => {
      const vendas = Object.values(dadosPorDia[dia])
      if (vendas.length > 0) {
        vendasPorDia[dia] = {
          total: vendas.reduce((total, valor) => total + valor, 0),
          media: vendas.reduce((total, valor) => total + valor, 0) / vendas.length,
          maxima: Math.max(...vendas),
          minima: Math.min(...vendas),
        }
      }
    })

    const resultado = {
      sku: parseInt(sku),
      dados_por_dia: dadosPorDia,
      resumo: {
        total_registros: dadosVendas.length,
        total_vendas: Math.round(totalVendas * 100) / 100,
        media_vendas: Math.round(mediaVendas * 100) / 100,
        periodo: {
          inicio: dadosVendas[0].data,
          fim: dadosVendas[dadosVendas.length - 1].data,
        },
        vendas_por_dia: vendasPorDia,
      },
    }

    res.json(resultado)
  } catch (erro) {
    console.error('Erro ao gerar dados do gráfico:', erro)
    return res
      .status(500)
      .json({ error: 'Falha ao gerar dados do gráfico.', details: erro.message })
  }
}

// exporta todas as funções para uso nas rotas
module.exports = {
  postCalcularRetirada,
  postCalcularIdadeLote,
  postObterEstagioLote,
  getDadosGraficoBarras,
  getPrevisao,
  getDefaultPrevisao,
  getPrevisoesSalvas,
  getPrevisaoById,
  deletePrevisao,
  getRelatorioDiario,
}
