import pandas as pd
from prophet import Prophet
from sklearn.metrics import root_mean_squared_error, mean_absolute_percentage_error
from datetime import timedelta
import os

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

def carregar_arquivo(caminho, sku):
    extensao = os.path.splitext(caminho)[1].lower()

    if extensao == ".csv":
        df = pd.read_csv(caminho, encoding='latin1', sep=';', parse_dates=["data_dia"], dayfirst=True)
    elif extensao in [".xls", ".xlsx"]:
        df = pd.read_excel(caminho)
    else:
        raise ValueError(f"Formato de arquivo não suportado: {extensao}")

    if "data_dia" not in df.columns or "id_produto" not in df.columns or "total_venda_dia_kg" not in df.columns:
        raise ValueError(" O arquivo deve conter as colunas: 'data_dia', 'id_produto', 'total_venda_dia_kg'")

    df_filtrado = df[df["id_produto"] == sku][["data_dia", "total_venda_dia_kg"]]
    df_filtrado = df_filtrado.rename(columns={"data_dia": "ds", "total_venda_dia_kg": "y"})
    df_filtrado["ds"] = pd.to_datetime(df_filtrado["ds"], dayfirst=True)

    return df_filtrado

def treinar_e_prever(df, dias_previsao):
    modelo = Prophet(weekly_seasonality=True, yearly_seasonality=False, holidays=obter_feriados())
    modelo.fit(df)
    futuro = modelo.make_future_dataframe(periods=dias_previsao)
    previsao = modelo.predict(futuro)
    return previsao

def calcular_metricas(df_real, df_previsao):
    df_merged = pd.merge(df_real, df_previsao[["ds", "yhat"]], on="ds", how="inner")
    y_true = df_merged["y"]
    y_pred = df_merged["yhat"]
    rmse = root_mean_squared_error(y_true, y_pred)
    mape = mean_absolute_percentage_error(y_true, y_pred) * 100
    return rmse, mape

def calcular_retirada(quantidade_prevista, percentual_perda=15):
    if quantidade_prevista is None:
        return "-"
    quantidade_congelado = quantidade_prevista / (1 - (percentual_perda / 100))
    return round(quantidade_congelado, 2)

def gerar_relatorio_para_data(previsao, sku, data_alvo, percentual_perda=15):
    relatorio = []

    # Mapeia data de retirada para previsão
    retirada_por_data = {}
    for _, row in previsao.iterrows():
        data_venda = row["ds"].date()
        kg_previsto = round(row["yhat"], 2)
        data_retirada = data_venda - timedelta(days=2)
        retirada_por_data[data_retirada] = kg_previsto

    data_alvo = pd.to_datetime(data_alvo).date()

    kg_a_retirar = retirada_por_data.get(data_alvo, None)
    kg_em_descongelamento = retirada_por_data.get(data_alvo - timedelta(days=1), None)
    kg_para_venda = retirada_por_data.get(data_alvo - timedelta(days=2), None)

    relatorio.append({
        "Data de retirada": data_alvo.strftime("%d/%m/%Y"),
        "SKU": sku,
        "Kg a retirar hoje": calcular_retirada(kg_a_retirar),
        "Kg em descongelamento (pronto amanhã)": calcular_retirada(kg_em_descongelamento),
        "Kg disponível para venda hoje": round(kg_para_venda, 2) if kg_para_venda else "-",
        "Idade do lote descongelado": 2 if kg_para_venda else "-"
    })

    return pd.DataFrame(relatorio)

def main():
    caminho = input("Digite o caminho do arquivo (.csv ou .xlsx): ")
    sku = int(input("Digite o SKU que deseja analisar: "))
    data_alvo = input("Digite a data para o relatório (formato YYYY-MM-DD): ")
    dias_previsao = 30  # aumenta para garantir cobertura da data escolhida

    try:
        df = carregar_arquivo(caminho, sku)
    except Exception as e:
        print(f" Erro ao carregar dados: {e}")
        return

    if df.empty:
        print(f" Nenhum dado encontrado para SKU {sku}")
        return

    previsao = treinar_e_prever(df, dias_previsao)
    rmse, mape = calcular_metricas(df, previsao)

    print("\n Modelo treinado com sucesso!")
    print(f" RMSE: {rmse:.2f}")
    print(f" MAPE: {mape:.2f}%")

    # Gera relatório para a data escolhida
    relatorio = gerar_relatorio_para_data(previsao, sku, data_alvo)

    print("\n Relatório Operacional para", data_alvo)
    print(relatorio.to_string(index=False))

if __name__ == "__main__":
    main()

