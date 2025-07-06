require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const aplicacao = express();
const porta = process.env.PORT || 3000;

// Conexão com banco Mongo
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Conectado ao MongoDB');
  })
  .catch((erro) => {
    console.error('Erro ao conectar no MongoDB:', erro);
  });

// Middlewares
aplicacao.use(express.json());
aplicacao.use(cors());
aplicacao.use(morgan('combined'));

// teste rota
aplicacao.get('/ping', (requisicao, resposta) => {
  resposta.send('pong');
});

aplicacao.listen(porta, () => {
  console.log(`Servidor rodando na porta ${porta}`);
});

module.exports = aplicacao; 