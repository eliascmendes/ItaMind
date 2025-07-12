const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const postCalcularRetirada = (req, res) => {
  const { quantidade_prevista, percentual_perda = 15 } = req.body

  if (quantidade_prevista === undefined) {
    return res.status(400).json({ error: 'O campo "quantidade_prevista" é obrigatório.' })
  }

  const quantidade_congelado = quantidade_prevista / (1 - percentual_perda / 100)
  res.json({ retirada_kg: Math.round(quantidade_congelado, 2) })
}

// calcula a idade do lote do SKU escolhido
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

  const diffTime = dtVenda.getTime() - dtRetirada.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return res.json({ idade_lote: 'Dia 1 (Esquerda)' })
  } else if (diffDays === 1) {
    return res.json({ idade_lote: 'Dia 2 (Central)' })
  } else if (diffDays === 2) {
    return res.json({ idade_lote: 'Dia 3 (Venda)' })
  } else {
    return res.json({ idade_lote: `Fora do ciclo (${diffDays} dias)` })
  }
}

const postObterEstagioLote = (req, res) => {
  const { data_retirada } = req.body
  const data_hoje = new Date()

  if (!data_retirada) {
    return res.status(400).json({ error: 'O campo "data_retirada" é obrigatório.' })
  }

  const dtRetirada = new Date(data_retirada)

  if (isNaN(dtRetirada.getTime())) {
    return res.status(400).json({ error: 'Data inválida. Use o formato YYYY-MM-DD.' })
  }

  // zera as horas para comparar apenas as datas
  data_hoje.setHours(0, 0, 0, 0)
  dtRetirada.setHours(0, 0, 0, 0)

  const diffTime = data_hoje.getTime() - dtRetirada.getTime()
  const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

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

const getPrevisao = (req, res) => {
  const { csvData } = req.body

  if (!csvData) {
    return res
      .status(400)
      .json({ error: 'Dados CSV são necessários no corpo da solicitação como "csvData".' })
  }

  const pythonScriptPath = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'CienciaDeDados',
    'run_prophet.py'
  )
  const pythonProcess = spawn('python', [pythonScriptPath])

  let predictions = ''
  let error = ''

  pythonProcess.stdin.write(csvData)
  pythonProcess.stdin.end()

  pythonProcess.stdout.on('data', data => {
    predictions += data.toString()
  })

  pythonProcess.stderr.on('data', data => {
    error += data.toString()
  })

  pythonProcess.on('close', code => {
    if (code !== 0) {
      console.error(`Encerrado com o seguinte código: ${code}`)
      console.error(error)
      return res
        .status(500)
        .json({ error: 'Falha ao executar o modelo de previsão.', details: error })
    }
    try {
      const parsedPredictions = JSON.parse(predictions)
      res.json(parsedPredictions)
    } catch (e) {
      res
        .status(500)
        .json({ error: 'Falha ao analisar previsões do script.', details: predictions })
    }
  })
}

const getDefaultPrevisao = (req, res) => {
  const csvFilePath = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'CienciaDeDados',
    'dados_vendas_itamind.csv'
  );

  fs.readFile(csvFilePath, 'utf8', (err, csvData) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Falha ao ler o arquivo CSV padrão.', details: err.message });
    }

    const pythonScriptPath = path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'CienciaDeDados',
      'run_prophet.py'
    );
    const pythonProcess = spawn('python', [pythonScriptPath]);

    let predictions = '';
    let error = '';

    pythonProcess.stdin.write(csvData);
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', data => {
      predictions += data.toString();
    });

    pythonProcess.stderr.on('data', data => {
      error += data.toString();
    });

    pythonProcess.on('close', code => {
      if (code !== 0) {
        console.error(`Encerrado com o seguinte código: ${code}`);
        console.error(error);
        return res
          .status(500)
          .json({ error: 'Falha ao executar o modelo de previsão.', details: error });
      }
      try {
        const parsedPredictions = JSON.parse(predictions);
        res.json(parsedPredictions);
      } catch (e) {
        res
          .status(500)
          .json({ error: 'Falha ao analisar previsões do script.', details: predictions });
      }
    });
  });
};

module.exports = {
  postCalcularRetirada,
  postCalcularIdadeLote,
  postObterEstagioLote,
  getPrevisao,
  getDefaultPrevisao,
}
