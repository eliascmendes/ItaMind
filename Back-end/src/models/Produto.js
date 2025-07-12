const mongoose = require('mongoose')

// modelo para armazenar informações dos produtos vendidos
// contém dados essenciais para controle de estoque e previsões

const esquemaProduto = new mongoose.Schema(
  {
    // identificador único do produto no sistema
    id_produto: {
      type: Number,
      required: [true, 'ID do produto é obrigatório'],
      unique: true, // não pode ter dois produtos com mesmo id
      index: true,
    },

    // nome comercial do prodauto
    nome: {
      type: String,
      required: [true, 'Nome do produto é obrigatório'],
      trim: true, // remove espaços extras no início e fim
    },

    // tipo/grupo do produto para organização
    categoria: {
      type: String,
      required: [true, 'Categoria é obrigatória'],
      trim: true,
    },

    // como o produto é medido para venda
    unidade_medida: {
      type: String,
      required: [true, 'Unidade de medida é obrigatória'],
      default: 'kg',
    },

    // peso de cada unidade individual do produto
    peso_unitario: {
      type: Number,
      required: [false, 'Peso unitário'],
      min: [0, 'Peso unitário deve ser positivo'],
    },

    // preço de venda atual do produto
    preco: {
      type: Number,
      required: [false, 'Preço'],
      min: [0, 'Preço deve ser positivo'],
    },

    // se o produto está disponível para venda
    ativo: {
      type: Boolean,
      default: true, // por padrão produtos são criados como ativos
    },

    // quantos dias o produto dura após ser retirado do freezer
    dias_validade: {
      type: Number,
      required: [false, 'Dias de validade'],
      min: [1, 'Dias de validade deve ser maior que 0'],
    },

    // como o produto deve ser armazenado
    temperatura_armazenamento: {
      type: String,
      enum: ['congelado', 'resfriado', 'ambiente'],
      default: 'congelado',
    },

    // campo livre para informações extras
    observacoes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'produtos',
  }
)

esquemaProduto.index({ nome: 1 }) // buscar por nome
esquemaProduto.index({ categoria: 1 }) // filtrar por categoria
esquemaProduto.index({ ativo: 1 }) // filtrar apenas produtos ativos

module.exports = mongoose.model('Produto', esquemaProduto)
