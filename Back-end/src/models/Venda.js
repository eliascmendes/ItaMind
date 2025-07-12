const mongoose = require('mongoose')

// modelo para armazenar o histórico de vendas diárias
// dados usados para treinamento dos modelos de previsão

const esquemaVenda = new mongoose.Schema(
  {
    // dia da venda registrada
    data_dia: {
      type: Date,
      required: [true, 'Data da venda é obrigatória'],
      index: true,
    },

    // qual produto foi vendido
    id_produto: {
      type: Number,
      required: [true, 'ID do produto é obrigatório'],
      index: true,
    },

    // total vendido naquele dia em quilogramas
    total_venda_dia_kg: {
      type: Number,
      required: [true, 'Total de vendas do dia é obrigatório'],
      min: [0, 'Total de vendas deve ser positivo'],
    },

    // quantas unidades foram vendidas
    quantidade_vendida: {
      type: Number,
      required: [true, 'Quantidade vendida é obrigatória'],
      min: [0, 'Quantidade vendida deve ser positiva'],
    },

    // valor total em reais da venda do dia
    valor_total: {
      type: Number,
      required: [false, 'Valor'],
      min: [0, 'Valor total deve ser positivo'],
    },

    // preço praticado por quilo naquele dia
    preco_kg: {
      type: Number,
      required: [false, 'Preço'],
      min: [0, 'Preço por kg deve ser positivo'],
    },

    // identificação do lote vendido
    lote: {
      type: String,
      required: [false, 'Lote'],
      trim: true,
    },

    // quando o produto foi retirado do freezer
    data_retirada: {
      type: Date,
      required: [true, 'Data de retirada é obrigatória'],
    },

    // até quando o produto estava válido
    data_validade: {
      type: Date,
      required: [false, 'Data de validade'],
    },

    // onde a venda foi realizada
    canal_venda: {
      type: String,
      enum: ['loja', 'delivery', 'atacado', 'online'],
      default: 'loja',
    },

    // campo livre para informações extras
    observacoes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'vendas',
  }
)

esquemaVenda.index({ data_dia: 1, id_produto: 1 }) // vendas por produto e data
esquemaVenda.index({ id_produto: 1, data_dia: -1 }) // histórico de um produto
esquemaVenda.index({ lote: 1 }) // rastreamento por lote
esquemaVenda.index({ canal_venda: 1 }) // filtrar por canal

module.exports = mongoose.model('Venda', esquemaVenda)
