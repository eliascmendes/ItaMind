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

def preencher_datas_faltantes(df: pd.DataFrame) -> pd.DataFrame:
  idx = pd.date_range(df["ds"].min(), df["ds"].max(), freq="D")
  df = df.set_index("ds").reindex(indx).fillna(0).rename_axis("ds").reset_index()
  return df

def criar_features(df: pd.DataFrame) -> pd.DataFrame:
  df_feat = df.copy()
  df_feat["dayofweek"] = df_feat["ds"].dt.dayofweek
  df_feat["month"] = df_feat["ds"].dt.month
  df_feat["day"] = df_feat["ds"].dt.day
  df_feat["lag1"] = df_feat["y"].shift(1)
  df_feat["lag2"] = df_feat["y"].shift(2)
  df_feat["roll7"] = df_feat["y"].shift(1).rolling(7).mean()
  df_feat = df_feat.dropna().reset_index(drop=True)
  return df_feat
