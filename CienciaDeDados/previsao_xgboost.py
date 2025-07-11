import pandas as pd
import numpy as np
from datetime import timedelta, datetime
from pathlib import Path
from sklearn.metrics import mean_squared_error, mean_absolute_percentage_error
from xgboost import XGBRegressor


# import descongelamento
from descongelamento_asa import calcular_retirada, calcular_idade_lote

ARQUIVO_CSV = Path(__file__).with_name
SKU = 237479

def carregar_dados(caminho: Path = ARQUIVO_CSV) -> pd.DataFrame:
  df = pd.read_csv(caminho, sep=";")
  df = df[df["id_produto"] == SKU].copy()
  df["ds"] = pd.to_datetime(df["data_dia"], dayfirst=True)
  df = df.groupby("ds", as_index=False)
  ["total_venda_dia_kg"].sum()
  df.rename(columns={"total_venda_dia_kg": "y"}, inplace=True)
  df = preencher_datas_faltantes(df)
  return df

