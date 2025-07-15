const Joi = require('joi')
// teste
// validação para registrar nova retirada
const validarRegistroRetirada = (req, res, next) => {
  const schema = Joi.object({
    id_produto: Joi.number().integer().positive().required().messages({
      'number.base': 'ID do produto deve ser um número',
      'number.integer': 'ID do produto deve ser um número inteiro',
      'number.positive': 'ID do produto deve ser positivo',
      'any.required': 'ID do produto é obrigatório',
    }),

    data_retirada: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .required()
      .messages({
        'string.base': 'Data de retirada deve ser uma string',
        'string.pattern.base': 'Data de retirada deve estar no formato YYYY-MM-DD',
        'any.required': 'Data de retirada é obrigatória',
      }),

    quantidade_kg: Joi.number().positive().precision(2).required().messages({
      'number.base': 'Quantidade deve ser um número',
      'number.positive': 'Quantidade deve ser positiva',
      'any.required': 'Quantidade é obrigatória',
    }),

    lote: Joi.string().trim().max(50).optional().messages({
      'string.base': 'Lote deve ser uma string',
      'string.max': 'Lote deve ter no máximo 50 caracteres',
    }),

    data_venda_prevista: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .messages({
        'string.base': 'Data de venda prevista deve ser uma string',
        'string.pattern.base': 'Data de venda prevista deve estar no formato YYYY-MM-DD',
      }),

    observacoes: Joi.string().trim().max(500).optional().messages({
      'string.base': 'Observações deve ser uma string',
      'string.max': 'Observações deve ter no máximo 500 caracteres',
    }),
  })

  const { error } = schema.validate(req.body)

  if (error) {
    const mensagemErro = error.details[0].message
    return res.status(400).json({
      error: mensagemErro,
    })
  }

  next()
}

// validação para registrar venda
const validarRegistroVenda = (req, res, next) => {
  const schema = Joi.object({
    quantidade_vendida: Joi.number().positive().precision(2).required().messages({
      'number.base': 'Quantidade vendida deve ser um número',
      'number.positive': 'Quantidade vendida deve ser positiva',
      'any.required': 'Quantidade vendida é obrigatória',
    }),

    data_venda_real: Joi.date().iso().optional().messages({
      'date.base': 'Data de venda deve ser uma data válida',
      'date.format': 'Data de venda deve estar no formato ISO',
    }),
  })

  const { error } = schema.validate(req.body)

  if (error) {
    const mensagemErro = error.details[0].message
    return res.status(400).json({
      error: mensagemErro,
    })
  }

  next()
}

// validação para atualizar estágio do lote
const validarAtualizacaoEstagio = (req, res, next) => {
  const schema = Joi.object({
    novo_estagio: Joi.string()
      .valid('esquerda', 'central', 'venda', 'vencido')
      .required()
      .messages({
        'any.only': 'Estágio deve ser: esquerda, central, venda ou vencido',
        'any.required': 'Novo estágio é obrigatório',
      }),

    observacoes: Joi.string().trim().max(500).optional().messages({
      'string.base': 'Observações deve ser uma string',
      'string.max': 'Observações deve ter no máximo 500 caracteres',
    }),
  })

  const { error } = schema.validate(req.body)

  if (error) {
    const mensagemErro = error.details[0].message
    return res.status(400).json({
      error: mensagemErro,
    })
  }

  next()
}

// validação para parâmetros de busca
const validarParametrosBusca = (req, res, next) => {
  const schema = Joi.object({
    id_produto: Joi.number().integer().positive().optional(),
    estagio: Joi.string().valid('esquerda', 'central', 'venda', 'vencido').optional(),
    data_inicio: Joi.date().iso().optional(),
    data_fim: Joi.date().iso().min(Joi.ref('data_inicio')).optional(),
    lote: Joi.string().trim().optional(),
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
  })

  const { error } = schema.validate(req.query)

  if (error) {
    const mensagemErro = error.details[0].message
    return res.status(400).json({
      error: mensagemErro,
    })
  }

  next()
}

// validação para parâmetros de relatório
const validarParametrosRelatorio = (req, res, next) => {
  const schema = Joi.object({
    data_inicio: Joi.date().iso().required().messages({
      'date.base': 'Data início deve ser uma data válida',
      'date.format': 'Data início deve estar no formato ISO (YYYY-MM-DD)',
      'any.required': 'Data início é obrigatória',
    }),

    data_fim: Joi.date().iso().min(Joi.ref('data_inicio')).required().messages({
      'date.base': 'Data fim deve ser uma data válida',
      'date.format': 'Data fim deve estar no formato ISO (YYYY-MM-DD)',
      'date.min': 'Data fim deve ser posterior à data início',
      'any.required': 'Data fim é obrigatória',
    }),

    estagio: Joi.string().valid('esquerda', 'central', 'venda', 'vencido').optional(),
    id_produto: Joi.number().integer().positive().optional(),
  })

  const { error } = schema.validate(req.query)

  if (error) {
    const mensagemErro = error.details[0].message
    return res.status(400).json({
      error: mensagemErro,
    })
  }

  next()
}

module.exports = {
  validarRegistroRetirada,
  validarRegistroVenda,
  validarAtualizacaoEstagio,
  validarParametrosBusca,
  validarParametrosRelatorio,
}
