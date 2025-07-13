# ItaMind Backend API (Em construção)

API Backend do sistema ItaMind para previsões de vendas com Machine Learning usando Prophet.

## Sobre o Projeto

O sistema ItaMind é uma solução completa para previsão de vendas que integra:

- **Backend Node.js** com Express para API REST
- **Machine Learning** com Prophet (Python) para previsões
- **MongoDB** para persistência de dados
- **Autenticação JWT** para segurança
- **Documentação Swagger** para API

## Tecnologias

- **Node.js** (v16+) + **Express** - Framework web
- **MongoDB** + **Mongoose** - Banco de dados NoSQL
- **JWT** - Autenticação e autorização
- **bcryptjs** - Hash de senhas
- **Joi** - Validação de dados
- **Python** + **Prophet** - Machine Learning para previsões
- **Swagger** - Documentação da API
- **Winston** - Logs
- **Jest** - Testes

## Funcionalidades

### 🔐 Autenticação

- Cadastro e login de usuários
- Autenticação JWT
- Gerenciamento de perfil

### 📈 Previsões de Vendas

- Geração de previsões usando Prophet
- Previsões baseadas em dados históricos CSV
- Cálculo de intervalos de confiança (superior/inferior)
- Persistência de previsões no banco

## Pré-requisitos

- **Node.js** v16 ou superior
- **MongoDB** (local ou Atlas)
- **Python** 3.8+ com Prophet
- **npm** ou **yarn**

## Documentação da API (Swagger)

A documentação da API está disponível através do Swagger UI(Em construção):

- **URL local**: http://localhost:3000/api-docs

## Rotas Disponíveis

### 🔐 Autenticação (`/api/auth`)

| Método | Rota         | Descrição                | Autenticação |
| ------ | ------------ | ------------------------ | ------------ |
| POST   | `/cadastrar` | Cadastrar novo usuário   | ❌           |
| POST   | `/login`     | Fazer login              | ❌           |
| GET    | `/perfil`    | Buscar perfil do usuário | ✅           |

### 📈 Previsões (`/api/previsao`)

| Método | Rota          | Descrição                  | Autenticação |
| ------ | ------------- | -------------------------- | ------------ |
| GET    | `/default`    | Obter previsão padrão      | ✅           |
| POST   | `/previsao`   | Gerar nova previsão        | ✅           |
| GET    | `/salvas`     | Listar previsões salvas    | ✅           |
| GET    | `/salvas/:id` | Buscar previsão específica | ✅           |
| DELETE | `/salvas/:id` | Remover previsão           | ✅           |

### 🔧 Utilitários de Lote (`/api/previsao`)

| Método | Rota                   | Descrição                         | Autenticação |
| ------ | ---------------------- | --------------------------------- | ------------ |
| POST   | `/calcular_retirada`   | Calcular quantidade para retirada | ❌           |
| POST   | `/calcular_idade_lote` | Calcular idade do lote            | ❌           |
| POST   | `/obter_estagio_lote`  | Obter estágio atual do lote       | ❌           |

## Modelos de Dados

### Usuario (User)

```javascript
{
  nome: String,           // Nome do usuário
  email: String,          // Email único
  senha: String,          // Senha hasheada
  timestamps: true        // createdAt, updatedAt
}
```

### Produto

```javascript
{
  id_produto: Number,           // ID único do produto
  nome: String,                 // Nome comercial
  categoria: String,            // Categoria/tipo
  unidade_medida: String,       // Unidade (kg, un, etc.)
  peso_unitario: Number,        // Peso por unidade
  preco: Number,                // Preço de venda
  ativo: Boolean,               // Produto ativo
  dias_validade: Number,        // Dias de validade
  temperatura_armazenamento: String, // Tipo de armazenamento
  timestamps: true
}
```

### Venda

```javascript
{
  data_dia: Date,               // Data da venda
  id_produto: Number,           // ID do produto vendido
  total_venda_dia_kg: Number,   // Total vendido (kg)
  quantidade_vendida: Number,   // Quantidade em unidades
  valor_total: Number,          // Valor total da venda
  preco_kg: Number,             // Preço por kg
  lote: String,                 // Identificação do lote
  data_retirada: Date,          // Data retirada do freezer
  data_validade: Date,          // Data de validade
  canal_venda: String,          // Canal (loja, delivery, etc.)
  timestamps: true
}
```

### Previsao

```javascript
{
  sku: Number,                  // SKU do produto
  data_previsao: Date,          // Quando foi gerada
  rmse: Number,                 // Métrica de erro
  mape: Number,                 // Métrica de precisão
  previsoes: [{                 // Array de previsões
    ds: Date,                   // Data da previsão
    yhat: Number,               // Valor previsto
    yhat_lower: Number,         // Limite inferior
    yhat_upper: Number          // Limite superior
  }],
  usuario_id: ObjectId,         // Usuário que gerou
  versao_modelo: String,        // Versão do modelo ML
  parametros_modelo: Object,    // Parâmetros utilizados
  timestamps: true
}
```

## Scripts Disponíveis (Em construção)

```bash
npm start          # Executar em produção
npm run dev        # Executar em desenvolvimento (nodemon)
```

## Integração com Python

O sistema utiliza um script Python (`CienciaDeDados/run_prophet.py`) para gerar previsões:

1. **Entrada**: Dados CSV via stdin
2. **Processamento**: Prophet para ML
3. **Saída**: JSON com previsões
