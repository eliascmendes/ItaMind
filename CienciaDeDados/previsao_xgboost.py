import pandas as pd
import numpy as np
from datetime import timedelta, datetime
from pathlib import Path
from sklearn.metrics import mean_squared_error
from xgboost import XGBRegressor

#  funções de descongelamento
from descongelamento_asa import calcular_retirada, calcular_idade_lote

ARQUIVO_CSV = Path(__file__).with_name("dados_vendas_itamind.csv")
SKU = 237479


def carregar_dados(caminho: Path = ARQUIVO_CSV) -> pd.DataFrame:
    df = pd.read_csv(caminho, sep=";")
    df = df[df["id_produto"] == SKU].copy()
    df["ds"] = pd.to_datetime(df["data_dia"], dayfirst=True)
    df = df.groupby("ds", as_index=False)["total_venda_dia_kg"].sum()
    df.rename(columns={"total_venda_dia_kg": "y"}, inplace=True)
    df = preencher_datas_faltantes(df)
    return df


def preencher_datas_faltantes(df: pd.DataFrame) -> pd.DataFrame:
    idx = pd.date_range(df["ds"].min(), df["ds"].max(), freq="D")
    df = df.set_index("ds").reindex(idx).fillna(0).rename_axis("ds").reset_index()
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


def divisao_treino_teste_temporal(df: pd.DataFrame, test_size: float = 0.2):
    split_idx = int(len(df) * (1 - test_size))
    train = df.iloc[:split_idx]
    test = df.iloc[split_idx:]
    return train, test


def treinar_modelo(train: pd.DataFrame) -> XGBRegressor:
    X_train = train.drop(columns=["ds", "y"])
    y_train = train["y"]
    model = XGBRegressor(
        objective="reg:squarederror",
        n_estimators=100,
        learning_rate=0.1,
        random_state=42,
    )
    model.fit(X_train, y_train)
    return model
