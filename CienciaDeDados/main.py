import pandas as pd
from sklearn.metrics import mean_squared_error, mean_absolute_percentage_error
import numpy as np
from prophet import Prophet

# Importando nossa base de dados
df = pd.read_csv(R"C:\Users\juanl\Downloads\dados_vendas_sinteticos_asa.csv", encoding='latin1', sep=';', parse_dates=["data_dia"], dayfirst = True)

# Filtrando para o SKU da nossa equipe (SKU: 237479)
filtro_itamind = df["id_produto"] == 237479
df_itamind = df[filtro_itamind]
df_itamind = df_itamind[["data_dia", "total_venda_dia_kg"]]

# Iniciando o Prophet
m = Prophet()

# Trocando o nome das colunas das datas e das quantidades vendidas

df_itamind = df_itamind.rename(columns = {
    "data_dia" : "ds",
    "total_venda_dia_kg" : "y"
})

m.fit(df_itamind)

# Criar novo dataframe com as novas datas e quantidades previstas

future = m.make_future_dataframe(periods=0)

# Prevendo os novos dados para as novas datas
forecast = m.predict(future)
forecast.to_excel("test.xlsx")

fig1 = m.plot((forecast))
fig1.savefig("fig1")

fig2 = m.plot_components(forecast)
fig2.savefig("fig2")

# Calculando RMSE e MAPE
df_itamind_avaliacao = df_itamind.merge(forecast[["ds", "yhat"]], on="ds")

rmse = np.sqrt(mean_squared_error(df_itamind_avaliacao["y"], df_itamind_avaliacao["yhat"]))

mape = mean_absolute_percentage_error(df_itamind_avaliacao['y'], df_itamind_avaliacao['yhat']) * 100

print(f'RMSE: {rmse:.2f} kg')
print(f'MAPE: {mape:.2f}%')