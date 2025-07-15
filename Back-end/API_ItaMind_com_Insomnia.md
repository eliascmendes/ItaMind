# Testando a API ItaMind com Insomnia

Este guia serve como um tutorial passo a passo para configurar e testar a API usando o [Insomnia](https://insomnia.rest/).

## Passo 1: Configuração do Ambiente no Insomnia

Ambientes no Insomnia nos ajudam a gerenciar variáveis como a URL da API e tokens de autenticação.

1. No Insomnia, vá para o painel de ambientes, procure por Base Environment.
2. Busque pelo ícone de edição
3. Clique em Add
4. Em "input Name" escolha um nome para o seu ambiente (ex: ItaMind).
5. Em "input Value" adicione as seguintes variáveis no formato JSON:

```json
{
  "base_url": "https://itamind.onrender.com/api",
  "token": ""
}
```

- `base_url`: A URL base da API.
- `token`: Token que será preenchido após o login.

## Passo 2: Autenticação

Para interagir com a API é necessário login, caso não possua, é necessário registrar um usuário e obter um token de acesso.

### 1. Cadastrar um Novo Usuário

Crie uma requisição POST para registrar um novo usuário.

- **Método:** POST
- **URL:** `{{base_url}}/auth/cadastrar`
- **Body (JSON):**

```json
{
  "nome": "Seu Nome",
  "email": "seu@email.com",
  "senha": "sua_senha_segura"
}
```

- **Resposta Esperada (201 Created):**

```json
{
  "status": "sucesso",
  "token": "um_token_jwt_muito_longo_sera_retornado_aqui",
  "data": {
    "user": {
      "_id": "id",
      "nome": "Seu Nome",
      "email": "seu@email.com"
    }
  }
}
```

### 2. Realizar Login

Faça o login para obter um token de acesso.

- **Método:** POST
- **URL:** `{{base_url}}/auth/login`
- **Body (JSON):**

```json
{
  "email": "seu@email.com",
  "senha": "sua_senha"
}
```

- **Resposta Esperada (200 OK):** A resposta será semelhante à do cadastro, contendo o token.

### 3. Armazenar o Token de Acesso

Após o login, o token precisa ser armazenado na sua variável de ambiente do Insomnia.

1. Na resposta da requisição de login, copie o valor do campo token.
2. Volte para a configuração do seu ambiente.
3. Cole o token no valor da variável token.

Agora, todas as requisições que usarem `{{token}}` estarão autenticadas.

### 4. Buscar Perfil do Usuário

- **Método:** GET
- **URL:** `{{base_url}}/auth/perfil`
- **Aba de Autenticação (Auth):**

  - **TYPE:** Bearer Token
  - **TOKEN:** `{{token}}`

- **Resposta Esperada (200 OK):**

```json
{
  "status": "sucesso",
  "data": {
    "user": {
      "_id": "68742a4c838915e831d1dde3",
      "nome": "Teste Usuario",
      "email": "teste@itamind.com",
      "createdAt": "2025-07-13T21:51:08.134Z",
      "updatedAt": "2025-07-13T21:51:08.134Z",
      "__v": 0
    }
  }
}
```

## Passo 3: Endpoints de Previsão

A maioria destes endpoints requer autenticação.

### Obter Previsão Padrão

- **Método:** GET
- **URL:** `{{base_url}}/previsao/default`
- **Autenticação:** Bearer Token com `{{token}}`

- **Resposta Esperada (200 OK):**

```json
{
  "previsoes": [
    {
      "sku": 237479,
      "rmse": 13.839933913621323,
      "mape": 8.963000335063656,
      "previsoes": [
        {
          "ds": "2025-06-23T00:00:00",
          "yhat": 124.29249027333503,
          "yhat_lower": 107.57235517237119,
          "yhat_upper": 141.36536876157086
        },
        {
          "ds": "2025-06-24T00:00:00",
          "yhat": 125.36437288197209,
          "yhat_lower": 108.2902537809948,
          "yhat_upper": 144.576525546286
        },
        {
          "ds": "2025-06-25T00:00:00",
          "yhat": 126.44048978036095,
          "yhat_lower": 108.98601674788726,
          "yhat_upper": 144.58960302355777
        },
        {
          "ds": "2025-06-26T00:00:00",
          "yhat": 129.65207858428462,
          "yhat_lower": 112.00505445399841,
          "yhat_upper": 146.2990965198416
        },
        {
          "ds": "2025-06-27T00:00:00",
          "yhat": 122.9099781642664,
          "yhat_lower": 105.36502456136117,
          "yhat_upper": 140.7221049676207
        },
        {
          "ds": "2025-06-28T00:00:00",
          "yhat": 125.50144863231162,
          "yhat_lower": 108.26762274293063,
          "yhat_upper": 143.6117534290485
        },
        {
          "ds": "2025-06-29T00:00:00",
          "yhat": 108.9956570774256,
          "yhat_lower": 91.30634788139845,
          "yhat_upper": 124.54147932431576
        }
      ]
    }
  ],
  "fonte": "cache"
}
```

### Relatório Diário

**Endpoint**: `GET /api/previsao/relatorio-diario`

**Descrição**: Gera um relatório operacional diário com informações sobre quantidades a retirar, em descongelamento e prontas para venda.

**Autenticação**: Requer token JWT

**Parâmetros de Query**:

- `sku` (obrigatório): ID do produto para análise
- `data_alvo` (obrigatório): Data para o relatório no formato AAAA-MM-DD

**Exemplo de Requisição**:

```http
GET {{base_url}}/previsao/relatorio-diario?sku=237479&data_alvo=2025-06-25
Authorization: Bearer {{token}}
```

**Exemplo de Resposta**:

```json
{
  "relatorio": {
    "data_retirada": "25/06/2025",
    "sku": 237479,
    "kg_a_retirar": 144.6,
    "kg_em_descongelamento": 152.53,
    "kg_para_venda_hoje": 126.44
  },
  "sku": 237479,
  "data_alvo": "2025-06-25"
}
```

### Gerar Nova Previsão com CSV (Atualmente não está funcionando)

- **Método:** POST
- **URL:** `{{base_url}}/previsao/previsao`
- **Autenticação:** Bearer Token com `{{token}}`
- **Body (JSON):**

```json
{
  "csvData": "data_dia;id_produto;total_venda_dia_kg..."
}
```

### Utilitários de Lote (Não Requerem Autenticação)

#### Calcular Retirada

- **Método:** POST
- **URL:** `{{base_url}}/previsao/calcular_retirada`
- **Body (JSON):**

```json
{
  "quantidade_prevista": 100,
  "percentual_perda": 15
}
```

- **Resposta Esperada:**

```json
{
  "retirada_kg": 118
}
```

#### Calcular Idade do Lote

- **Método:** POST
- **URL:** `{{base_url}}/previsao/calcular_idade_lote`
- **Body (JSON):**

```json
{
  "data_retirada": "2025-04-05",
  "data_venda": "2025-04-07"
}
```

- **Resposta Esperada:**

```json
{
  "idade_lote": "Dia 3 (Venda)"
}
```

#### Obter Estágio do Lote

- **Método:** POST
- **URL:** `{{base_url}}/previsao/obter_estagio_lote`
- **Body (JSON):**

```json
{
  "data_retirada": "2025-07-14"
}
```

- **Resposta Esperada:**

```json
{
  "estagio_lote": "Descongelando (Dia 1)"
}
```

### Gerenciamento de Previsões Salvas (Requer Autenticação)

- **GET** `{{base_url}}/previsao/salvas`: Lista previsões salvas.
- **GET** `{{base_url}}/previsao/salvas/:id`: Busca uma previsão pelo ID.
- **DELETE** `{{base_url}}/previsao/salvas/:id`: Deleta uma previsão pelo ID.

---

## Passo 4: Sistema de Retiradas

O sistema de retiradas permite registrar e acompanhar produtos retirados do freezer, controlando todo o ciclo até a venda final.

### 🔄 Ciclo de Vida de uma Retirada

1. **Esquerda** (Dia 0): Produto recém-retirado do freezer
2. **Central** (Dia 1): Primeiro dia de descongelamento
3. **Venda** (Dia 2): Pronto para venda
4. **Vencido** (Dia 3+): Passou do tempo ideal

### 1. Registrar Nova Retirada

- **Método:** POST
- **URL:** `{{base_url}}/retiradas/registrar`
- **Autenticação:** Bearer Token com `{{token}}`
- **Body (JSON):**

```json
{
  "id_produto": 237479,
  "data_retirada": "2025-07-15",
  "quantidade_kg": 150.5,
  "data_venda_prevista": "2025-07-18",
  "observacoes": "Lote para venda no fim de semana"
}
```

- **Resposta Esperada:**

```json
{
  "message": "Retirada registrada com sucesso",
  "retirada": {
    "_id": "6875e340d4e0d34a7605037b",
    "id_produto": 237479,
    "data_retirada": "2025-07-15T00:00:00.000Z",
    "quantidade_kg": 150.5,
    "lote": "237479_20250714_2638",
    "data_venda_prevista": "2025-07-18T00:00:00.000Z",
    "estagio_atual": "esquerda",
    "idade_dias": 0,
    "status": "ativa",
    "quantidade_vendida": 0,
    "usuario_id": "68742a4c838915e831d1dde3",
    "observacoes": "Lote para teste do sistema",
    "data_decisao": "2025-07-15T05:12:32.639Z",
    "createdAt": "2025-07-15T05:12:32.640Z",
    "updatedAt": "2025-07-15T05:12:32.640Z",
    "__v": 0
  }
}
```

### 2. Buscar Retiradas

- **Método:** GET
- **URL:** `{{base_url}}/retiradas/buscar`
- **Autenticação:** Bearer Token com `{{token}}`
- **Parâmetros de Query (todos opcionais):**
  - `id_produto`: Filtrar por produto específico
  - `estagio`: esquerda, central, venda, vencido
  - `status`: ativa, vendida, descartada
  - `data_inicio` / `data_fim`: Período de busca
  - `lote`: Buscar por lote específico
  - `page` / `limit`: Paginação (padrão: page=1, limit=10)

**Exemplo:**

```http
GET {{base_url}}/retiradas/buscar?id_produto=237479&estagio=venda&page=1&limit=10
Authorization: Bearer {{token}}
```

- **Resposta Esperada:**

```json
{
  "retiradas": [
    {
      "_id": "6875dd7f851ac8097e6dade4",
      "id_produto": 237479,
      "data_retirada": "2025-07-15T00:00:00.000Z",
      "quantidade_kg": 150.5,
      "lote": "237479_20250714_9756",
      "estagio_atual": "central",
      "idade_dias": 1,
      "status": "ativa",
      "usuario_id": {
        "_id": "68742a4c838915e831d1dde3",
        "nome": "Teste Usuario",
        "email": "teste@itamind.com"
      },
      "observacoes": "Lote para venda no fim de semana"
    }
  ],
  "total": 5,
  "page": 1,
  "total_pages": 1
}
```

### 3. Obter Retirada Específica

- **Método:** GET
- **URL:** `{{base_url}}/retiradas/{id}`
- **Autenticação:** Bearer Token com `{{token}}`

**Exemplo:**

```http
GET {{base_url}}/retiradas/6875dd7f851ac8097e6dade4
Authorization: Bearer {{token}}
```

- **Resposta Esperada:**

```json
{
  "retirada": {
    "_id": "6875dd7f851ac8097e6dade4",
    "id_produto": 237479,
    "data_retirada": "2025-07-15T00:00:00.000Z",
    "quantidade_kg": 150.5,
    "lote": "237479_20250714_9756",
    "data_venda_prevista": "2025-07-17T00:00:00.000Z",
    "estagio_atual": "central",
    "idade_dias": 1,
    "status": "ativa",
    "quantidade_vendida": 0,
    "usuario_id": {
      "_id": "68742a4c838915e831d1dde3",
      "nome": "Teste Usuario",
      "email": "teste@itamind.com"
    },
    "observacoes": "Lote para venda no fim de semana",
    "data_decisao": "2025-07-15T04:47:59.756Z",
    "createdAt": "2025-07-15T04:47:59.757Z",
    "updatedAt": "2025-07-15T04:47:59.757Z",
    "__v": 0
  },
  "informacoes_atuais": {
    "idade_atual": 1,
    "estagio_atual": "central",
    "no_prazo": true,
    "quantidade_liquida_estimada": 127.925
  }
}
```

### 4. Atualizar Estágio

- **Método:** PUT
- **URL:** `{{base_url}}/retiradas/estagio/{id}`
- **Autenticação:** Bearer Token com `{{token}}`
- **Body (JSON):**

```json
{
  "estagio": "central"
}
```

**Nota:** Estágio deve ser: esquerda, central, venda ou vencido.

### 5. Registrar Venda

- **Método:** PUT
- **URL:** `{{base_url}}/retiradas/venda/{id}`
- **Autenticação:** Bearer Token com `{{token}}`
- **Body (JSON):**

```json
{
  "quantidade_vendida": 125.0,
  "data_venda_real": "2025-01-17",
  "observacoes": "Venda realizada com sucesso"
}
```

### 6. Relatório de Retiradas

- **Método:** GET
- **URL:** `{{base_url}}/retiradas/relatorio`
- **Autenticação:** Bearer Token com `{{token}}`
- **Parâmetros de Query:**
  - `data_inicio` (obrigatório): Data inicial do período
  - `data_fim` (obrigatório): Data final do período
  - `id_produto` (opcional): Filtrar por produto específico

**Exemplo:**

```http
GET {{base_url}}/retiradas/relatorio?data_inicio=2025-07-15&data_fim=2025-07-18&id_produto=237479
Authorization: Bearer {{token}}
```

- **Resposta Esperada:**

```json
{
  "periodo": {
    "data_inicio": "2025-07-15",
    "data_fim": "2025-07-18"
  },
  "relatorio": {
    "detalhes": [
      {
        "_id": 237479,
        "total_retiradas": 2,
        "quantidade_retirada": 301,
        "quantidade_vendida": 125,
        "quantidade_em_estoque": 176
      }
    ],
    "total_geral_retiradas": 2,
    "quantidade_geral_retirada": 301,
    "quantidade_geral_vendida": 125
  }
}
```

### Cenários de Teste para Retiradas

#### Cenário 1: Fluxo Completo

1. **Registrar retirada** para hoje
2. **Buscar retiradas** com filtro de estágio "esquerda"
3. **Atualizar estágio** para "central" após 1 dia
4. **Atualizar estágio** para "venda" após 2 dias
5. **Registrar venda** com quantidade parcial
6. **Gerar relatório** do período

#### Cenário 2: Controle de Perdas

1. **Registrar retirada** de 100kg
2. **Verificar quantidade líquida** estimada (85kg após 15% de perda)
3. **Registrar venda** de apenas 80kg
4. **Analisar diferença** entre previsto e real

#### Cenário 3: Lotes Vencidos

1. **Registrar retirada** com data antiga (>3 dias)
2. **Verificar estágio** "vencido"
3. **Buscar lotes vencidos** para controle

---

## Tabela de Referência Completa

| Endpoint                        | Método | Autenticação | Descrição                                   |
| ------------------------------- | ------ | ------------ | ------------------------------------------- |
| **AUTENTICAÇÃO**                |        |              |                                             |
| `/auth/cadastrar`               | POST   | ❌ Não       | Registra um novo usuário                    |
| `/auth/login`                   | POST   | ❌ Não       | Autentica usuário e retorna token           |
| `/auth/perfil`                  | GET    | ✅ Sim       | Busca perfil do usuário logado              |
| **PREVISÕES**                   |        |              |                                             |
| `/previsao/default`             | GET    | ✅ Sim       | Obtém previsão com dados padrão             |
| `/previsao/relatorio-diario`    | GET    | ✅ Sim       | Relatório operacional diário                |
| `/previsao/previsao`            | POST   | ✅ Sim       | Gera nova previsão com dados CSV            |
| `/previsao/salvas`              | GET    | ✅ Sim       | Lista previsões salvas                      |
| `/previsao/salvas/:id`          | GET    | ✅ Sim       | Busca previsão específica por ID            |
| `/previsao/salvas/:id`          | DELETE | ✅ Sim       | Deleta previsão específica por ID           |
| `/previsao/calcular_retirada`   | POST   | ❌ Não       | Calcula quantidade a ser retirada           |
| `/previsao/calcular_idade_lote` | POST   | ❌ Não       | Calcula "idade" de um lote                  |
| `/previsao/obter_estagio_lote`  | POST   | ❌ Não       | Obtém estágio de um lote hoje               |
| **RETIRADAS**                   |        |              |                                             |
| `/retiradas/registrar`          | POST   | ✅ Sim       | Registra nova retirada do freezer           |
| `/retiradas/buscar`             | GET    | ✅ Sim       | Busca retiradas com filtros                 |
| `/retiradas/:id`                | GET    | ✅ Sim       | Obtém retirada específica por ID            |
| `/retiradas/estagio/:id`        | PUT    | ✅ Sim       | Atualiza estágio do lote                    |
| `/retiradas/venda/:id`          | PUT    | ✅ Sim       | Registra venda de um lote                   |
| `/retiradas/relatorio`          | GET    | ✅ Sim       | Relatório agregado de retiradas por período |
| **UTILITÁRIOS**                 |        |              |                                             |
| `/ping`                         | GET    | ❌ Não       | Verifica se a API está online               |

## Validações Implementadas

### Sistema de Retiradas

- **ID do produto**: Número inteiro positivo obrigatório
- **Data de retirada**: Data válida obrigatória
- **Quantidade**: Número positivo obrigatório
- **Estágio**: Apenas valores válidos (esquerda, central, venda, vencido)
- **Status**: Apenas valores válidos (ativa, vendida, descartada)
- **Paginação**: Máximo 100 itens por página

### Sistema de Previsões

- **SKU**: Número inteiro positivo obrigatório
- **Data alvo**: Data válida no formato AAAA-MM-DD
- **Dados CSV**: Formato específico para upload
- **Percentual de perda**: Entre 0 e 100
