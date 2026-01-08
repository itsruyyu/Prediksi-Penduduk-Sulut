# Prediksi Penduduk Sulawesi Utara - Web App

Aplikasi web berbasis Flask untuk prediksi jumlah penduduk Sulawesi Utara menggunakan model LSTM (Long Short-Term Memory). Aplikasi ini menyediakan antarmuka untuk admin dan user, dengan fitur upload dataset, pelatihan model, dan evaluasi prediksi.

## Fitur Utama

- **Prediksi Penduduk**: Lakukan prediksi jumlah penduduk hingga tahun 2040 berdasarkan data historis.
- **Interface Admin**: Panel admin untuk mengelola dataset, melatih model, dan melihat evaluasi.
- **Interface User**: Halaman user untuk melakukan prediksi sederhana.
- **Upload Dataset**: Unggah file CSV untuk data admin dan user.
- **Evaluasi Model**: Hitung metrik evaluasi seperti MAE, MSE, dan R² pada data historis.
- **Autentikasi**: Sistem login untuk akses admin.

## Teknologi yang Digunakan

- **Backend**: Flask (Python)
- **Machine Learning**: TensorFlow/Keras (LSTM Model)
- **Data Processing**: Pandas, NumPy, Scikit-learn
- **Frontend**: HTML, CSS, JavaScript
- **Database**: File-based (CSV, JSON untuk output)

## Struktur Proyek

```
PROTOTYPE/
├── app.py                 # Aplikasi utama Flask
├── train.py               # Script pelatihan model LSTM
├── utils.py               # Fungsi utilitas (load data, scaling, dll.)
├── requirements.txt       # Dependensi Python
├── README.md              # Dokumentasi ini
├── data/
│   ├── data_admin.csv     # Dataset untuk admin
│   └── data_user.csv      # Dataset untuk user
├── model/
│   ├── model_lstm.h5      # Model LSTM terlatih
│   └── scaler.save        # Scaler untuk normalisasi data
├── output/
│   └── prediksi_admin.json # Hasil prediksi tersimpan
├── static/
│   ├── assets/            # Asset tambahan
│   ├── css/
│   │   └── style.css      # Styling CSS
│   └── js/
│       ├── admin.js       # JavaScript untuk halaman admin
│       └── user.js        # JavaScript untuk halaman user
└── templates/
    ├── index.html         # Halaman utama
    ├── login.html         # Halaman login
    └── admin.html         # Halaman admin
```

## Instalasi dan Setup

### Prasyarat

- Python 3.8 atau lebih baru
- Git (untuk cloning repositori)
- TensorFlow (akan diinstall via requirements.txt)

### Langkah Instalasi

1. **Clone repositori**:
   ```bash
   git clone https://github.com/itsruyyu/Prediksi-Penduduk-Sulut.git
   cd Prediksi-Penduduk-Sulut
   ```

2. **Buat virtual environment** (opsional tapi direkomendasikan):
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Pada Windows
   ```

3. **Install dependensi**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Jalankan aplikasi**:
   ```bash
   python app.py
   ```

5. **Akses aplikasi**:
   - Buka browser dan kunjungi `http://localhost:5000/`

## Penggunaan

### Untuk User
1. Kunjungi halaman utama.
2. Pilih tahun akhir prediksi (2026-2040).
3. Klik "Prediksi" untuk mendapatkan hasil.

### Untuk Admin
1. Kunjungi `/login` dan login dengan kredensial admin.
2. Di panel admin:
   - Upload dataset baru jika diperlukan.
   - Lihat status model.
   - Lakukan prediksi dengan evaluasi.
   - Lihat hasil prediksi tersimpan.

### Pelatihan Model
Untuk melatih ulang model:
```bash
python train.py
```
Pastikan dataset tersedia di folder `data/`.

## API Endpoints

- `GET /`: Halaman utama
- `GET /login`: Halaman login
- `POST /api/login`: Login admin
- `GET /admin`: Panel admin (butuh login)
- `GET /api/status_model`: Status model
- `POST /api/upload_admin`: Upload dataset admin
- `POST /api/upload_user`: Upload dataset user
- `POST /api/prediksi_admin`: Prediksi dengan evaluasi (admin)
- `POST /api/prediksi_user`: Prediksi sederhana (user)
- `GET /api/get_prediksi_admin`: Ambil hasil prediksi tersimpan

## Konfigurasi

- **Port**: Default 5000 (debug mode)
- **Dataset**: Pastikan file CSV memiliki kolom yang sesuai (tahun, jumlah penduduk)
- **Model**: Model LSTM dengan sequence length 3
- **Scaler**: MinMaxScaler untuk normalisasi

## Troubleshooting

- **TensorFlow tidak tersedia**: Aplikasi akan menggunakan mock model untuk testing.
- **Model tidak ditemukan**: Pastikan file `model_lstm.h5` dan `scaler.save` ada di folder `model/`.
- **Error upload**: Periksa ukuran file dan format CSV.
- **Login gagal**: Gunakan kredensial yang benar (lihat kode untuk ADMIN_USERNAME dan ADMIN_PASSWORD).

## Kontribusi

1. Fork repositori ini.
2. Buat branch fitur baru (`git checkout -b feature/AmazingFeature`).
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`).
4. Push ke branch (`git push origin feature/AmazingFeature`).
5. Buat Pull Request.

## Lisensi

Proyek ini menggunakan lisensi MIT. Lihat file `LICENSE` untuk detail.

## Kontak

- **Pengembang**: itsruyyu
- **Email**: stefanusmongkaren@gmail.com
- **GitHub**: [https://github.com/itsruyyu](https://github.com/itsruyyu)

---

*Proyek ini dibuat untuk keperluan akademik/prediksi demografi Sulawesi Utara.*