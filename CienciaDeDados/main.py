# importando bibliotecas necessárias
import pandas as pd
import numpy as np
from prophet import Prophet
from sklearn.metrics import root_mean_squared_error, mean_absolute_percentage_error
from datetime import timedelta
import os
import json
import sys
import warnings

# ignora avisos para uma saída mais limpa
warnings.filterwarnings('ignore')

def obter_feriados():
    return pd.DataFrame({
        "holiday": "feriado",
        "ds": pd.to_datetime([
            "2025-01-01", "2025-03-29", "2025-04-21", "2025-05-01",
            "2025-06-29", "2025-07-28", "2025-09-07", "2025-09-08",
            "2025-10-12", "2025-11-02", "2025-11-15", "2025-12-08", "2025-12-25"
        ]),
        "lower_window": 0,
        "upper_window": 1
    })

def processar_csv_entrada():
    try:
        # lê todo o conteúdo da entrada padrão
        conteudo_csv = sys.stdin.read()

        # salva o conteúdo em um arquivo temporário para facilitar a leitura com pandas
        with open('dados_temporarios.csv', 'w', encoding='latin1') as arquivo:
            arquivo.write(conteudo_csv)

        # lê os dados do arquivo temporário
        dados = pd.read_csv('dados_temporarios.csv', encoding='latin1', sep=';')

        # converte a coluna de data
        dados['data_dia'] = pd.to_datetime(dados['data_dia'], format='%d/%m/%Y', errors='coerce')

        # remove o arquivo temporário após o uso
        os.remove('dados_temporarios.csv')

        return dados

    except Exception as e:
        print(f"Erro ao processar CSV da entrada padrão: {e}", file=sys.stderr)
        return pd.DataFrame()

def carregar_arquivo_local(caminho):
    # obtém a extensão do arquivo para determinar como lê-lo
    extensao = os.path.splitext(caminho)[1].lower()

    if extensao == ".csv":
        dados = pd.read_csv(caminho, encoding='latin1', sep=';')
        # converte a data para o formato datetime
        dados['data_dia'] = pd.to_datetime(dados['data_dia'], format='%d/%m/%Y', errors='coerce')
    elif extensao in [".xls", ".xlsx"]:
        dados = pd.read_excel(caminho)
        # garante que a coluna de data está no formato correto
        dados['data_dia'] = pd.to_datetime(dados['data_dia'], errors='coerce')
    else:
        raise ValueError(f"Formato de arquivo não suportado: {extensao}")

    # valida se as colunas essenciais estão presentes no arquivo
    colunas_necessarias = ["data_dia", "id_produto", "total_venda_dia_kg"]
    if not all(col in dados.columns for col in colunas_necessarias):
        raise ValueError(f"O arquivo deve conter as colunas: {', '.join(colunas_necessarias)}")

    return dados

def preparar_dados_para_prophet(dados_brutos, sku):
    try:
        # filtra o dataframe para o sku desejado
        dados_sku = dados_brutos[dados_brutos['id_produto'] == sku].copy()

        if dados_sku.empty:
            return pd.DataFrame()

        # seleciona e renomeia as colunas para o padrão do prophet
        dados_prophet = dados_sku[['data_dia', 'total_venda_dia_kg']].copy()
        dados_prophet.columns = ['ds', 'y']

        # remove linhas com dados ausentes e vendas negativas
        dados_prophet = dados_prophet.dropna()
        dados_prophet = dados_prophet[dados_prophet['y'] >= 0]

        # ordena os dados por data
        dados_prophet = dados_prophet.sort_values('ds')

        return dados_prophet

    except Exception as e:
        print(f"Erro ao preparar dados para o SKU {sku}: {e}", file=sys.stderr)
        return pd.DataFrame()

def treinar_modelo_prophet(dados):
    try:
        modelo = Prophet(
            weekly_seasonality=True,
            yearly_seasonality=False, # desativado para focar em padrões semanais
            daily_seasonality=False,
            holidays=obter_feriados() # adiciona feriados
        )
        modelo.fit(dados)
        return modelo

    except Exception as e:
        print(f"Erro ao treinar o modelo: {e}", file=sys.stderr)
        return None

