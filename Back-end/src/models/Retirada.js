const mongoose = require('mongoose')

// modelo para armazenar o histórico de retiradas do freezer
// registra quando produtos são retirados e acompanha sua evolução até a venda

const esquemaRetirada = new mongoose.Schema(
  {
    // identificador único do produto
    id_produto: {
      type: Number,
      required: [true, 'ID do produto é obrigatório'],
      index: true,
    },

    // quando a decisão de retirada foi tomada
    data_decisao: {
      type: Date,
      required: [true, 'Data da decisão é obrigatória'],
      default: Date.now,
    },

    // quando o produto foi efetivamente retirado do freezer
    data_retirada: {
      type: Date,
      required: [true, 'Data de retirada é obrigatória'],
    },

    // quantidade retirada em kg
    quantidade_kg: {
      type: Number,
      required: [true, 'Quantidade é obrigatória'],
      min: [0, 'Quantidade deve ser positiva'],
    },

    // identificação do lote
    lote: {
      type: String,
      required: [true, 'Lote é obrigatório'],
      trim: true,
    },

    // data prevista para venda
    data_venda_prevista: {
      type: Date,
      required: [true, 'Data prevista para venda é obrigatória'],
    },

    // estágio atual do lote no processo de descongelamento
    estagio_atual: {
      type: String,
      enum: ['esquerda', 'central', 'venda', 'vencido'],
      default: 'esquerda',
    },

    // idade do lote em dias desde a retirada
    idade_dias: {
      type: Number,
      default: 0,
      min: [0, 'Idade deve ser positiva'],
    },

    // status da retirada
    status: {
      type: String,
      enum: ['ativa', 'vendida', 'descartada'],
      default: 'ativa',
    },

    // quantidade efetivamente vendida
    quantidade_vendida: {
      type: Number,
      min: [0, 'Quantidade vendida deve ser positiva'],
      default: 0,
    },

    // data real da venda (quando ocorrer)
    data_venda_real: {
      type: Date,
    },

    // usuário que registrou a retirada
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ID do usuário é obrigatório'],
    },

    // observações adicionais
    observacoes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'retiradas',
  }
)

// índices para consultas otimizadas
esquemaRetirada.index({ id_produto: 1, data_retirada: -1 }) // histórico por produto
esquemaRetirada.index({ lote: 1 }) // busca por lote
esquemaRetirada.index({ estagio_atual: 1 }) // filtro por estágio
esquemaRetirada.index({ data_venda_prevista: 1 }) // cronograma de vendas
esquemaRetirada.index({ status: 1 }) // filtro por status
esquemaRetirada.index({ usuario_id: 1, data_retirada: -1 }) // retiradas por usuário

module.exports = mongoose.model('Retirada', esquemaRetirada)
