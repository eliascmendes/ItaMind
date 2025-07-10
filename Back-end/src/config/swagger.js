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
        Usuario: {
          type: 'object',
          required: ['nome', 'email'],
          properties: {
            _id: {
              type: 'string',
              description: 'ID único do usuário'
            },
            nome: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'Nome completo do usuário'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do usuário'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação do usuário'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data da última atualização'
            }
          }
        },
        CadastroUsuario: {
          type: 'object',
          required: ['nome', 'email', 'senha'],
          properties: {
            nome: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'Nome completo do usuário',
              example: 'Itamind'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do usuário',
              example:'itamind@itamind.com'
            },
            senha: {
              type: 'string',
              minLength: 6,
              description: 'Senha do usuário',
              example: '123456789'
            }
          }
        },
        LoginUsuario: {
          type: 'object',
          required: ['email', 'senha'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do usuário',
              example: 'itamind@itamind.com'
            },
            senha: {
              type: 'string',
              description: 'Senha do usuário',
              example: '123456789'
            }
          }
        },
      }
    }
  }
}
