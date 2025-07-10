require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const conectarDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

conectarDB();

// intermediarios
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// teste
app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app; 