import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error
import joblib

# =========================================
# VALIDASI DAN PEMBACAAN DATASET
# =========================================
def load_dataset(csv_path):
    """
    Membaca dataset CSV dengan header:
    Tahun, Jumlah, Laju
    """
    df = pd.read_csv(csv_path)

    required_cols = ["Tahun", "Jumlah", "Laju"]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Kolom {col} tidak ditemukan dalam dataset")

    df = df[required_cols]
    df["Tahun"] = pd.to_numeric(df["Tahun"], errors="coerce")
    df["Jumlah"] = pd.to_numeric(df["Jumlah"], errors="coerce")
    df["Laju"] = pd.to_numeric(df["Laju"], errors="coerce")

    df = df.dropna()
    df = df.sort_values("Tahun").reset_index(drop=True)

    return df


# =========================================
# SCALING PER KOLOM
# =========================================
def scale_features(df):
    """
    Melakukan scaling per kolom:
    - Tahun
    - Jumlah
    - Laju
    """
    scaler = {
        "Tahun": MinMaxScaler(),
        "Jumlah": MinMaxScaler(),
        "Laju": MinMaxScaler()
    }

    scaled_data = np.column_stack([
        scaler["Tahun"].fit_transform(df[["Tahun"]]),
        scaler["Jumlah"].fit_transform(df[["Jumlah"]]),
        scaler["Laju"].fit_transform(df[["Laju"]])
    ])

    return scaled_data, scaler


def inverse_scale_jumlah(scaler, data_scaled):
    """
    Inverse scaling hanya untuk kolom Jumlah Penduduk
    """
    dummy = np.zeros((len(data_scaled), 1))
    data = np.hstack((dummy, data_scaled.reshape(-1, 1), dummy))
    return scaler["Jumlah"].inverse_transform(data[:, 1:2]).flatten()


def save_scaler(scaler, path):
    joblib.dump(scaler, path)


def load_scaler(path):
    return joblib.load(path)


# =========================================
# PEMBENTUKAN SEQUENCE LSTM
# =========================================
def create_sequences(data, seq_length=3):
    """
    Membentuk data sequence LSTM
    Input  : [Tahun, Jumlah, Laju]
    Target : Jumlah
    """
    X, y = [], []

    for i in range(len(data) - seq_length):
        X.append(data[i:i + seq_length])
        y.append(data[i + seq_length, 1])

    return np.array(X), np.array(y)


# =========================================
# MULTI-STEP FORECASTING AUTOREGRESIF
# =========================================
def forecast_autoregressive(model, last_sequence, scaler, n_steps):
    """
    Prediksi multi-step autoregresif
    """
    predictions = []
    current_seq = last_sequence.copy()

    for _ in range(n_steps):
        pred_scaled = model.predict(
            current_seq.reshape(1, current_seq.shape[0], current_seq.shape[1]),
            verbose=0
        )[0][0]

        next_year = current_seq[-1, 0]
        next_laju = current_seq[-1, 2]

        next_row = np.array([next_year, pred_scaled, next_laju])
        predictions.append(pred_scaled)

        current_seq = np.vstack((current_seq[1:], next_row))

    pred_inv = inverse_scale_jumlah(scaler, np.array(predictions))
    return pred_inv


# =========================================
# EVALUASI MODEL
# =========================================
def evaluate_model(y_true, y_pred):
    """
    Menghitung MAE dan MAPE
    """
    mae = mean_absolute_error(y_true, y_pred)
    mape = mean_absolute_percentage_error(y_true, y_pred) * 100

    return {
        "MAE": float(mae),
        "MAPE": float(mape)
    }
