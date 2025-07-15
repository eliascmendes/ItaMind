// cálculos de lote e idade

// calcula a idade de um lote em dias baseado na data de retirada
const calcularIdadeLote = dataRetirada => {
  const hoje = new Date()
  const retirada = new Date(dataRetirada)

  // zera as horas para comparar apenas as datas
  hoje.setHours(0, 0, 0, 0)
  retirada.setHours(0, 0, 0, 0)

  const diferencaTempo = hoje.getTime() - retirada.getTime()
  const dias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24))

  return Math.max(0, dias) // não retorna valores negativos
}

// determina o estágio atual de um lote baseado na idade
const obterEstagioLote = dataRetirada => {
  const dias = calcularIdadeLote(dataRetirada)

  if (dias === 0) {
    return 'esquerda' // dia da retirada
  } else if (dias === 1) {
    return 'central' // primeiro dia de descongelamento
  } else if (dias === 2) {
    return 'venda' // pronto para venda
  } else {
    return 'vencido' // passou do tempo ideal
  }
}

// calcula quando um lote estará pronto para venda
const calcularDataVendaPrevista = dataRetirada => {
  const retirada = new Date(dataRetirada)
  const vendaPrevista = new Date(retirada)
  vendaPrevista.setDate(vendaPrevista.getDate() + 2) // 2 dias após retirada

  return vendaPrevista
}

// verifica se um lote está no prazo para venda
const verificarPrazoVenda = dataRetirada => {
  const estagio = obterEstagioLote(dataRetirada)
  return estagio !== 'vencido'
}

// calcula o percentual de perda esperado baseado na idade
const calcularPercentualPerda = (dataRetirada, percentualBase = 15) => {
  const dias = calcularIdadeLote(dataRetirada)

  // aumenta a perda conforme o tempo passa
  if (dias <= 2) {
    return percentualBase // perda normal
  } else if (dias === 3) {
    return percentualBase + 5 // perda adicional
  } else {
    return percentualBase + 10 // perda alta
  }
}

// gera um identificador único para o lote
const gerarIdLote = (idProduto, dataRetirada) => {
  const data = new Date(dataRetirada)
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${idProduto}_${ano}${mes}${dia}_${Date.now().toString().slice(-4)}`
}

// calcula a quantidade líquida considerando perdas
const calcularQuantidadeLiquida = (quantidadeBruta, dataRetirada) => {
  const percentualPerda = calcularPercentualPerda(dataRetirada)
  const quantidadeLiquida = quantidadeBruta * (1 - percentualPerda / 100)

  return Math.max(0, quantidadeLiquida)
}

module.exports = {
  calcularIdadeLote,
  obterEstagioLote,
  calcularDataVendaPrevista,
  verificarPrazoVenda,
  calcularPercentualPerda,
  gerarIdLote,
  calcularQuantidadeLiquida,
}
