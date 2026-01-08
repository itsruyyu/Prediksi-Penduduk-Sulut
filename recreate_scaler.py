import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import joblib
import os

print("NumPy version:", np.__version__)

# Load data
df = pd.read_csv('data/data_admin.csv')
print("Data loaded, shape:", df.shape)

# Create scaler dict
scaler = {
    "Tahun": MinMaxScaler(),
    "Jumlah": MinMaxScaler(),
    "Laju": MinMaxScaler()
}

# Fit scaler
scaler["Tahun"].fit(df[["Tahun"]])
scaler["Jumlah"].fit(df[["Jumlah"]])
scaler["Laju"].fit(df[["Laju"]])

# Test scaler
test_data = np.array([[2025, 2000, 1.0]])
scaled = scaler["Jumlah"].transform(test_data[:, 1:2])
unscaled = scaler["Jumlah"].inverse_transform(scaled)
print("Scaler test - original:", test_data[0, 1], "scaled:", scaled[0, 0], "unscaled:", unscaled[0, 0])

# Save scaler
joblib.dump(scaler, 'model/scaler.save')
print("Scaler recreated and saved successfully")