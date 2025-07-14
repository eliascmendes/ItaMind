# Testando a API ItaMind com Insomnia

Este guia serve como um tutorial passo a passo para configurar e testar a API usando o [Insomnia](https://insomnia.rest/).

## Passo 1: Configuração do Ambiente no Insomnia

Ambientes no Insomnia nos ajudam a gerenciar variáveis como a URL da API e tokens de autenticação.

1.  No Insomnia, vá para o painel de ambientes, procure por Base Environment.
2.  Busque pelo ícone de edição
3.  Clique em Add
2.  Em "input Name" escolha um nome para o seu ambiente (ex: ItaMind).
3.  Em "input Value" adicione as seguintes variáveis no formato JSON:

    json
    {
      "base_url": "https://itamind.onrender.com/api",
      "token": ""
    }
    

    - base_url: A URL base da API.
    - token: Token que será preenchido após o login.

## Passo 2: Autenticação

Para interagir com a API é necessário login, caso não possua, é necessário registrar um usuário e obter um token de acesso.

### 1. Cadastrar um Novo Usuário

Crie uma requisição POST para registrar um novo usuário.

- *Método:* POST
- *URL:* {{base_url}}/auth/cadastrar
- *Body (JSON):*

  json
  {
    "nome": "Seu Nome",
    "email": "seu@email.com",
    "senha": "sua_senha_segura"
  }
  

- *Resposta Esperada (201 Created):*

  json
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
  

### 2. Realizar Login

Faça o login para obter um token de acesso.

- *Método:* POST
- *URL:* {{base_url}}/auth/login
- *Body (JSON):*

  json
  {
    "email": "seu@email.com",
    "senha": "sua_senha"
  }
  

- *Resposta Esperada (200 OK):* A resposta será semelhante à do cadastro, contendo o token.

### 3. Armazenar o Token de Acesso

Após o login, o token precisa ser armazenado na sua variável de ambiente do Insomnia.

1.  Na resposta da requisição de login, copie o valor do campo token.
2.  Volte para a configuração do seu ambiente.
3.  Cole o token no valor da variável token.

Agora, todas as requisições que usarem {{token}} estarão autenticadas.

## Passo 3: Usando Endpoints Autenticados

Com o token configurado, você pode acessar as rotas protegidas.

### Buscar Perfil do Usuário

- *Método:* GET
- *URL:* {{base_url}}/auth/perfil
- *Aba de Autenticação (Auth):*

  - *TYPE:* Bearer Token
  - *TOKEN:* {{token}} 

- *Resposta Esperada (200 OK):*

  json
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
  

## Passo 4: Endpoints de Previsão

A maioria destes endpoints requer autenticação.
### Obter Previsão Padrão

- *Método:* GET
- *URL:* {{base_url}}/previsao/default
- *Autenticação:* Bearer Token com {{token}}

- *Resposta Esperada (200 OK):*
json
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

### Gerar Nova Previsão com CSV (Atualmente não está funcionando)

- *Método:* POST
- *URL:* {{base_url}}/previsao/previsao
- *Autenticação:* Bearer Token com {{token}}
- *Body (JSON):*

  json
  {
    "csvData": "data_dia;id_produto;total_venda_dia_kg
  }
  

### Utilitários de Lote (Não Requerem Autenticação)

#### Calcular Retirada

- *Método:* POST
- *URL:* {{base_url}}/previsao/calcular_retirada
- *Body (JSON):*

  json
  {
    "quantidade_prevista": 100,
    "percentual_perda": 15
  }
  

- *Resposta Esperada:*

  json
  {
    "retirada_kg": 118
  }
  

#### Calcular Idade do Lote

- *Método:* POST
- *URL:* {{base_url}}/previsao/calcular_idade_lote
- *Body (JSON):*

  json
  {
    "data_retirada": "2025-04-05",
    "data_venda": "2025-04-07"
  }
  
  

- *Resposta Esperada:*

  json
  {
    "idade_lote": "Dia 3 (Venda)"
  }
  

#### Obter Estágio do Lote (Precisa dos valores salvos no banco de dados)

- *Método:* POST
- *URL:* {{base_url}}/previsao/obter_estagio_lote
- *Body (JSON):*

  json
  {
    "data_retirada": "2025-07-14"
  }
  

- *Resposta Esperada :*

  json
 {
	"estagio_lote": "Descongelando (Dia 1)"
}
  

### Gerenciamento de Previsões Salvas (Requer Autenticação)

- *GET {{base_url}}/previsao/salvas*: Lista previsões salvas.
- *GET {{base_url}}/previsao/salvas/:id*: Busca uma previsão pelo ID. (Necessário revisão)
- *DELETE {{base_url}}/previsao/salvas/:id*: Deleta uma previsão pelo ID. (Necessário revisão)

---

## Tabela de Referência

| Endpoint                        | Método   | Autenticação | Descrição                                |
| ------------------------------- | -------- | ------------ | ---------------------------------------- |
| /auth/cadastrar               | POST   | ❌ Não       | Registra um novo usuário.                |
| /auth/login                   | POST   | ❌ Não       | Autentica um usuário e retorna um token. |
| /auth/perfil                  | GET    | ✅ Sim       | Busca o perfil do usuário logado.        |
| /previsao/default             | GET    | ✅ Sim       | Obtém a previsão com dados padrão.       |
| /previsao/previsao            | POST   | ✅ Sim       | Gera uma nova previsão com dados CSV.    |
| /previsao/salvas              | GET    | ✅ Sim       | Lista as previsões salvas no banco.      |
| /previsao/salvas/:id          | GET    | ✅ Sim       | Busca uma previsão específica por ID.    |
| /previsao/salvas/:id          | DELETE | ✅ Sim       | Deleta uma previsão específica por ID.   |
| /previsao/calcular_retirada   | POST   | ❌ Não       | Calcula a quantidade a ser retirada.     |
| /previsao/calcular_idade_lote | POST   | ❌ Não       | Calcula a "idade" de um lote.            |
| /previsao/obter_estagio_lote  | POST   | ❌ Não       | Obtém o estágio de um lote hoje.         |
| /ping                         | GET    | ❌ Não       | Verifica se a API está online.           |