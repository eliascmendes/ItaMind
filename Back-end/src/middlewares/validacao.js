const Joi = require('joi');

// esquema de validação para cadastro
const esquemaCadastro = Joi.object({
  nome: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 50 caracteres',
      'any.required': 'Nome é obrigatório'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email deve ter um formato válido',
      'any.required': 'Email é obrigatório'
    }),
  senha: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Senha deve ter pelo menos 6 caracteres',
      'any.required': 'Senha é obrigatória'
    })
});

// esquema de validação para login
const esquemaLogin = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email deve ter um formato válido',
      'any.required': 'Email é obrigatório'
    }),
  senha: Joi.string()
    .required()
    .messages({
      'any.required': 'Senha é obrigatória'
    })
});

// middleware de validação
const validar = (esquema) => {
  return (req, res, next) => {
    const { error } = esquema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        status: 'erro',
        message: error.details[0].message
      });
    }
    
    next();
  };
};

module.exports = {
  validarCadastro: validar(esquemaCadastro),
  validarLogin: validar(esquemaLogin)
}; 