const swaggerJsdoc = require("swagger-jsdoc")
const path = require("path")

const opcoes = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: "ItaMind Backend API",
      version: "1.0.0",
      description: "API do backend do sistema ItaMind - Previsões de vendas com Machine Learning",
      contact: {
        name: "Suporte ItaMind",
        email: "emailficticioitamind@itamind.com"
      }
    },
    servers: [{
      url: "http://localhost:3000",
      description: 'Servidor local para desenvolvimento'
    }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormart: 'JWT',
          description: 'Token JWT para autenticação'
        }
      },
      schemas: {
        Usuario: {}
      }
    }
  }
}
