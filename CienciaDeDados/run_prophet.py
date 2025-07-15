# importando bibliotecas necessárias
import pandas as pd
import numpy as np
from prophet import Prophet
from sklearn.metrics import mean_squared_error, mean_absolute_percentage_error
from datetime import timedelta
import os
import json
import sys
import warnings
warnings.filterwarnings('ignore')

# função que retorna os feriados
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

# função que carrega arquivo csv ou excel e filtra dados pelo sku específico
def carregar_arquivo(caminho, sku):
    extensao = os.path.splitext(caminho)[1].lower()

    if extensao == ".csv":
        dados = pd.read_csv(caminho, encoding='latin1', sep=';', parse_dates=["data_dia"], dayfirst=True)
    elif extensao in [".xls", ".xlsx"]:
        dados = pd.read_excel(caminho)
    else:
        raise ValueError(f"Formato de arquivo não suportado: {extensao}")

    if "data_dia" not in dados.columns or "id_produto" not in dados.columns or "total_venda_dia_kg" not in dados.columns:
        raise ValueError("O arquivo deve conter as colunas: 'data_dia', 'id_produto', 'total_venda_dia_kg'")

    dados_filtrados = dados[dados["id_produto"] == sku].copy()
    dados_finais = dados_filtrados[["data_dia", "total_venda_dia_kg"]].copy()
    dados_finais.rename(columns={"data_dia": "ds", "total_venda_dia_kg": "y"}, inplace=True)
    dados_finais["ds"] = pd.to_datetime(dados_finais["ds"], dayfirst=True)

    return dados_finais

# função que processa dados csv vindos da entrada padrão para integração com node.js
def processar_csv_entrada():
    try:
        conteudo_csv = sys.stdin.read()

        # salva temporariamente para processar
        with open('dados_temporarios.csv', 'w', encoding='latin1') as arquivo:
            arquivo.write(conteudo_csv)

        # lê os dados
        dados = pd.read_csv('dados_temporarios.csv', encoding='latin1', sep=';')

        # converte data corretamente
        dados['data_dia'] = pd.to_datetime(dados['data_dia'], format='%d/%m/%Y', errors='coerce')

        # remove arquivo temporário
        os.remove('dados_temporarios.csv')

        return dados

    except Exception as e:
        print(f"Erro ao processar CSV: {e}", file=sys.stderr)
        return pd.DataFrame()

# função que prepara dados específicos de um sku para treinamento do modelo prophet
def preparar_dados_prophet(dados, sku):
    try:
        # filtra pelo sku
        dados_sku = dados[dados['id_produto'] == sku].copy()

        if dados_sku.empty:
            return pd.DataFrame()

        # seleciona e renomeia colunas
        dados_prophet = dados_sku[['data_dia', 'total_venda_dia_kg']].copy()
        dados_prophet.columns = ['ds', 'y']

        # remove valores nulos ou negativos
        dados_prophet = dados_prophet.dropna()
        dados_prophet = dados_prophet[dados_prophet['y'] >= 0]

        # ordena por data
        dados_prophet = dados_prophet.sort_values('ds')

        return dados_prophet

    except Exception as e:
        print(f"Erro ao preparar dados para SKU {sku}: {e}", file=sys.stderr)
        return pd.DataFrame()

# função que treina modelo prophet com dados históricos de vendas
def treinar_modelo_prophet(dados):
    try:
        modelo = Prophet(
            weekly_seasonality=True,
            yearly_seasonality=False,
            holidays=obter_feriados(),
            daily_seasonality=False
        )

        modelo.fit(dados)
        return modelo

    except Exception as e:
        print(f"Erro ao treinar modelo: {e}", file=sys.stderr)
        return None

# função que gera previsão para próximos dias usando modelo treinado
def gerar_previsao(modelo, dados, dias_previsao=7):
    try:
        futuro = modelo.make_future_dataframe(periods=dias_previsao)
        previsao = modelo.predict(futuro)

        return previsao

    except Exception as e:
        print(f"Erro ao gerar previsão: {e}", file=sys.stderr)
        return pd.DataFrame()

# função que calcula métricas de qualidade da previsão comparando com dados reais
def calcular_metricas(dados_reais, previsao):
    try:
        # une dados reais com previsão
        dados_unidos = pd.merge(dados_reais, previsao[['ds', 'yhat']], on='ds', how='inner')

        if dados_unidos.empty:
            return 0.0, 0.0

        y_real = dados_unidos['y']
        y_pred = dados_unidos['yhat']

        # calcula métricas
        rmse = np.sqrt(mean_squared_error(y_real, y_pred))
        mape = mean_absolute_percentage_error(y_real, y_pred) * 100

        return float(rmse), float(mape)

    except Exception as e:
        print(f"Erro ao calcular métricas: {e}", file=sys.stderr)
        return 0.0, 0.0

# calcula quanto deve ser retirado do freezer considerando perdas
def calcular_retirada(quantidade_prevista, percentual_perda=15):
    if quantidade_prevista is None or pd.isna(quantidade_prevista) or quantidade_prevista <= 0:
        return None
    # fórmula para encontrar a quantidade original antes da perda percentual
    quantidade_congelado = quantidade_prevista / (1 - (percentual_perda / 100))
    return round(quantidade_congelado, 2)

