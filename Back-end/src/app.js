require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const conectarDB = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const previsaoRoutes = require('./routes/previsaoRoutes')
const retiradaRoutes = require('./routes/retiradaRoutes')
const swaggerUi = require('swagger-ui-express')
const swaggerSpecs = require('./config/swagger')
const app = express()
const PORT = process.env.PORT || 3000

conectarDB()

// intermediarios
app.use(cors())
app.use(morgan('combined'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// rotas
app.use('/api/auth', authRoutes)
app.use('/api/previsao', previsaoRoutes)
app.use('/api/retiradas', retiradaRoutes)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs))

/**
 * @swagger
 * tags:
 *   name: Teste
 *   description: Endpoints para teste da API
 */

/**
 * @swagger
 * /ping:
 *   get:
 *     summary: Teste de conectividade
 *     description: Verifica se a API está funcionando corretamente
 *     tags: [Teste]
 *     responses:
 *       200:
 *         description: API funcionando corretamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespostaPing'
 *             example:
 *               message: "pong"
 */
app.get('/ping', (req, res) => {
  res.json({ message: 'pong' })
})

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})

module.exports = app
