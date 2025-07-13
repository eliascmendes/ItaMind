
# Algoritmo de Previsão de Vendas

![Status do Projeto](https://img.shields.io/badge/Status-Em_andamento-yellow)


Já se perguntou como evitar o desperdício de produtos congelados por falta de controle de estoque e validade? Este projeto aborda esse desafio, oferecendo um **algoritmo inteligente para prever a demanda de SKUs (focamos nas asas de frango).** A meta é simplificar a decisão de **quanto e quando descongelar**, assegurando que os produtos estejam frescos para venda em até 2 dias e minimizando perdas por excesso ou vencimento, por exemplo.


## 🛠️ Tecnologias Utilizadas

### **💻 Frontend**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white "HTML5 - Linguagem de marcação para estruturar o conteúdo web.")
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white "CSS3 - Linguagem de estilo para estilizar a aparência das páginas.")
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black "JavaScript - Linguagem de programação essencial para interatividade.")
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white "Bootstrap - Framework de frontend para um design responsivo e ágil.")
![Charts.js](https://img.shields.io/badge/Charts.js-FF6384?style=for-the-badge&logo=chart.js&logoColor=white "Charts.js - Biblioteca para criação de gráficos interativos e visualização de dados.")

### **⚙️ Backend**

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white "Node.js - Ambiente de execução JavaScript no servidor.")
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white "Express.js - Framework web minimalista para construir a API de forma eficiente.")

### **💾 Banco de Dados**

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white "MongoDB - Banco de dados NoSQL flexível e escalável.")
![Mongoose](https://img.shields.io/badge/Mongoose-800000?style=for-the-badge&logo=mongoose&logoColor=white "Mongoose - ODM para MongoDB, facilitando a interação e modelagem de dados.")

### **🔒 Segurança & Autenticação**

![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white "JWT - Padrão para autenticação e autorização seguras através de tokens.")
![bcrypt](https://img.shields.io/badge/bcrypt-000000?style=for-the-badge&logo=npm&logoColor=white "bcrypt - Biblioteca para hashing de senhas, protegendo as credenciais.")

### **✅ Validação & Documentação da API**

![Joi](https://img.shields.io/badge/Joi-B71C1C?style=for-the-badge&logo=joi&logoColor=white "Joi - Biblioteca robusta para validação de esquemas de dados.")
![Swagger / OpenAPI](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black "Swagger/OpenAPI - Para documentação interativa e visualização dos endpoints da API.")

### **🔧 Ferramentas de Desenvolvimento & Testes**

![Winston](https://img.shields.io/badge/Winston-000000?style=for-the-badge&logo=npm&logoColor=white "Winston - Sistema de logging flexível para monitoramento de eventos.")
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white "Jest - Framework de teste JavaScript com foco na simplicidade e velocidade.")


## Pré-requisitos

- Node.js (v16+)
- MongoDB (local ou Atlas)
- npm ou yarn

## Documentação da API (Swagger)

A documentação da API está disponível através do Swagger UI:

- **URL local**: http://localhost:3000/api-docs

## Rotas Disponíveis

### Autenticação

- `POST /api/auth/cadastrar` - Cadastrar novo usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/perfil` - Buscar perfil do usuário

## Estrutura do Projeto

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
### 🚀 As Mentes por Trás do Projeto

| Contribuidor | Função Principal                   | Contato                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| :----------- | :--------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Akira Alcantara** | Desenvolvedor Front-end e UI/UX Designer | [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com//Bakisune) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/akiraalcantara-bakisune) |
| **André Neves** | Product Owner (P.O) e contribuiu na Análise de Dados | [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/andrefnevess) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/andrefneves) |
| **Beatriz Costa** | Criação e manutenção da documentação do projeto| [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/usuarioC) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/usuarioC) |
| **Elias Mendes** | Desenvolvedor Back-end e contribuiu na ciência de dados| [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/eliascmendes) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/eliascmendhes) |
| **Eryck Torres** |  Desenvolvedor Front-end e UI/UX Designer | [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/EryckTorres) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/erycktorres/) |
| **Hevelyn Fernanda** | Scrum master e contribuiu na ciência de dados| [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/6hevelyn) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/hevelyn-fernanda-20562331a) |
| **Josué Florez** | Desenvolvedor Front-end | [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/JozzuFlorez) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/josué-silva-1aaab7364) |
| **Juan Leite** |Desenvolvedor Back-end e contribuiu na ciência de dados| [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Juanzito2017) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/juan-leite-315b1925a) |
| **Karen Angelytha** | Análista de dados  | [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/usuarioI) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/usuarioI) |
| **Thamyli Mykaelli** | Desenvolvedora Front-end  | [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/thamylli) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/usuarioJ) |


