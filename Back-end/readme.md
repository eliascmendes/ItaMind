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

###  Autenticação

- Cadastro e login de usuários
- Autenticação JWT
- Gerenciamento de perfil

###  Previsões de Vendas

- Geração de previsões usando Prophet
- Previsões baseadas em dados históricos CSV
- Cálculo de intervalos de confiança (superior/inferior)
- Persistência de previsões no banco

### Sistema de Retiradas do Freezer

- Controle completo do ciclo de vida dos produtos congelados
- Sistema de 4 estágios baseado em tempo
- Compensação automática de perdas no descongelamento
- Rastreamento por lotes únicos
- Relatórios operacionais em tempo real

## Lógica do Sistema de Retiradas

###  **Ciclo de Vida dos Produtos (4 Estágios)**

O sistema ItaMind controla o processo de descongelamento de produtos através de 4 estágios temporais:

| Estágio      | Tempo  | Descrição                        | Status         |
| ------------ | ------ | -------------------------------- | -------------- |
| **esquerda** | Dia 0  | Produto retirado do freezer hoje | Recém-retirado |
| **central**  | Dia 1  | Primeiro dia de descongelamento  | Descongelando  |
| **venda**    | Dia 2  | Segundo dia - pronto para venda  | Disponível     |
| **vencido**  | Dia 3+ | Passou do tempo ideal            | Descarte       |

###  **Lógica de Compensação de Perdas (Fator 0.85)**

Durante o processo de descongelamento, há perdas naturais de aproximadamente **15%** do peso inicial. Para compensar essas perdas, o sistema aplica a fórmula:

```
Quantidade_a_retirar = Previsão_venda ÷ 0.85
```

**Onde:**

- `0.85 = 85%` (taxa de aproveitamento após 15% de perda)
- `15%` representa perdas por evaporação, deterioração e descarte

**Exemplo Prático:**

```
Previsão de venda: 100 kg
Quantidade a retirar: 100 ÷ 0.85 = 117.65 kg
Perda no processo: 17.65 kg (15%)
Quantidade final: 100 kg ✅
```

###  **Perdas Variáveis por Tempo**

O sistema ajusta o percentual de perda baseado na idade do lote:

```javascript
// Backend: utils/loteUtils.js
if (dias <= 2) return 15%      // Perda normal → 0.85 aproveitamento
if (dias === 3) return 20%     // Perda adicional → 0.80 aproveitamento
if (dias >= 4) return 25%      // Perda alta → 0.75 aproveitamento
```

## Integração Backend-Frontend

###  **Fluxo de Dados dos Widgets de Retirada**

#### **1. Requisição Frontend**

```javascript
// frontend/dados.js - buscarRelatorioDiario()
GET /api/previsao/relatorio-diario?sku=237479&data_alvo=2025-06-22
```

#### **2. Processamento Backend**

```javascript
// Backend: controllers/previsaoController.js - getRelatorioDiario()
1. Recebe parâmetros (SKU, data_alvo)
2. Chama script Python com dados históricos
3. Retorna JSON com relatório operacional
```

#### **3. Geração Python**

```python
# CienciaDeDados/run_prophet.py - gerar_relatorio_operacional()

# Treina modelo Prophet com dados históricos
modelo = treinar_modelo_prophet(dados_historicos)

# Gera previsões para próximos 30 dias
previsao = gerar_previsao(modelo, 30)

# Calcula quantidades para cada estágio:
kg_a_retirar = calcular_retirada(previsao_D+2)           # ÷ 0.85
kg_em_descongelamento = calcular_retirada(previsao_D+1)  # ÷ 0.85
kg_para_venda_hoje = round(previsao_D+0)                 # Valor direto
```

#### **4. Atualização Frontend**

```javascript
// frontend/dados.js - Atualização dos widgets
document.getElementById('kg-retirar-Hoje').textContent = `${relatorio.kg_a_retirar} kg`
document.getElementById('kg-retirado-Ontem').textContent = `${relatorio.kg_em_descongelamento} kg`
document.getElementById(
  'kg-retirado-antes-de-ontem'
).textContent = `${relatorio.kg_para_venda_hoje} kg`
document.getElementById('disponivelParaVenda').textContent = `${relatorio.kg_para_venda_hoje} kg`
```

###  **Exemplo Real de Cálculo**

**Cenário:** Data atual = 22/06/2025, SKU = 237479

**Previsões Python:**

```
23/06/2025: 124.29 kg (D+1)
24/06/2025: 125.36 kg (D+2)
22/06/2025: ~102 kg (D+0 - estimado)
```

**Cálculos Backend:**

```
Retirar Hoje: 125.36 ÷ 0.85 = 147.48 kg
Descongelando: 124.29 ÷ 0.85 = 146.22 kg
Disponível: ~102 kg (valor direto da previsão)
```

**Widgets Frontend:**

- **Retirar Hoje**: 147.48 kg (para vender em 24/06)
- **Descongelando**: 146.22 kg (para vender em 23/06)
- **Disponível**: 102 kg (disponível hoje 22/06)
- **Disponível para Venda**: 102 kg (mesmo valor)

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

| Método | Rota                | Descrição                    | Autenticação |
| ------ | ------------------- | ---------------------------- | ------------ |
| GET    | `/default`          | Obter previsão padrão        | ✅           |
| POST   | `/previsao`         | Gerar nova previsão          | ✅           |
| GET    | `/relatorio-diario` | Relatório operacional diário | ✅           |
| GET    | `/salvas`           | Listar previsões salvas      | ✅           |
| GET    | `/salvas/:id`       | Buscar previsão específica   | ✅           |
| DELETE | `/salvas/:id`       | Remover previsão             | ✅           |

### 🧊 Retiradas (`/api/retiradas`)

| Método | Rota           | Descrição                    | Autenticação |
| ------ | -------------- | ---------------------------- | ------------ |
| POST   | `/registrar`   | Registrar nova retirada      | ✅           |
| GET    | `/buscar`      | Buscar retiradas com filtros | ✅           |
| GET    | `/:id`         | Buscar retirada específica   | ✅           |
| PUT    | `/estagio/:id` | Atualizar estágio do lote    | ✅           |
| PUT    | `/venda/:id`   | Registrar venda              | ✅           |
| GET    | `/relatorio`   | Relatório de período         | ✅           |

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

### Retirada

```javascript
{
  id_produto: Number,           // SKU do produto
  data_retirada: String,        // Data da retirada (YYYY-MM-DD)
  quantidade_kg: Number,        // Quantidade retirada
  lote: String,                 // ID único do lote
  data_venda_prevista: Date,    // Data prevista para venda
  idade_dias: Number,           // Idade em dias
  estagio_atual: String,        // esquerda|central|venda|vencido
  usuario_id: ObjectId,         // Usuário responsável
  observacoes: String,          // Observações opcionais
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

1. **Entrada**: Dados CSV via stdin ou parâmetros CLI
2. **Processamento**: Prophet para ML + cálculos de retirada
3. **Saída**: JSON com previsões e relatório operacional
