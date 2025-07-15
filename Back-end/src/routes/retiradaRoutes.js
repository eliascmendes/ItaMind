const express = require('express')
const {
  registrarRetirada,
  buscarRetiradas,
  atualizarEstagio,
  registrarVenda,
  relatorioRetiradas,
  obterRetiradaPorId,
} = require('../controllers/retiradaController')
const { autenticar } = require('../middlewares/auth')
const {
  validarRegistroRetirada,
  validarRegistroVenda,
  validarAtualizacaoEstagio,
  validarParametrosBusca,
  validarParametrosRelatorio,
} = require('../middlewares/validacaoRetirada')

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Retiradas
 *   description: Gerenciamento de retiradas do freezer e controle de lotes
 */

/**
 * @swagger
 * /api/retiradas/registrar:
 *   post:
 *     summary: Registrar nova retirada
 *     description: Registra uma nova retirada do freezer com controle de lote
 *     tags: [Retiradas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_produto
 *               - data_retirada
 *               - quantidade_kg
 *             properties:
 *               id_produto:
 *                 type: number
 *                 description: ID do produto
 *               data_retirada:
 *                 type: string
 *                 format: date
 *                 description: Data da retirada
 *               quantidade_kg:
 *                 type: number
 *                 description: Quantidade em kg
 *               lote:
 *                 type: string
 *                 description: ID do lote
 *               data_venda_prevista:
 *                 type: string
 *                 format: date
 *                 description: Data prevista para venda
 *               observacoes:
 *                 type: string
 *                 description: Observações adicionais
 *     responses:
 *       201:
 *         description: Retirada registrada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 */
router.post('/registrar', autenticar, validarRegistroRetirada, registrarRetirada)

/**
 * @swagger
 * /api/retiradas/buscar:
 *   get:
 *     summary: Buscar retiradas
 *     description: Busca retiradas com filtros opcionais
 *     tags: [Retiradas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id_produto
 *         schema:
 *           type: number
 *         description: Filtrar por produto
 *       - in: query
 *         name: estagio
 *         schema:
 *           type: string
 *           enum: [esquerda, central, venda, vencido]
 *         description: Filtrar por estágio
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ativa, vendida, descartada]
 *         description: Filtrar por status
 *       - in: query
 *         name: data_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial
 *       - in: query
 *         name: data_fim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *         description: Página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *         description: Itens por página
 *     responses:
 *       200:
 *         description: Lista de retiradas
 *       401:
 *         description: Não autenticado
 */
router.get('/buscar', autenticar, validarParametrosBusca, buscarRetiradas)

/**
 * @swagger
 * /api/retiradas/relatorio:
 *   get:
 *     summary: Relatório de retiradas
 *     description: Gera relatório agregado de retiradas por período
 *     tags: [Retiradas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: data_inicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial do período
 *       - in: query
 *         name: data_fim
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final do período
 *       - in: query
 *         name: id_produto
 *         schema:
 *           type: number
 *         description: Filtrar por produto específico
 *     responses:
 *       200:
 *         description: Relatório gerado
 *       400:
 *         description: Parâmetros obrigatórios faltando
 *       401:
 *         description: Não autenticado
 */
router.get('/relatorio', autenticar, validarParametrosRelatorio, relatorioRetiradas)

/**
 * @swagger
 * /api/retiradas/{id}:
 *   get:
 *     summary: Obter retirada por ID
 *     description: Busca uma retirada específica por ID
 *     tags: [Retiradas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da retirada
 *     responses:
 *       200:
 *         description: Dados da retirada
 *       404:
 *         description: Retirada não encontrada
 *       401:
 *         description: Não autenticado
 */
router.get('/:id', autenticar, obterRetiradaPorId)

/**
 * @swagger
 * /api/retiradas/estagio/{id}:
 *   put:
 *     summary: Atualizar estágio do lote
 *     description: Atualiza o estágio atual de um lote
 *     tags: [Retiradas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da retirada
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estagio_atual:
 *                 type: string
 *                 enum: [esquerda, central, venda, vencido]
 *                 description: Novo estágio
 *     responses:
 *       200:
 *         description: Estágio atualizado
 *       404:
 *         description: Retirada não encontrada
 *       401:
 *         description: Não autenticado
 */
router.put('/estagio/:id', autenticar, validarAtualizacaoEstagio, atualizarEstagio)

/**
 * @swagger
 * /api/retiradas/venda/{id}:
 *   put:
 *     summary: Registrar venda
 *     description: Registra a venda de uma retirada
 *     tags: [Retiradas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da retirada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantidade_vendida
 *             properties:
 *               quantidade_vendida:
 *                 type: number
 *                 description: Quantidade vendida em kg
 *               data_venda_real:
 *                 type: string
 *                 format: date
 *                 description: Data real da venda
 *     responses:
 *       200:
 *         description: Venda registrada
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Retirada não encontrada
 *       401:
 *         description: Não autenticado
 */
router.put('/venda/:id', autenticar, validarRegistroVenda, registrarVenda)

module.exports = router
