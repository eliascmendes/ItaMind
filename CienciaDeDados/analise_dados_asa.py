import pandas as pd
import numpy as np
from prophet import Prophet
from sklearn.metrics import mean_squared_error, mean_absolute_percentage_error
from datetime import timedelta
from descongelamento_asa import calcular_idade_lote, calcular_retirada

def carreagar_base_dados(caminho_csv):
    df = pd.read_csv(Rf'caminho_csv', encoding='latin1', sep=';', parse_dates=["data_dia"], dayfirst=True)
    filtro_itamind = df["id_produto"] == 237479
    df_itamind = df[filtro_itamind]
    df_itamind = df_itamind[["data_dia", "total_venda_dia_kg"]]
    df_itamind = df_itamind.rename(columns = {
        "data_dia" : "ds",
        "total_venda_dia_kg" : "y"
        })
    return df_itamind

def obter_feriados():
    feriados = pd.DataFrame({
        "holiday" : "feriado",
        "ds" : pd.to_datetime([
            "2025-01-01", "2025-03-29", "2025-04-21", "2025-05-01",
            "2025-06-29", "2025-07-28", "2025-09-07", "2025-09-08",
            "2025-10-12", "2025-11-02", "2025-11-15", "2025-12-08", "2025-12-25"
        ]),
        "lower_window" : 0,
        "upper_window" : 1

    })
    return feriados

def treinar_modelo(df_itamind):
    feriados = obter_feriados()
    modelo = Prophet(weekly_seasonality=True, yearly_seasonality=False, holidays=feriados)
    modelo.fit(df_itamind)
    return modelo

def obter_previsao_vendas(modelo, dias = 7):
    futuro = modelo.make_future_dataframe(periods = dias)
    previsao = modelo.predict(futuro)
    return previsao[["ds", "yhat"]].tail(dias)

