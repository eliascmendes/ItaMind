# ItaMind Backend

API Backend do sistema ItaMind para previsões de vendas com Machine Learning.

## Tecnologias

- **Node.js** + **Express**
- **MongoDB** (Mongoose)
- **JWT** (autenticação)
- **bcrypt** (hash de senhas)
- **Joi** (validação)


## 📋 Rotas Disponíveis

### Autenticação
- `POST /api/auth/cadastrar` - Cadastrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/perfil` - Perfil do usuário 

### Teste
- `GET /ping` - Verificar se API está rodando