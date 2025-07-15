const Retirada = require('../models/Retirada')
const {
  calcularIdadeLote,
  obterEstagioLote,
  calcularDataVendaPrevista,
  verificarPrazoVenda,
  gerarIdLote,
  calcularQuantidadeLiquida,
} = require('../utils/loteUtils')

// registrar nova retirada do freezer
const registrarRetirada = async (req, res) => {
  try {
    const { id_produto, data_retirada, quantidade_kg, lote, data_venda_prevista, observacoes } =
      req.body

    const usuario_id = req.user?.id

    // validações obrigatórias
    if (!id_produto || !data_retirada || !quantidade_kg) {
      return res.status(400).json({
        error: 'Campos obrigatórios: id_produto, data_retirada, quantidade_kg',
      })
    }

    if (!usuario_id) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    // gerar lote se não fornecido
    const loteId = lote || gerarIdLote(id_produto, data_retirada)

    // calcular data de venda se não fornecida
    const dataVendaPrevista = data_venda_prevista
      ? new Date(data_venda_prevista)
      : calcularDataVendaPrevista(data_retirada)

    // calcular idade e estágio inicial
    const idade_dias = calcularIdadeLote(data_retirada)
    const estagio_atual = obterEstagioLote(data_retirada)

    const retirada = new Retirada({
      id_produto,
      data_retirada: new Date(data_retirada),
      quantidade_kg,
      lote: loteId,
      data_venda_prevista: dataVendaPrevista,
      idade_dias,
      estagio_atual,
      usuario_id,
      observacoes,
    })

    await retirada.save()

    res.status(201).json({
      message: 'Retirada registrada com sucesso',
      retirada,
    })
  } catch (error) {
    console.error('Erro ao registrar retirada:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// buscar retiradas com filtros
const buscarRetiradas = async (req, res) => {
  try {
    const {
      id_produto,
      data_inicio,
      data_fim,
      estagio,
      status,
      lote,
      page = 1,
      limit = 10,
    } = req.query

    const usuario_id = req.user?.id

    if (!usuario_id) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    // construir filtros
    const filtros = { usuario_id }

    if (id_produto) {
      filtros.id_produto = parseInt(id_produto)
    }

    if (estagio) {
      filtros.estagio_atual = estagio
    }

    if (status) {
      filtros.status = status
    }

    if (lote) {
      filtros.lote = { $regex: lote, $options: 'i' }
    }

    if (data_inicio || data_fim) {
      filtros.data_retirada = {}
      if (data_inicio) filtros.data_retirada.$gte = new Date(data_inicio)
      if (data_fim) filtros.data_retirada.$lte = new Date(data_fim)
    }

    // executar consulta
    const retiradas = await Retirada.find(filtros)
      .sort({ data_retirada: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('usuario_id', 'nome email')

    const total = await Retirada.countDocuments(filtros)

    res.json({
      retiradas,
      total,
      page: parseInt(page),
      total_pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Erro ao buscar retiradas:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// atualizar estágio e idade de uma retirada
const atualizarEstagio = async (req, res) => {
  try {
    const { id } = req.params
    const { estagio_atual } = req.body
    const usuario_id = req.user?.id

    if (!usuario_id) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    const retirada = await Retirada.findOne({ _id: id, usuario_id })

    if (!retirada) {
      return res.status(404).json({ error: 'Retirada não encontrada' })
    }

    // atualizar idade automaticamente
    const idade_dias = calcularIdadeLote(retirada.data_retirada)

    // usar estágio fornecido ou calcular automaticamente
    const estagioAtual = estagio_atual || obterEstagioLote(retirada.data_retirada)

    retirada.estagio_atual = estagioAtual
    retirada.idade_dias = idade_dias
    await retirada.save()

    res.json({
      message: 'Estágio atualizado com sucesso',
      retirada,
    })
  } catch (error) {
    console.error('Erro ao atualizar estágio:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// registrar venda de uma retirada
const registrarVenda = async (req, res) => {
  try {
    const { id } = req.params
    const { quantidade_vendida, data_venda_real } = req.body
    const usuario_id = req.user?.id

    if (!usuario_id) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    const retirada = await Retirada.findOne({ _id: id, usuario_id })

    if (!retirada) {
      return res.status(404).json({ error: 'Retirada não encontrada' })
    }

    // validar quantidade vendida
    if (quantidade_vendida > retirada.quantidade_kg) {
      return res.status(400).json({
        error: 'Quantidade vendida não pode ser maior que a quantidade retirada',
      })
    }

    // atualizar dados da venda
    retirada.quantidade_vendida = quantidade_vendida
    retirada.data_venda_real = data_venda_real ? new Date(data_venda_real) : new Date()
    retirada.status = 'vendida'

    await retirada.save()

    res.json({
      message: 'Venda registrada com sucesso',
      retirada,
    })
  } catch (error) {
    console.error('Erro ao registrar venda:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// obter relatório de retiradas por período
const relatorioRetiradas = async (req, res) => {
  try {
    const { data_inicio, data_fim, id_produto } = req.query
    const usuario_id = req.user?.id

    if (!usuario_id) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    if (!data_inicio || !data_fim) {
      return res.status(400).json({ error: 'data_inicio e data_fim são obrigatórios' })
    }

    // converter datas corretamente
    const dataInicio = new Date(data_inicio)
    const dataFim = new Date(data_fim)
    dataFim.setHours(23, 59, 59, 999)

    // importar ObjectId para conversão correta
    const { ObjectId } = require('mongoose').Types

    // filtros para o relatório
    const filtros = {
      usuario_id: new ObjectId(usuario_id), // converter para ObjectId
      data_retirada: {
        $gte: dataInicio,
        $lte: dataFim,
      },
    }

    if (id_produto) {
      filtros.id_produto = parseInt(id_produto)
    }

    // agregar dados por produto
    const relatorio = await Retirada.aggregate([
      { $match: filtros },
      {
        $group: {
          _id: '$id_produto',
          total_retiradas: { $sum: 1 },
          quantidade_retirada: { $sum: '$quantidade_kg' },
          quantidade_vendida: { $sum: '$quantidade_vendida' },
          quantidade_em_estoque: {
            $sum: {
              $subtract: ['$quantidade_kg', '$quantidade_vendida'],
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ])

    // calcular totais gerais
    const totais = await Retirada.aggregate([
      { $match: filtros },
      {
        $group: {
          _id: null,
          total_geral_retiradas: { $sum: 1 },
          quantidade_geral_retirada: { $sum: '$quantidade_kg' },
          quantidade_geral_vendida: { $sum: '$quantidade_vendida' },
        },
      },
    ])

    const resultado = {
      detalhes: relatorio,
      total_geral_retiradas: totais[0]?.total_geral_retiradas || 0,
      quantidade_geral_retirada: totais[0]?.quantidade_geral_retirada || 0,
      quantidade_geral_vendida: totais[0]?.quantidade_geral_vendida || 0,
    }

    res.json({
      periodo: { data_inicio, data_fim },
      relatorio: resultado,
    })
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// obter retirada por ID
const obterRetiradaPorId = async (req, res) => {
  try {
    const { id } = req.params
    const usuario_id = req.user?.id

    if (!usuario_id) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    const retirada = await Retirada.findOne({ _id: id, usuario_id }).populate(
      'usuario_id',
      'nome email'
    )

    if (!retirada) {
      return res.status(404).json({ error: 'Retirada não encontrada' })
    }

    // atualizar idade atual
    const idadeAtual = calcularIdadeLote(retirada.data_retirada)
    const estagioAtual = obterEstagioLote(retirada.data_retirada)
    const noPrazo = verificarPrazoVenda(retirada.data_retirada)
    const quantidadeLiquida = calcularQuantidadeLiquida(
      retirada.quantidade_kg,
      retirada.data_retirada
    )

    res.json({
      retirada,
      informacoes_atuais: {
        idade_atual: idadeAtual,
        estagio_atual: estagioAtual,
        no_prazo: noPrazo,
        quantidade_liquida_estimada: quantidadeLiquida,
      },
    })
  } catch (error) {
    console.error('Erro ao obter retirada:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

module.exports = {
  registrarRetirada,
  buscarRetiradas,
  atualizarEstagio,
  registrarVenda,
  relatorioRetiradas,
  obterRetiradaPorId,
}
