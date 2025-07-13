# Importando bibliotecas necessárias
import pandas as pd
from prophet import Prophet
from sklearn.metrics import root_mean_squared_error, mean_absolute_percentage_error
import os
import json
import sys

# Função que retorna os feriados
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

# Função que processa CSV a partir de entrada padrão
def processar_csv_entrada():
    conteudo_csv = sys.stdin.read()

    with open('dados_temporarios.csv', 'w', encoding='latin1') as arquivo:
        arquivo.write(conteudo_csv)

    dados = pd.read_csv('dados_temporarios.csv', encoding='latin1', sep=';', parse_dates=["data_dia"], dayfirst=True)

    os.remove('dados_temporarios.csv')

    return dados

# Função que treina o modelo Prophet e gera a previsão para os próximos dias
def treinar_e_prever(dados, dias_previsao):
    modelo = Prophet(
        weekly_seasonality=True,
        yearly_seasonality=False,
        holidays=obter_feriados()
    )
    modelo.fit(dados)
    futuro = modelo.make_future_dataframe(periods=dias_previsao)
    previsao = modelo.predict(futuro)
    return previsao

# Função que calcula as métricas de erro entre os dados reais e a previsão
def calcular_metricas(dados_reais, dados_previsao):
    dados_combinados = pd.merge(dados_reais, dados_previsao[["ds", "yhat"]], on="ds", how="inner")
    valores_reais = dados_combinados["y"]
    valores_previstos = dados_combinados["yhat"]

    rmse = root_mean_squared_error(valores_reais, valores_previstos)
    mape = mean_absolute_percentage_error(valores_reais, valores_previstos) * 100
    return rmse, mape

# Função principal que executa o fluxo completo
def main():
    try:
        # Verifica se há entrada via stdin (para integração com Node.js)
        if not sys.stdin.isatty():
            dados_originais = processar_csv_entrada()

            # Pega todos os SKUs únicos
            lista_skus = dados_originais["id_produto"].unique()
            resultados = []

            for sku in lista_skus:
                # Filtra dados por SKU
                dados_temporarios = dados_originais[dados_originais["id_produto"] == sku].copy()
                dados_sku = dados_temporarios[["data_dia", "total_venda_dia_kg"]].copy()
                dados_sku.rename(columns={"data_dia": "ds", "total_venda_dia_kg": "y"}, inplace=True)
                dados_sku["ds"] = pd.to_datetime(dados_sku["ds"], dayfirst=True)

                if dados_sku.empty:
                    continue

                # Treina e gera previsão
                previsao = treinar_e_prever(dados_sku, 7)
                rmse, mape = calcular_metricas(dados_sku, previsao)

                # Prepara dados para JSON
                previsao_futura = previsao.tail(7)[["ds", "yhat", "yhat_lower", "yhat_upper"]].copy()
                previsao_futura["ds"] = previsao_futura["ds"].dt.strftime("%Y-%m-%d")

                resultados.append({
                    "sku": int(sku),
                    "rmse": round(rmse, 2),
                    "mape": round(mape, 2),
                    "previsoes": previsao_futura.to_dict('records')
                })

            # Retorna JSON
            print(json.dumps(resultados, ensure_ascii=False, indent=2))

        else:
            caminho = input("Digite o caminho do arquivo (.csv ou .xlsx): ")
            sku = int(input("Digite o SKU que deseja analisar: "))
            dias_previsao = 7

            dados = carregar_arquivo(caminho, sku)

            if dados.empty:
                print(f"Nenhum dado encontrado para SKU {sku}")
                return

            previsao = treinar_e_prever(dados, dias_previsao)
            rmse, mape = calcular_metricas(dados, previsao)

            print("\nModelo treinado com sucesso!")
            print(f"RMSE: {rmse:.2f}")
            print(f"MAPE: {mape:.2f}%")

    except Exception as erro:
        print(f"Erro: {erro}")
        return

# Executa o script se for chamado diretamente
if __name__ == "__main__":
    main()
