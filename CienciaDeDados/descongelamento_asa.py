from datetime import datetime, timedelta

# Função que calcula a quantidade (em kg) que deve ser retirada do freezer para descongelamento, levando em conta a perda de 15%
def calcular_retirada(quantidade_prevista, percentual_perda = 15):
    quantidade_congelado = quantidade_prevista / (1 - (percentual_perda / 100))
    return round(quantidade_congelado, 2)

# Função que calcula a idade do lote do SKU escolhido (no caso, asa de frango)
def calcular_idade_lote(data_retirada, data_venda):
    dias_passados = (data_venda - data_retirada).days

    if dias_passados == 0:
        return "Dia 1 (Esquerda)"
    elif dias_passados == 1:
        return "Dia 2 (Central)"
    elif dias_passados == 2:
        return "Dia 3 (Venda)"
    else:
        return f"Fora do ciclo ({dias_passados} dias)"


# Função que obtém o estágio em que se encontra determinado lote no dia de hoje
def obter_estagio_lote(data_retirada, data_hoje):
    dias = (data_hoje - data_retirada).days
    if dias < 0:
        return "A retirar"
    elif dias == 0:
        return "Descongelando (Dia 1)"
    elif dias == 1:
        return "Descongelando (Dia 2)"
    elif dias == 2:
        return "Disponível para a venda"
    elif dias > 2:
        return "Fora do ciclo"
    