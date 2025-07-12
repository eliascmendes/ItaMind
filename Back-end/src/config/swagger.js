const swaggerJSDoc = require('swagger-jsdoc')

const opcoes = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ItaMind API',
      version: '1.0.0',
      description: 'API para sistema de previsão de vendas ItaMind',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desenvolvimento',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Usuario: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único do usuário',
            },
            nome: {
              type: 'string',
              description: 'Nome do usuário',
            },
            email: {
              type: 'string',
              description: 'Email do usuário',
            },
          },
        },
        Previsao: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único da previsão',
            },
            sku: {
              type: 'number',
              description: 'SKU do produto',
            },
            data_previsao: {
              type: 'string',
              format: 'date-time',
              description: 'Data e hora da previsão',
            },
            rmse: {
              type: 'number',
              description: 'Root Mean Square Error',
            },
            mape: {
              type: 'number',
              description: 'Mean Absolute Percentage Error',
            },
            previsoes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  ds: {
                    type: 'string',
                    format: 'date',
                    description: 'Data da previsão',
                  },
                  yhat: {
                    type: 'number',
                    description: 'Valor previsto',
                  },
                  yhat_lower: {
                    type: 'number',
                    description: 'Limite inferior da previsão',
                  },
                  yhat_upper: {
                    type: 'number',
                    description: 'Limite superior da previsão',
                  },
                },
              },
            },
          },
        },
        RespostaPing: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensagem de resposta',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/app.js'],
}

const especificacoes = swaggerJSDoc(opcoes)

module.exports = especificacoes
