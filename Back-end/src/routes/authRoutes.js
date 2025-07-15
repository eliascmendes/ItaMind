const express = require('express')
const { cadastrar, login, buscarPerfil, recuperarSenha } = require('../controllers/authController')
const { autenticar } = require('../middlewares/auth')
const { validarCadastro, validarLogin, validarRecuperarSenha } = require('../middlewares/validacao')

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Autenticação
 *   description: Endpoints para autenticação e gerenciamento de usuários
 */

/**
 * @swagger
 * /api/auth/cadastrar:
 *   post:
 *     summary: Cadastrar novo usuário
 *     description: Cria uma nova conta de usuário no sistema
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CadastroUsuario'
 *           example:
 *             nome: "Itamind"
 *             email: "itamind@itamind.com"
 *             senha: "123456789"
 *     responses:
 *       201:
 *         description: Usuário cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespostaSucesso'
 *             example:
 *               status: "sucesso"
 *               token: "chavealeatoria"
 *               data:
 *                 user:
 *                   _id: "id_user"
 *                   nome: "Itamind"
 *                   email: "itamind@itamind.com"
 *                   createdAt: "2025"
 *                   updatedAt: "2025"
 *       400:
 *         description: Erro de validação ou usuário já existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespostaErro'
 *             examples:
 *               usuarioExiste:
 *                 summary: Usuário já existe
 *                 value:
 *                   status: "erro"
 *                   message: "Usuário já existe com este email"
 *               validacao:
 *                 summary: Erro de validação
 *                 value:
 *                   status: "erro"
 *                   message: "Nome deve ter pelo menos 2 caracteres"
 */
router.post('/cadastrar', validarCadastro, cadastrar)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Fazer login
 *     description: Autentica um usuário existente no sistema
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginUsuario'
 *           example:
 *             email: "itamind@itamind.com"
 *             senha: "123456789"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespostaSucesso'
 *             example:
 *               status: "sucesso"
 *               token: "chavealeatoria"
 *               data:
 *                 user:
 *                   _id: "id_user"
 *                   nome: "Itamind"
 *                   email: "itamind@itamind.com"
 *                   createdAt: "2025"
 *                   updatedAt: "2025"
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespostaErro'
 *             example:
 *               status: "erro"
 *               message: "Por favor, forneça email e senha"
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespostaErro'
 *             example:
 *               status: "erro"
 *               message: "Email ou senha incorretos"
 */
router.post('/login', validarLogin, login)

/**
 * @swagger
 * /api/auth/recuperar-senha:
 *   post:
 *     summary: Recuperar senha
 *     description: Permite ao usuário redefinir sua senha fornecendo email e nova senha
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               novaSenha:
 *                 type: string
 *                 minLength: 6
 *           example:
 *             email: "itamind@itamind.com"
 *             novaSenha: "novasenha123"
 *     responses:
 *       200:
 *         description: Senha atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "sucesso"
 *                 message:
 *                   type: string
 *                   example: "Senha atualizada com sucesso"
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespostaErro'
 *             example:
 *               status: "erro"
 *               message: "Por favor, forneça email e nova senha"
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespostaErro'
 *             example:
 *               status: "erro"
 *               message: "Usuário não encontrado"
 */
router.post('/recuperar-senha', validarRecuperarSenha, recuperarSenha)

/**
 * @swagger
 * /api/auth/perfil:
 *   get:
 *     summary: Buscar perfil do usuário
 *     description: Retorna os dados do perfil do usuário autenticado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/Usuario'
 *             example:
 *               status: "sucesso"
 *               data:
 *                 user:
 *                   _id: "id_user"
 *                   nome: "Itamind"
 *                   email: "itamind@itamind.com"
 *                   createdAt: "2025"
 *                   updatedAt: "2025"
 *       400:
 *         description: Erro ao buscar perfil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespostaErro'
 *             example:
 *               status: "erro"
 *               message: "Erro interno do servidor"
 *       401:
 *         description: Token não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespostaErro'
 *             example:
 *               status: "erro"
 *               message: "Token de acesso necessário"
 */
router.get('/perfil', autenticar, buscarPerfil)

module.exports = router
