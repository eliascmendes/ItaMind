require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const conectarDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const swaggerUi = require("swagger-ui-express")
const swaggerSpecs = require("./config/swagger")
const app = express();
const PORT = process.env.PORT || 3000;

conectarDB();

// intermediarios
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// rotas
app.use('/api/auth', authRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs))
// teste
app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app; 