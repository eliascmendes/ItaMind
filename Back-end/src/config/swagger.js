const swaggerJsdoc = require("swagger-jsdoc")
const path = require("path")

const opcoes = {
    defition: {
        openapi: '3.0.0',
        info: {
            title: "ItaMind Backend",
            description: "Api do backend do sistema ItaMind - Previsões de venda com Machine Learning",
            contact: {
                name: "Suporte ItaMind",
                email: ""
            }
        },
        servers: [{
            url: "http://localhost:3000",
            description: 'Servidor local para desenvolvimento'
        }],
        components: {
            securitySchemas: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
        },
        security: [{
            bearerAuth: []
        }] 
    },
    apis: [
        path.join(__dirname, "../routes/*.js"),
        path.join(__dirname, "../app.js")
    ]
};

const specs = swaggerJsdoc(opcoes)
module.exports  = specs