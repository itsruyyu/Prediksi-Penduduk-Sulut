from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_cors import CORS
import os
import numpy as np
import pandas as pd
try:
    import tensorflow as tf
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    print("TensorFlow not available, using mock model for testing")
import json

from utils import (
    load_dataset,
    scale_features,
    create_sequences,
    forecast_autoregressive,
    evaluate_model,
    load_scaler
)

from train import train_lstm_model

# Mock model for testing when TensorFlow is not available
class MockModel:
    def predict(self, X, verbose=0):
        # Return random predictions for testing
        return np.random.rand(len(X), 1)

# =========================================
# INISIALISASI APLIKASI
# =========================================
app = Flask(__name__)
app.secret_key = "prediksi_penduduk_secret"
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_DIR = os.path.join(BASE_DIR, "data")
MODEL_DIR = os.path.join(BASE_DIR, "model")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
PREDIKSI_ADMIN_FILE = os.path.join(OUTPUT_DIR, "prediksi_admin.json")

DATA_USER_PATH = os.path.join(DATA_DIR, "data_user.csv")
DATA_ADMIN_PATH = os.path.join(DATA_DIR, "data_admin.csv")
MODEL_PATH = os.path.join(MODEL_DIR, "model_lstm.h5")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.save")

SEQ_LENGTH = 3

# =========================================
# KONSTANTA LOGIN ADMIN
# =========================================
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

# =========================================
# FUNGSI UTILITAS PREDIKSI ADMIN
# =========================================
def save_prediksi_admin(prediksi, evaluasi):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    data = {
        "prediksi": prediksi,
        "evaluasi": evaluasi,
        "timestamp": str(pd.Timestamp.now())
    }
    with open(PREDIKSI_ADMIN_FILE, 'w') as f:
        json.dump(data, f, indent=4)

def load_prediksi_admin():
    if os.path.exists(PREDIKSI_ADMIN_FILE):
        with open(PREDIKSI_ADMIN_FILE, 'r') as f:
            return json.load(f)
    return None

# =========================================
# ROUTING HALAMAN
# =========================================
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/login")
def login_page():
    return render_template("login.html")


@app.route("/admin")
def admin():
    if not session.get("admin_logged_in"):
        return redirect(url_for("login_page"))
    return render_template("admin.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login_page"))

@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json()
    if data["username"] == ADMIN_USERNAME and data["password"] == ADMIN_PASSWORD:
        session["admin_logged_in"] = True
        return jsonify({"message": "Login berhasil"})
    return jsonify({"error": "Username atau password salah"}), 401


def admin_required():
    if not session.get("admin_logged_in"):
        return False
    return True

# =========================================
# API STATUS MODEL (ADMIN)
# =========================================
@app.route("/api/status_model", methods=["GET"])
def status_model():
    ready = os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH)
    return jsonify({"model_ready": ready})

# =========================================
# API GET PREDIKSI ADMIN (TERSIMPAN)
# =========================================
@app.route("/api/get_prediksi_admin", methods=["GET"])
def get_prediksi_admin():
    data = load_prediksi_admin()
    if data:
        return jsonify({"status": "success", "data": data})
    return jsonify({"status": "error", "message": "Belum ada hasil prediksi tersimpan"}), 404


