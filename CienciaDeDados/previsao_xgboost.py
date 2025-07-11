import pandas as pd
import numpy as np
from datetime import timedelta, datetime
from pathlib import Path
from sklearn.metrics import mean_squared_error, mean_absolute_percentage_error
from xgboost import XGBRegressor

# descongelamento
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

def avaliar_modelo(model: XGBRegressor, test: pd.DataFrame) -> dict:
    X_test = test.drop(columns=["ds", "y"])
    y_true = test["y"].values
    y_pred = model.predict(X_test)

    # RMSE
    try:
        rmse = mean_squared_error(y_true, y_pred, squared=False)
    except TypeError:
        rmse = np.sqrt(mean_squared_error(y_true, y_pred))

    # MAPE
    try:
        mape = mean_absolute_percentage_error (y_true, y_pred)
    except Exception:
        mape = np.mean(np.abs((y_true - y_pred) / np.where(y_true == 0, 1, y_true))) * 100

    return {"RMSE": rmse, "MAPE": mape}


def prever_proximos_dias(df: pd.DataFrame, model: XGBRegressor, dias: int = 7) -> pd.DataFrame:
    ultimos = df.copy()
    futuras_linhas = []
    for i in range(1, dias + 1):
        proxima_data = ultimos["ds"].iloc[-1] + timedelta(days=1)
        nova_linha = {"ds": proxima_data}

        # features temporais
        nova_linha["dayofweek"] = proxima_data.dayofweek
        nova_linha["month"] = proxima_data.month
        nova_linha["day"] = proxima_data.day

        # lags
        nova_linha["lag1"] = ultimos["y"].iloc[-1]
        nova_linha["lag2"] = ultimos["y"].iloc[-2] if len(ultimos) >= 2 else np.nan

        # média móvel 7 dias
        nova_linha["roll7"] = ultimos["y"].tail(7).mean()

        features = ["dayofweek", "month", "day", "lag1", "lag2", "roll7"]
        y_pred = model.predict(pd.DataFrame([nova_linha])[features])[0]

        nova_linha["y"] = y_pred
        futuras_linhas.append(nova_linha)
        ultimos = pd.concat([ultimos, pd.DataFrame([nova_linha])], ignore_index=True)

    previsoes = pd.DataFrame(futuras_linhas)
    return previsoes[["ds", "y"]]


def calcular_retiradas(previsoes: pd.DataFrame) -> pd.DataFrame:
    previsoes = previsoes.copy()
    previsoes["retirada_kg"] = previsoes["y"].apply(calcular_retirada)
    return previsoes


def pipeline():
    df_raw = carregar_dados()
    df_feat = criar_features(df_raw)
    train, test = divisao_treino_teste_temporal(df_feat)
    model = treinar_modelo(train)
    metricas = avaliar_modelo(model, test)

    prox7 = prever_proximos_dias(df_feat, model, dias=7)
    prox7 = calcular_retiradas(prox7)

    return metricas, prox7


if __name__ == "__main__":
    metricas, previsoes = pipeline()
    print("Métricas de avaliação:")
    for k, v in metricas.items():
        print(f"{k}: {v:.2f}")

    print("\nPrevisões e retiradas sugeridas:")
    for _, row in previsoes.iterrows():
        data = row["ds"].strftime("%d/%m/%Y")
        venda = row["y"]
        retirada = row["retirada_kg"]
        print(f"{data} | Previsto: {venda:.2f} kg | Retirada sugerida: {retirada:.2f} kg")
