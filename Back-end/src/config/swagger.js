const swaggerJsdoc = require("swagger-jsdoc")
const path = require("path")

const opcoes = {
    definicao: {
        openapi: "3.0.0",
        informacao: {
            titulo:  "ItaMind Backend",
            versao: "1.0.0",
            descricao: "Api do sistem Itamind para previsões para previsões de vendas com Machine Learning",
            contato: {
                nome: "Suporte Itamind",
                email: "",
            }
        },
        servidor: [
            {
                url: "http://localhost:3000",
                descricao: "Servidor local para desenvolvimento"
            }
        ],
        componentes: {
            usuarios: {
                login: {
                    email: 'email',
                    senha: 'senha',
                }
            },
        },
        users: [{
            login: []
        }]
    }
};

const specs = swaggerJsdoc(opcoes);
module.exports = specs