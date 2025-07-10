const jwt = require('jsonwebtoken');
const User = require('../models/User');

const autenticar = async (req, res, next) => {
  try {
    // obter token
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: 'erro',
        message: 'Você não está logado! Por favor, faça login para ter acesso.'
      });
    }

    // verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // verificar se o usuário ainda existe
    const usuarioAtual = await User.findById(decoded.id);
    if (!usuarioAtual) {
      return res.status(401).json({
        status: 'erro',
        message: 'O usuário que possui este token não existe mais.'
      });
    }

    // conceder acesso à rota protegida
    req.user = usuarioAtual;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'erro',
        message: 'Token inválido. Por favor, faça login novamente!'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'erro',
        message: 'Seu token expirou! Por favor, faça login novamente.'
      });
    }

    res.status(500).json({
      status: 'erro',
      message: 'Algo deu errado'
    });
  }
};

module.exports = { autenticar }; 