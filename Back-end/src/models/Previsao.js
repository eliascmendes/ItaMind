const mongoose = require('mongoose')

// modelo para armazenar previsões de vendas geradas pelo sistema de machine learning
// este schema define como os dados de previsão são estruturados no banco de dados mongodb

const esquemaPrevisao = new mongoose.Schema(
  {
    // identificador único do produto
    sku: {
      type: Number,
      required: [true, 'SKU é obrigatório'],
      index: true, // índice para consultas rápidas por produto
    },

    // quando a previsão foi gerada
    data_previsao: {
      type: Date,
      required: [true, 'Data da previsão é obrigatória'],
      default: Date.now, // define como agora se não informado
    },

    rmse: {
      type: Number,
      required: [true, 'RMSE é obrigatório'],
      min: [0, 'RMSE deve ser positivo'],
    },

    mape: {
      type: Number,
      required: [true, 'MAPE é obrigatório'],
      min: [0, 'MAPE deve ser positivo'],
    },

    // array com as previsões dos próximos dias
    // cada item representa um dia futuro com sua previsão e intervalos de confiança
    previsoes: [
      {
        // a data para qual a previsão se refere
        ds: {
          type: Date,
          required: [true, 'Data da previsão é obrigatória'],
        },
        // yhat =  o valor previsto para vendas naquele dia
        yhat: {
          type: Number,
          required: [true, 'Valor previsto é obrigatório'],
        },
        // limite inferior do intervalo de confiança
        // cenário mais pessimista da previsão
        yhat_lower: {
          type: Number,
          required: [true, 'Limite inferior é obrigatório'],
        },
        // limite superior do intervalo de confiança
        // cenário mais otimista da previsão
        yhat_upper: {
          type: Number,
          required: [true, 'Limite superior é obrigatório'],
        },
      },
    ],

    // referência ao usuário que gerou a previsão
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // relacionamento com a collection de usuários
      required: [true, 'ID do usuário é obrigatório'],
    },

    // identifica qual versão do modelo de ml foi usada
    versao_modelo: {
      type: String,
      default: 'prophet_v1',
    },

    // armazena os parâmetros específicos usados no treinamento
    // ex: sazonalidade, feriados
    parametros_modelo: {
      type: Object,
      default: {},
    },
  },
  {
    // adiciona automaticamente campos createdAt e updatedAt
    timestamps: true,
    collection: 'previsoes',
  }
)

// índices para otimizar consultas frequentes no sistema
// buscar previsões de um produto específico ordenadas pela data mais recente
esquemaPrevisao.index({ sku: 1, data_previsao: -1 })

// buscar previsões de um usuário específico ordenadas pela data mais recente
esquemaPrevisao.index({ usuario_id: 1, data_previsao: -1 })

// exporta o modelo
module.exports = mongoose.model('Previsao', esquemaPrevisao)
