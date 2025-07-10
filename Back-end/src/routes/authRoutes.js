const express = require('express');
const { cadastrar, login, buscarPerfil } = require('../controllers/authController');
const { autenticar } = require('../middlewares/auth');
const { validarCadastro, validarLogin } = require('../middlewares/validacao');

const router = express.Router();

router.post('/cadastrar', validarCadastro, cadastrar);

router.post('/login', validarLogin, login);

router.get('/perfil', autenticar, buscarPerfil);

module.exports = router; 