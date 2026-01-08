import os
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.callbacks import EarlyStopping

from utils import (
    load_dataset,
    scale_features,
    create_sequences,
    save_scaler
)

# ===============================
# KONFIGURASI
# ===============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_DIR = os.path.join(BASE_DIR, "data")
MODEL_DIR = os.path.join(BASE_DIR, "model")

DATA_ADMIN_PATH = os.path.join(DATA_DIR, "data_admin.csv")
MODEL_PATH = os.path.join(MODEL_DIR, "model_lstm.h5")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.save")

SEQ_LENGTH = 3
EPOCHS = 300
BATCH_SIZE = 8


# ===============================
# FUNGSI TRAINING (INI YANG DIIMPORT)
# ===============================
def train_lstm_model():
    if not os.path.exists(DATA_ADMIN_PATH):
        raise FileNotFoundError("Dataset admin belum tersedia")

    df = load_dataset(DATA_ADMIN_PATH)
    scaled_data, scaler = scale_features(df)

    X, y = create_sequences(scaled_data, SEQ_LENGTH)

    if len(X) == 0:
        raise ValueError("Data tidak cukup untuk training")

    model = Sequential([
        LSTM(64, return_sequences=True, input_shape=(SEQ_LENGTH, 3)),
        LSTM(32),
        Dense(1)
    ])

    model.compile(
        optimizer="adam",
        loss="mse"
    )

    early_stop = EarlyStopping(
        monitor="loss",
        patience=20,
        restore_best_weights=True
    )

    model.fit(
        X,
        y,
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        verbose=1,
        callbacks=[early_stop]
    )

    os.makedirs(MODEL_DIR, exist_ok=True)
    model.save(MODEL_PATH)
    save_scaler(scaler, SCALER_PATH)

    return {
        "status": "success",
        "message": "Model berhasil dilatih",
        "jumlah_data": int(len(df))
    }


# ===============================
# EKSEKUSI LANGSUNG
# ===============================
if __name__ == "__main__":
    hasil = train_lstm_model()
    print(hasil)
