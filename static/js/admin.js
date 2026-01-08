let chartAdmin = null;
let hasilPrediksiGlobal = [];
let evaluasiGlobal = {};

/* INIT */
document.addEventListener("DOMContentLoaded", () => {
    cekStatusModel();
    loadHasilPrediksiTersimpan();
});

/* CEK STATUS MODEL */
async function cekStatusModel() {
    const res = await fetch("/api/status_model");
    const data = await res.json();
    const indicator = document.getElementById("statusIndicator");
    const text = document.getElementById("statusText");
    if (data.model_ready) {
        indicator.className = "w-3 h-3 rounded-full bg-green-500";
        text.innerText = "Model tersedia";
    } else {
        indicator.className = "w-3 h-3 rounded-full bg-red-500";
        text.innerText = "Model belum dilatih";
    }
}

/* LOAD HASIL PREDIKSI TERSIMPAN */
async function loadHasilPrediksiTersimpan() {
    const res = await fetch("/api/get_prediksi_admin");
    const data = await res.json();
    if (data.status === "success") {
        hasilPrediksiGlobal = data.data.prediksi;
        evaluasiGlobal = data.data.evaluasi;
        renderChart(data.data.prediksi);
        renderEvaluasi(data.data.evaluasi);
        document.getElementById("hasilTersimpan").classList.remove("hidden");
    }
}

