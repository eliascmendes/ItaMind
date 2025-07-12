import pandas as pd
import numpy as np
from prophet import Prophet
from datetime import timedelta, datetime
import sys
import io
import json

SKU = 237479

# --- Funções de descongelamento_asa.py ---
def calcular_retirada(quantidade_prevista, percentual_perda=15):
    if quantidade_prevista < 0:
        quantidade_prevista = 0
    quantidade_congelado = quantidade_prevista / (1 - (percentual_perda / 100))
    return round(quantidade_congelado, 2)

# --- Funções de analise_dados_asa.py ---
def carregar_dados_de_string(csv_string: str) -> pd.DataFrame:
    df = pd.read_csv(io.StringIO(csv_string), sep=";", parse_dates=["data_dia"], dayfirst=True)
    df_filtrado = df[df["id_produto"] == SKU].copy()
    df_renomeado = df_filtrado.rename(columns={
        "data_dia": "ds",
        "total_venda_dia_kg": "y"
    })
    return df_renomeado[["ds", "y"]]

def obter_feriados() -> pd.DataFrame:
    feriados_lista = [
        "2024-01-01", "2024-03-29", "2024-04-21", "2024-05-01", "2024-05-30",
        "2024-09-07", "2024-10-12", "2024-11-02", "2024-11-15", "2024-12-25",
        "2025-01-01", "2025-03-29", "2025-04-21", "2025-05-01", "2025-06-19",
        "2025-09-07", "2025-10-12", "2025-11-02", "2025-11-15", "2025-12-25"
    ]
    feriados = pd.DataFrame({
        "holiday": "feriado",
        "ds": pd.to_datetime(feriados_lista),
        "lower_window": 0,
        "upper_window": 1
    })
    return feriados

def treinar_e_prever(df: pd.DataFrame, dias: int = 7) -> pd.DataFrame:
    feriados = obter_feriados()
    modelo = Prophet(
        holidays=feriados,
        weekly_seasonality=True,
        yearly_seasonality=False,
        daily_seasonality=False
    )
    modelo.fit(df)
    futuro = modelo.make_future_dataframe(periods=dias)
    previsao = modelo.predict(futuro)
    return previsao[['ds', 'yhat']].tail(dias)

def pipeline(csv_data: str):
    df_vendas = carregar_dados_de_string(csv_data)

    if df_vendas.shape[0] < 2:
         return {"error": "Dados insuficientes para gerar previsão. Pelo menos 2 pontos de dados são necessários."}

    previsoes = treinar_e_prever(df_vendas)

    previsoes['yhat'] = previsoes['yhat'].apply(lambda x: 0 if x < 0 else x)
    previsoes['retirada_kg'] = previsoes['yhat'].apply(calcular_retirada)
    previsoes['data_retirada'] = previsoes['ds'] - timedelta(days=2)

    previsoes.rename(columns={'ds': 'data_venda', 'yhat': 'previsao_kg'}, inplace=True)

    previsoes['data_venda'] = previsoes['data_venda'].dt.strftime('%Y-%m-%d')
    previsoes['data_retirada'] = previsoes['data_retirada'].dt.strftime('%Y-%m-%d')

    return previsoes.to_dict(orient='records')

if __name__ == "__main__":
    try:
        csv_data_from_stdin = sys.stdin.read()
        results = pipeline(csv_data_from_stdin)
        print(json.dumps(results, indent=4))
    except Exception as e:
        error_payload = {
            "error": "Falha na execução do script de previsão com Prophet.",
            "details": str(e)
        }
        print(json.dumps(error_payload))
        sys.exit(1)
