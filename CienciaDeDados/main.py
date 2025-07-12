# Importando bibliotecas necessárias
import pandas as pd  # Manipulação de dados
from prophet import Prophet  # Modelo de previsão de séries temporais
from sklearn.metrics import root_mean_squared_error, mean_absolute_percentage_error  # Métricas de avaliação
import os  # Para manipular caminhos de arquivos

# Função que retorna os feriados municipais, estaduais e nacionais relevantes para São Luís - MA
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

# Função que carrega o arquivo de dados (CSV ou Excel) e filtra pelo SKU desejado
def carregar_arquivo(caminho, sku):
    extensao = os.path.splitext(caminho)[1].lower()  # Obtém a extensão do arquivo

    # Lê o arquivo conforme a extensão
    if extensao == ".csv":
        df = pd.read_csv(caminho, encoding='latin1', sep=';', parse_dates=["data_dia"], dayfirst=True)
    elif extensao in [".xls", ".xlsx"]:
        df = pd.read_excel(caminho)
    else:
        raise ValueError(f"Formato de arquivo não suportado: {extensao}")

    # Verifica se as colunas obrigatórias estão presentes
    if "data_dia" not in df.columns or "id_produto" not in df.columns or "total_venda_dia_kg" not in df.columns:
        raise ValueError(" O arquivo deve conter as colunas: 'data_dia', 'id_produto', 'total_venda_dia_kg'")

    # Filtra os dados pelo SKU e renomeia colunas para o formato exigido pelo Prophet
    df_filtrado = df[df["id_produto"] == sku][["data_dia", "total_venda_dia_kg"]]
    df_filtrado = df_filtrado.rename(columns={"data_dia": "ds", "total_venda_dia_kg": "y"})
    df_filtrado["ds"] = pd.to_datetime(df_filtrado["ds"], dayfirst=True)

    return df_filtrado

# Função que treina o modelo Prophet e gera a previsão para os próximos dias
def treinar_e_prever(df, dias_previsao):
    modelo = Prophet(
        weekly_seasonality=True,  # Considera sazonalidade semanal
        yearly_seasonality=False,  # Ignora sazonalidade anual
        holidays=obter_feriados()  # Inclui feriados locais
    )
    modelo.fit(df)  # Treina o modelo com os dados históricos
    futuro = modelo.make_future_dataframe(periods=dias_previsao)  # Cria datas futuras
    previsao = modelo.predict(futuro)  # Gera a previsão
    return previsao

# Função que calcula as métricas de erro entre os dados reais e a previsão
def calcular_metricas(df_real, df_previsao):
    # Junta os dados reais com a previsão para as mesmas datas
    df_merged = pd.merge(df_real, df_previsao[["ds", "yhat"]], on="ds", how="inner")
    y_true = df_merged["y"]  # Valores reais
    y_pred = df_merged["yhat"]  # Valores previstos

    # Calcula RMSE e MAPE (métricas de performance)
    rmse = root_mean_squared_error(y_true, y_pred)
    mape = mean_absolute_percentage_error(y_true, y_pred) * 100
    return rmse, mape

# Função principal que executa o fluxo completo
def main():
    # Solicita ao usuário o caminho do arquivo e o SKU desejado
    caminho = input("Digite o caminho do arquivo (.csv ou .xlsx): ")
    sku = int(input("Digite o SKU que deseja analisar: "))
    dias_previsao = 7  # Número de dias futuros para prever

    # Tenta carregar os dados e trata possíveis erros
    try:
        df = carregar_arquivo(caminho, sku)
    except Exception as e:
        print(f" Erro ao carregar dados: {e}")
        return

    # Verifica se há dados disponíveis para o SKU
    if df.empty:
        print(f" Nenhum dado encontrado para SKU {sku}")
        return

    # Treina o modelo e gera a previsão
    previsao = treinar_e_prever(df, dias_previsao)

    # Calcula as métricas de erro
    rmse, mape = calcular_metricas(df, previsao)

    # Exibe os resultados no terminal
    print("\n Modelo treinado com sucesso!")
    print(f" RMSE: {rmse:.2f}")
    print(f" MAPE: {mape:.2f}%")

# Executa o script se for chamado diretamente
if __name__ == "__main__":
    main()

