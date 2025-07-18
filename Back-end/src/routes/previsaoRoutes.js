const express = require('express')
const roteador = express.Router()

// importa todas as funções do controller de previsão
const {
  getPrevisao,
  postCalcularRetirada,
  postCalcularIdadeLote,
  postObterEstagioLote,
  getDadosGraficoBarras,
  getDefaultPrevisao,
  getPrevisoesSalvas,
  getPrevisaoById,
  deletePrevisao,
  getRelatorioDiario,
} = require('../controllers/previsaoController')

// middleware de autenticação jwt
const { autenticar } = require('../middlewares/auth')

// rota para obter previsão padrão (requer autenticação)
roteador.get('/default', autenticar, getDefaultPrevisao)

// rota principal para gerar previsões usando python prophet (requer autenticação)
roteador.post('/previsao', autenticar, getPrevisao)

// rota para gerar relatório diário operacional (requer autenticação)
roteador.get('/relatorio-diario', autenticar, getRelatorioDiario)

// rota para gerar dados do gráfico de barras (requer autenticação)
roteador.get('/grafico-barras', autenticar, getDadosGraficoBarras)

// rotas auxiliares para cálculos de lote (sem autenticação)
roteador.post('/calcular_retirada', postCalcularRetirada)
roteador.post('/calcular_idade_lote', postCalcularIdadeLote)
roteador.post('/obter_estagio_lote', postObterEstagioLote)

// rotas para gerenciar previsões salvas no banco de dados
roteador.get('/salvas', autenticar, getPrevisoesSalvas) // busca previsões salvas com filtros
roteador.get('/salvas/:id', autenticar, getPrevisaoById) // busca previsão específica por id
roteador.delete('/salvas/:id', autenticar, deletePrevisao) // remove previsão do banco

module.exports = roteador