def gerar_previsao(modelo, dias_previsao=30):
    try:
        # cria um dataframe futuro para fazer as previsões
        futuro = modelo.make_future_dataframe(periods=dias_previsao)
        previsao = modelo.predict(futuro)
        return previsao

    except Exception as e:
        print(f"Erro ao gerar previsão: {e}", file=sys.stderr)
        return pd.DataFrame()

def calcular_metricas(dados_reais, previsao):
    try:
        # une os dados reais com os previstos para comparação
        dados_unidos = pd.merge(dados_reais, previsao[['ds', 'yhat']], on='ds', how='inner')

        if dados_unidos.empty:
            return 0.0, 0.0

        y_real = dados_unidos['y']
        y_pred = dados_unidos['yhat']

        # calcula as métricas
        rmse = root_mean_squared_error(y_real, y_pred)
        mape = mean_absolute_percentage_error(y_real, y_pred) * 100

        return float(rmse), float(mape)

    except Exception as e:
        print(f"Erro ao calcular métricas: {e}", file=sys.stderr)
        return 0.0, 0.0

def calcular_retirada(quantidade_prevista, percentual_perda=15):
    if quantidade_prevista is None or pd.isna(quantidade_prevista) or quantidade_prevista <= 0:
        return "-"
    # fórmula para encontrar a quantidade original antes da perda percentual
    quantidade_congelado = quantidade_prevista / (1 - (percentual_perda / 100))
    return round(quantidade_congelado, 2)

def gerar_relatorio_operacional(previsao, sku, data_alvo_str):
    relatorio_lista = []

    # mapeia a data de retirada (d-2) para a quantidade prevista na data da venda (d)
    retirada_por_data = {}

    for _, row in previsao.iterrows():
        data_venda = row["ds"].date()
        kg_previsto = round(row["yhat"], 2)
        data_retirada = data_venda - timedelta(days=2)
        retirada_por_data[data_retirada] = kg_previsto

    # converte a data alvo para o formato de data
    data_alvo = pd.to_datetime(data_alvo_str).date()

    # calcula as quantidades para o relatório com base na data alvo
    # o que retirar hoje (data_alvo) para vender em d+2
    kg_a_retirar = retirada_por_data.get(data_alvo)
    # o que está em descongelamento (foi retirado ontem) para vender amanhã (d+1)
    kg_em_descongelamento = retirada_por_data.get(data_alvo - timedelta(days=1))
    # o que está pronto para venda hoje (foi retirado anteontem)
    kg_para_venda_hoje = retirada_por_data.get(data_alvo - timedelta(days=2))


    relatorio_lista.append({
        "Data de Retirada": data_alvo.strftime("%d/%m/%Y"),
        "SKU": sku,
        "Kg a retirar hoje (venda em D+2)": calcular_retirada(kg_a_retirar),
        "Kg em descongelamento (venda em D+1)": calcular_retirada(kg_em_descongelamento),
        "Kg disponível para venda hoje (D)": round(kg_para_venda_hoje, 2) if kg_para_venda_hoje else "-",
    })

    return pd.DataFrame(relatorio_lista)

# calcula a quantidade total vendida em um dia da semana selecionado (domingo, segunda,...) e compara entre os meses da base de dados
def calcular_soma_por_dia_semana(dados_prophet, dia_semana):

    # cria um dicionário de mapeamento de nomes dos dias da semana para o número correspondente que o pandas usa
    dias_map = {
        'segunda': 0,
        'terça': 1,
        'quarta': 2,
        'quinta': 3,
        'sexta': 4,
        'sábado': 5,
        'domingo': 6
    }

    # converte o texto do usuário para letras minúsculas
    dia_semana = dia_semana.lower()

    # verifica se o dia informado é válido
    if dia_semana not in dias_map:
        raise ValueError(f"Dia inválido: '{dia_semana}'. Use: {', '.join(dias_map.keys())}")

    # obtém o número do dia da semana correspondente
    numero_dia = dias_map[dia_semana]

    # filtra os dados para o dia da semana desejado
    dados_filtrados = dados_prophet[dados_prophet['ds'].dt.weekday == numero_dia].copy()

    # extrai ano-mês para agrupamento
    dados_filtrados['ano_mes'] = dados_filtrados['ds'].dt.to_period('M').astype(str)

    # soma por mês
    soma_mensal = dados_filtrados.groupby('ano_mes')['y'].sum().round(2)

    # imprime no terminal
    print(f"\n📊 Comparativo de vendas para '{dia_semana.capitalize()}' por mês:")
    for mes, total in soma_mensal.items():
        print(f" - {mes}: {total} kg")

    return soma_mensal.to_dict()




