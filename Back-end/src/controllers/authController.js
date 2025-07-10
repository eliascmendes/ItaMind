const jwt = require('jsonwebtoken');
const User = require('../models/User');

const gerarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// resposta com token
const criarEnvioToken = (user, statusCode, res) => {
  const token = gerarToken(user._id);
  
  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.senha = undefined;

  res.status(statusCode).json({
    status: 'sucesso',
    token,
    data: {
      user
    }
  });
};

const cadastrar = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({
        status: 'erro',
        message: 'Usuário já existe com este email'
      });
    }

    const novoUsuario = await User.create({
      nome,
      email,
      senha
    });

    criarEnvioToken(novoUsuario, 201, res);
  } catch (error) {
    res.status(400).json({
      status: 'erro',
      message: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // verificar se email e senha foram fornecidos
    if (!email || !senha) {
      return res.status(400).json({
        status: 'erro',
        message: 'Por favor, forneça email e senha'
      });
    }

    // verificar se usuário existe e senha está correta
    const user = await User.findOne({ email }).select('+senha');

    if (!user || !(await user.compararSenha(senha))) {
      return res.status(401).json({
        status: 'erro',
        message: 'Email ou senha incorretos'
      });
    }

    criarEnvioToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      status: 'erro',
      message: error.message
    });
  }
};

const buscarPerfil = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      status: 'sucesso',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'erro',
      message: error.message
    });
  }
};

module.exports = {
  cadastrar,
  login,
  buscarPerfil
}; 