# gera relatório operacional com dados de retirada, descongelamento e venda
def gerar_relatorio_operacional(previsao, sku, data_alvo_str):
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

    relatorio = {
        "data_retirada": data_alvo.strftime("%d/%m/%Y"),
        "sku": sku,
        "kg_a_retirar": calcular_retirada(kg_a_retirar),
        "kg_em_descongelamento": calcular_retirada(kg_em_descongelamento),
        "kg_disponivel_bruto": calcular_retirada(kg_para_venda_hoje),  # quantidade bruta retirada (com compensação)
        "kg_para_venda_hoje": round(kg_para_venda_hoje, 2) if kg_para_venda_hoje else None,  # quantidade líquida real
    }

    return relatorio

# função principal que coordena todo fluxo de previsão
def main():
    try:
        # modo relatório com parâmetros da linha de comando
        if len(sys.argv) >= 4:
            caminho_arquivo = sys.argv[1]
            sku = int(sys.argv[2])
            data_alvo = sys.argv[3]

            # carrega dados do arquivo
            if caminho_arquivo.endswith('.csv'):
                dados = pd.read_csv(caminho_arquivo, encoding='latin1', sep=';')
                dados['data_dia'] = pd.to_datetime(dados['data_dia'], format='%d/%m/%Y', errors='coerce')
            else:
                dados = pd.read_excel(caminho_arquivo)
                dados['data_dia'] = pd.to_datetime(dados['data_dia'], errors='coerce')

            # prepara dados para o sku
            dados_sku = preparar_dados_prophet(dados, sku)

            if dados_sku.empty or len(dados_sku) < 10:
                print(json.dumps({"error": "Dados insuficientes para o SKU especificado"}))
                return

            # treina modelo
            modelo = treinar_modelo_prophet(dados_sku)
            if modelo is None:
                print(json.dumps({"error": "Falha ao treinar modelo Prophet"}))
                return

            # gera previsão com 30 dias para ter dados suficientes para o relatório
            previsao = gerar_previsao(modelo, dados_sku, dias_previsao=30)
            if previsao.empty:
                print(json.dumps({"error": "Falha ao gerar previsão"}))
                return

            # gera relatório operacional
            relatorio = gerar_relatorio_operacional(previsao, sku, data_alvo)
            print(json.dumps(relatorio, ensure_ascii=False, indent=2))

        # modo integração com node.js
        elif not sys.stdin.isatty():
            dados_originais = processar_csv_entrada()

            if dados_originais.empty:
                print("[]")
                return

            # obtém skus únicos
            skus = dados_originais['id_produto'].unique()
            resultados = []

            for sku in skus:
                # prepara dados para o sku
                dados_sku = preparar_dados_prophet(dados_originais, sku)

                if dados_sku.empty or len(dados_sku) < 10:
                    continue

                # treina modelo
                modelo = treinar_modelo_prophet(dados_sku)

                if modelo is None:
                    continue

                # gera previsão
                previsao = gerar_previsao(modelo, dados_sku, 7)

                if previsao.empty:
                    continue

                # calcula métricas
                rmse, mape = calcular_metricas(dados_sku, previsao)

                # obtém previsões futuras (últimos 7 dias)
                previsoes_futuras = previsao.tail(7)

                # prepara dados para json
                previsoes_json = []
                for _, linha in previsoes_futuras.iterrows():
                    previsoes_json.append({
                        "ds": linha['ds'].isoformat(),
                        "yhat": float(linha['yhat']),
                        "yhat_lower": float(linha['yhat_lower']),
                        "yhat_upper": float(linha['yhat_upper'])
                    })

                resultado = {
                    "sku": int(sku),
                    "rmse": rmse,
                    "mape": mape,
                    "previsoes": previsoes_json
                }

                resultados.append(resultado)

            # retorna json
            print(json.dumps(resultados, ensure_ascii=False, indent=2))

        # modo interativo
        else:
            caminho = input("Digite o caminho do arquivo (.csv ou .xlsx): ")
            sku = int(input("Digite o SKU que deseja analisar: "))

            # lê arquivo
            if caminho.endswith('.csv'):
                dados = pd.read_csv(caminho, encoding='latin1', sep=';')
                dados['data_dia'] = pd.to_datetime(dados['data_dia'], format='%d/%m/%Y', errors='coerce')
            else:
                dados = pd.read_excel(caminho)

            # prepara dados
            dados_sku = preparar_dados_prophet(dados, sku)

            if dados_sku.empty:
                print(f"Nenhum dado encontrado para SKU {sku}")
                return

            # treina modelo
            modelo = treinar_modelo_prophet(dados_sku)

            if modelo is None:
                print("Erro ao treinar modelo")
                return

            # gera previsão
            previsao = gerar_previsao(modelo, dados_sku, 7)

            if previsao.empty:
                print("Erro ao gerar previsão")
                return

            # calcula métricas
            rmse, mape = calcular_metricas(dados_sku, previsao)

            # exibe resultados
            print(f"\nModelo treinado com sucesso!")
            print(f"RMSE: {rmse:.2f}")
            print(f"MAPE: {mape:.2f}%")

            print("\nPrevisões para os próximos 7 dias:")
            previsoes_futuras = previsao.tail(7)
            for _, linha in previsoes_futuras.iterrows():
                data = linha['ds'].date()
                valor = linha['yhat']
                print(f"{data}: {valor:.2f} kg")

    except Exception as e:
        print(f"Erro na execução: {e}", file=sys.stderr)
        return

# executa o script se for chamado diretamente
if __name__ == "__main__":
    main()
