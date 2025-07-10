# ItaMind Backend API

API Backend do sistema ItaMind para previsões de vendas com Machine Learning.

##  Tecnologias

- **Node.js** + **Express** - Framework web
- **MongoDB** + **Mongoose** - Banco de dados
- **JWT** - Autenticação e autorização
- **bcrypt** - Hash de senhas
- **Joi** - Validação de dados
- **Swagger** - Documentação da API
- **Winston** - Logs
- **Jest** - Testes

##  Pré-requisitos

- Node.js (v16+)
- MongoDB (local ou Atlas)
- npm ou yarn


##  Documentação da API (Swagger)

A documentação da API está disponível através do Swagger UI:

- **URL local**: http://localhost:3000/api-docs

## 🛠️ Rotas Disponíveis

### 🔐 Autenticação
- `POST /api/auth/cadastrar` - Cadastrar novo usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/perfil` - Buscar perfil do usuário

##  Estrutura do Projeto

```
src/
├── config/          # Configurações (DB, Swagger)
├── controllers/     # Lógica de negócio
├── middlewares/     # Middlewares (auth, validação)
├── models/          # Modelos do banco de dados
├── routes/          # Definição das rotas
├── services/        # Serviços externos
└── utils/           # Utilitários
```