# =========================================
# API GET DATA ADMIN (UNTUK USER)
# =========================================
@app.route("/api/data_admin", methods=["GET"])
def get_data_admin():
    try:
        df = load_dataset(DATA_ADMIN_PATH)
        data = df.to_dict(orient="records")
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================
# API UPLOAD DATASET USER
# =========================================
@app.route("/api/upload_user", methods=["POST"])
def upload_user():
    if "file" not in request.files:
        return jsonify({"error": "File tidak ditemukan"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Nama file kosong"}), 400

    os.makedirs(DATA_DIR, exist_ok=True)
    file.save(DATA_USER_PATH)

    return jsonify({"message": "Dataset user berhasil diunggah"})


# =========================================
# API UPLOAD DATASET ADMIN
# =========================================
@app.route("/api/upload_admin", methods=["POST"])
def upload_admin():
    if "file" not in request.files:
        return jsonify({"error": "File tidak ditemukan"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Nama file kosong"}), 400

    # Simpan file sementara untuk validasi
    temp_path = os.path.join(DATA_DIR, "temp_admin.csv")
    os.makedirs(DATA_DIR, exist_ok=True)
    file.save(temp_path)

    # Validasi dataset
    try:
        load_dataset(temp_path)
    except Exception as e:
        os.remove(temp_path)  # Hapus file temp jika gagal validasi
        return jsonify({"error": f"Dataset tidak valid: {str(e)}"}), 400

    # Jika valid, pindahkan ke path utama
    os.replace(temp_path, DATA_ADMIN_PATH)

    # Otomatis latih model setelah upload dataset baru
    try:
        train_result = train_lstm_model()
        return jsonify({
            "message": "Dataset admin berhasil diunggah dan model dilatih ulang",
            "train_result": train_result
        })
    except Exception as e:
        return jsonify({
            "message": "Dataset admin berhasil diunggah, tetapi training gagal",
            "error": str(e)
        }), 500


@app.route("/api/train_model", methods=["POST"])
def api_train_model():
    try:
        result = train_lstm_model()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================
# API GET DATA USER (UNTUK ADMIN)
# =========================================
@app.route("/api/data_user", methods=["GET"])
def get_data_user():
    try:
        df = load_dataset(DATA_USER_PATH)
        data = df.to_dict(orient="records")
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================
# API PREDIKSI USER
# =========================================
@app.route("/api/prediksi_user", methods=["POST"])
def prediksi_user():
    try:
        if not os.path.exists(MODEL_PATH):
            return jsonify({"error": "Model belum tersedia"}), 400

        data = request.get_json()
        tahun_akhir = int(data.get("tahun_akhir"))

        df = load_dataset(DATA_USER_PATH)
        scaled_data, _ = scale_features(df)  # Buat scaled_data untuk sequences

        if TENSORFLOW_AVAILABLE:
            model = tf.keras.models.load_model(MODEL_PATH)
        else:
            model = MockModel()
            print("Using mock model for testing")

        scaler = load_scaler(SCALER_PATH)

        # Hitung evaluasi model pada data historis
        X, y = create_sequences(scaled_data, SEQ_LENGTH)
        y_true = scaler["Jumlah"].inverse_transform(y.reshape(-1, 1)).flatten()

        y_pred_scaled = model.predict(X, verbose=0)
        y_pred = scaler["Jumlah"].inverse_transform(y_pred_scaled).flatten()

        evaluasi = evaluate_model(y_true, y_pred)

        last_seq = scaled_data[-SEQ_LENGTH:]
        n_steps = tahun_akhir - 2025

        if n_steps <= 0 or n_steps > 15:
            return jsonify({"error": "Rentang tahun prediksi tidak valid (2026-2040)"}), 400

        prediksi = forecast_autoregressive(
            model,
            last_seq,
            scaler,
            n_steps
        )

        tahun_prediksi = [
            2026 + i for i in range(n_steps)
        ]

        hasil = [
            {"tahun": t, "jumlah": int(p)}
            for t, p in zip(tahun_prediksi, prediksi)
        ]

        return jsonify({
            "status": "success",
            "message": "Prediksi berhasil dilakukan",
            "prediksi": hasil,
            "evaluasi": evaluasi
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================
# API PREDIKSI ADMIN + EVALUASI
# =========================================
@app.route("/api/prediksi_admin", methods=["POST"])
def prediksi_admin():
    try:
        if not os.path.exists(MODEL_PATH):
            return jsonify({"error": "Model belum tersedia"}), 400

        data = request.get_json()
        tahun_akhir = int(data.get("tahun_akhir"))

        df = load_dataset(DATA_ADMIN_PATH)
        scaled_data, _ = scale_features(df)  # Buat scaled_data untuk sequences

        if TENSORFLOW_AVAILABLE:
            model = tf.keras.models.load_model(MODEL_PATH)
        else:
            model = MockModel()
            print("Using mock model for testing")

        scaler = load_scaler(SCALER_PATH)

        X, y = create_sequences(scaled_data, SEQ_LENGTH)
        y_true = scaler["Jumlah"].inverse_transform(y.reshape(-1, 1)).flatten()

        y_pred_scaled = model.predict(X, verbose=0)
        y_pred = scaler["Jumlah"].inverse_transform(y_pred_scaled).flatten()

        evaluasi = evaluate_model(y_true, y_pred)

        last_seq = scaled_data[-SEQ_LENGTH:]
        n_steps = tahun_akhir - 2025

        if n_steps <= 0 or n_steps > 15:
            return jsonify({"error": "Rentang tahun prediksi tidak valid (2026-2040)"}), 400

        future_pred = forecast_autoregressive(
            model,
            last_seq,
            scaler,
            n_steps
        )

        tahun_prediksi = [
            2026 + i for i in range(n_steps)
        ]

        hasil = [
            {"tahun": t, "jumlah": int(p)}
            for t, p in zip(tahun_prediksi, future_pred)
        ]

        # Simpan hasil prediksi
        save_prediksi_admin(hasil, evaluasi)

        return jsonify({
            "status": "success",
            "message": "Prediksi berhasil dilakukan dan disimpan",
            "prediksi": hasil,
            "evaluasi": evaluasi
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================
# MAIN
# =========================================
if __name__ == "__main__":
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(MODEL_DIR, exist_ok=True)
    app.run(debug=True)