def main():
    try:
        # modo de integração: se o script for chamado com dados via pipe (ex: node.js)
        if not sys.stdin.isatty():
            dados_brutos = processar_csv_entrada()

            if dados_brutos.empty:
                print("[]") # retorna um json vazio se não houver dados
                return

            skus_unicos = dados_brutos['id_produto'].unique()
            resultados_finais = []

            for sku in skus_unicos:
                # prepara os dados para cada sku
                dados_sku = preparar_dados_para_prophet(dados_brutos, sku)

                # pula para o próximo sku se não houver dados suficientes
                if dados_sku.empty or len(dados_sku) < 10:
                    continue

                modelo = treinar_modelo_prophet(dados_sku)
                if modelo is None:
                    continue

                # gera previsão para 7 dias
                previsao = gerar_previsao(modelo, dias_previsao=7)
                if previsao.empty:
                    continue

                rmse, mape = calcular_metricas(dados_sku, previsao)

                # formata a previsão para o json de saída
                previsoes_futuras = previsao.tail(7)
                previsoes_json = [
                    {
                        "ds": linha['ds'].isoformat(),
                        "yhat": round(float(linha['yhat']), 2) if linha['yhat'] > 0 else 0,
                        "yhat_lower": round(float(linha['yhat_lower']), 2) if linha['yhat_lower'] > 0 else 0,
                        "yhat_upper": round(float(linha['yhat_upper']), 2) if linha['yhat_upper'] > 0 else 0,
                    }
                    for _, linha in previsoes_futuras.iterrows()
                ]

                resultados_finais.append({
                    "sku": int(sku),
                    "rmse": round(rmse, 2),
                    "mape": round(mape, 2),
                    "previsoes": previsoes_json
                })

            # imprime o resultado final como uma string json
            print(json.dumps(resultados_finais, ensure_ascii=False, indent=2))

        # modo interativo: se o script for executado diretamente no terminal
        else:
            caminho = input("Digite o caminho do arquivo (.csv ou .xlsx): ")
            sku = int(input("Digite o SKU que deseja analisar: "))
            data_alvo = input("Digite a data para o relatório (formato AAAA-MM-DD): ")
            dias_previsao = 30 # previsão mais longa para o relatório

            dados_brutos = carregar_arquivo_local(caminho)
            dados_sku = preparar_dados_para_prophet(dados_brutos, sku)

            if dados_sku.empty:
                print(f"\nNenhum dado encontrado ou dados insuficientes para o SKU {sku}")
                return

            modelo = treinar_modelo_prophet(dados_sku)
            if modelo is None:
                return

            previsao = gerar_previsao(modelo, dias_previsao)
            if previsao.empty:
                return

            rmse, mape = calcular_metricas(dados_sku, previsao)

            print(f"\n Modelo treinado com sucesso!")
            print(f"   - RMSE: {rmse:.2f}")
            print(f"   - MAPE: {mape:.2f}%")

            print("\n Previsões de Venda para os próximos 7 dias:")
            previsoes_futuras = previsao[previsao['ds'] > dados_sku['ds'].max()].head(7)
            for _, linha in previsoes_futuras.iterrows():
                data = linha['ds'].date()
                valor = linha['yhat'] if linha['yhat'] > 0 else 0
                print(f"   - {data.strftime('%d/%m/%Y')}: {valor:.2f} kg")

            # gera e exibe o relatório operacional
            relatorio = gerar_relatorio_operacional(previsao, sku, data_alvo)
            print(f"\n Relatório Operacional para {pd.to_datetime(data_alvo).strftime('%d/%m/%Y')}:")
            print(relatorio.to_string(index=False))

    except Exception as e:
        print(f"Ocorreu um erro inesperado na execução: {e}", file=sys.stderr)
        return
    
    dia = input("Digite o dia da semana (ex: domingo, segunda, ...): ").strip().lower()
    try:
        calcular_soma_por_dia_semana(dados_sku, dia)
    except ValueError as ve:
        print(f"Erro: {ve}")

# ponto de entrada do script
if __name__ == "__main__":
    main()