/* UPLOAD DATASET USER */
async function uploadDatasetUser() {
    const fileInput = document.getElementById("userDataset");
    if (!fileInput.files.length) {
        alert("Silakan pilih dataset user");
        return;
    }

    const btn = document.querySelector('button[onclick="uploadDatasetUser()"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg class="animate-spin w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Mengunggah...';

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    const res = await fetch("/api/upload_user", {
        method: "POST",
        body: formData
    });

    btn.disabled = false;
    btn.innerHTML = originalText;

    const data = await res.json();
    if (res.status !== 200) {
        alert(data.error);
        return;
    }

    alert(data.message);
    loadUploadedData();
}

/* UPLOAD DATASET ADMIN */
async function uploadDatasetAdmin() {
    const fileInput = document.getElementById("adminDataset");
    if (!fileInput.files.length) {
        alert("Silakan pilih dataset admin");
        return;
    }

    const btn = document.querySelector('button[onclick="uploadDatasetAdmin()"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg class="animate-spin w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Mengunggah & Melatih...';

    // Tampilkan modal loading
    document.getElementById("loadingModal").classList.remove("hidden");

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    const res = await fetch("/api/upload_admin", {
        method: "POST",
        body: formData
    });

    // Sembunyikan modal loading
    document.getElementById("loadingModal").classList.add("hidden");

    btn.disabled = false;
    btn.innerHTML = originalText;

    const data = await res.json();
    if (res.status !== 200) {
        alert(data.error);
        return;
    }

    alert(data.message + (data.train_result ? "\n" + JSON.stringify(data.train_result, null, 2) : ""));
    cekStatusModel();
    loadUploadedData();  // Load data admin setelah upload
}

/* PREVIEW DATASET */
function previewDataset() {
    loadUploadedData();
}

/* LOAD UPLOADED DATA */
async function loadUploadedData() {
    const res = await fetch("/api/data_admin");
    const data = await res.json();
    if (res.status !== 200) {
        alert("Data belum diunggah atau error: " + data.error);
        return;
    }
    renderUploadedTable(data);
    renderDataChart(data);  // Tambahkan chart data aktual
    document.getElementById("dataTableContainer").classList.remove("hidden");
}

/* RENDER UPLOADED TABLE */
function renderUploadedTable(data) {
    const tbody = document.getElementById("uploadedDataTable");
    tbody.innerHTML = "";
    data.forEach(row => {
        tbody.innerHTML += `<tr><td class="p-2">${row.Tahun}</td><td class="p-2">${row.Jumlah}</td><td class="p-2">${row.Laju}</td></tr>`;
    });
}

/* RENDER DATA CHART */
function renderDataChart(data) {
    const labels = data.map(d => d.Tahun);
    const values = data.map(d => d.Jumlah);

    const ctx = document.getElementById("chartAdmin").getContext("2d");
    if (chartAdmin) chartAdmin.destroy();

    chartAdmin = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Data Penduduk Aktual",
                data: values,
                borderColor: "rgb(75, 192, 192)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderWidth: 2,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

/* TRAIN MODEL */
async function trainModel() {
    const btn = document.querySelector('button[onclick="trainModel()"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg class="animate-spin w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Melatih...';

    // Tampilkan modal loading
    document.getElementById("loadingModal").classList.remove("hidden");

    const res = await fetch("/api/train_model", { method: "POST" });
    const data = await res.json();

    // Sembunyikan modal loading
    document.getElementById("loadingModal").classList.add("hidden");

    btn.disabled = false;
    btn.innerHTML = originalText;

    if (res.status !== 200) {
        alert(data.error);
        return;
    }

    alert(data.message);
    cekStatusModel();
}

/* PREDIKSI ADMIN */
async function prediksiAdmin() {
    const tahunAkhir = document.getElementById("tahunAkhirAdmin").value;
    if (!tahunAkhir) {
        alert("Tahun akhir wajib diisi");
        return;
    }

    // Cek jika ada hasil tersimpan
    if (hasilPrediksiGlobal.length > 0) {
        const konfirmasi = confirm("Hasil prediksi lama sudah tersimpan. Apakah Anda ingin menggantinya?");
        if (!konfirmasi) {
            return;
        }
    }

    const btn = document.getElementById("prediksiBtn");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg class="animate-spin w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Memprediksi...';

    const res = await fetch("/api/prediksi_admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tahun_akhir: tahunAkhir })
    });

    btn.disabled = false;
    btn.innerHTML = originalText;

    const data = await res.json();
    if (data.status !== "success") {
        alert(data.message);
        return;
    }

    hasilPrediksiGlobal = data.prediksi;
    evaluasiGlobal = data.evaluasi;

    renderChart(data.prediksi);
    renderEvaluasi(data.evaluasi);
    document.getElementById("hasilTersimpan").classList.remove("hidden");
    alert(data.message);
}

/* RENDER CHART */
function renderChart(prediksi) {
    const labels = prediksi.map(p => p.tahun);
    const values = prediksi.map(p => p.jumlah);

    const ctx = document.getElementById("chartAdmin").getContext("2d");
    if (chartAdmin) chartAdmin.destroy();

    chartAdmin = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Prediksi Jumlah Penduduk",
                data: values,
                borderWidth: 2,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

/* RENDER EVALUASI */
function renderEvaluasi(evaluasi) {
    const mape = evaluasi.MAPE;
    const mae = evaluasi.MAE;

    let akurasi = 100 - mape;
    if (akurasi < 0) akurasi = 0;
    if (akurasi > 100) akurasi = 100;

    document.getElementById("mapeAdmin").innerText = mape.toFixed(3);
    document.getElementById("maeAdmin").innerText = mae.toFixed(3);
    document.getElementById("akurasiAdmin").innerText = akurasi.toFixed(2);
}

/* DOWNLOAD CSV */
function downloadCSV() {
    if (hasilPrediksiGlobal.length === 0) {
        alert("Belum ada hasil prediksi");
        return;
    }

    let csv = "Tahun,Jumlah\n";
    hasilPrediksiGlobal.forEach(r => {
        csv += `${r.tahun},${r.jumlah}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "hasil_prediksi_admin.csv";
    a.click();

    URL.revokeObjectURL(url);
}

/* DOWNLOAD CHART */
function downloadChart() {
    if (!chartAdmin) {
        alert("Grafik belum tersedia");
        return;
    }
    const link = document.createElement('a');
    link.download = 'prediksi_chart.png';
    link.href = chartAdmin.toBase64Image();
    link.click();
}

/* DOWNLOAD PDF */
function downloadPDF() {
    if (!chartAdmin) {
        alert("Grafik belum tersedia");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text('Laporan Prediksi Penduduk Sulawesi Utara', 10, 10);
    doc.text('Tahun | Jumlah', 10, 20);

    let y = 30;
    chartAdmin.data.labels.forEach((label, i) => {
        doc.text(`${label} | ${chartAdmin.data.datasets[0].data[i]}`, 10, y);
        y += 10;
    });

    const mape = document.getElementById("mapeAdmin").innerText;
    const mae = document.getElementById("maeAdmin").innerText;
    const akurasi = document.getElementById("akurasiAdmin").innerText;

    doc.text(`MAPE: ${mape}%, MAE: ${mae}, Akurasi: ${akurasi}%`, 10, y);

    doc.save('laporan_prediksi.pdf');
}
