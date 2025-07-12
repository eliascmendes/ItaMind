const express = require('express');
const router = express.Router();
const {
    getPrevisao,
    postCalcularRetirada,
    postCalcularIdadeLote,
    postObterEstagioLote,
    getDefaultPrevisao
} = require('../controllers/previsaoController');

router.get('/default', getDefaultPrevisao);

router.post('/previsao', getPrevisao);

router.post('/calcular_retirada', postCalcularRetirada);

router.post('/calcular_idade_lote', postCalcularIdadeLote);

router.post('/obter_estagio_lote', postObterEstagioLote);

module.exports = router;
