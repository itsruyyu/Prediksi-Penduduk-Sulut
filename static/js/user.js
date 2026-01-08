/* =====================================================
   GLOBAL VARIABLE
===================================================== */
let chartUser = null;
let chartAdminResult = null;

let fullData = [];
let showAll = false;

let hasilPrediksiAdmin = [];

/* =====================================================
   SMOOTH SCROLL (GLOBAL)
===================================================== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

/* =====================================================
   MOBILE MENU
===================================================== */
const burgerBtn = document.getElementById("burgerBtn");
const mobileMenu = document.getElementById("mobileMenu");
const closeBtn = document.getElementById("closeBtn");

function toggleMenu() {
  mobileMenu.classList.toggle("translate-x-full");
}

burgerBtn?.addEventListener("click", toggleMenu);
closeBtn?.addEventListener("click", toggleMenu);

document.addEventListener("click", (e) => {
  if (
    mobileMenu &&
    !mobileMenu.contains(e.target) &&
    burgerBtn &&
    !burgerBtn.contains(e.target)
  ) {
    mobileMenu.classList.add("translate-x-full");
  }
});

/* =====================================================
   LOAD DATA PENDUDUK (5 BARIS + TOGGLE)
===================================================== */
async function loadDataPenduduk() {
  try {
    const res = await fetch("/api/data_admin");
    if (!res.ok) throw new Error("Gagal memuat data");

    fullData = await res.json();
    showAll = false;
    renderDataPenduduk();

    const toggleBtn = document.getElementById("toggleDataBtn");
    if (fullData.length > 5) {
      toggleBtn.classList.remove("hidden");
    }

    await loadHasilPrediksiAdmin();
  } catch (err) {
    document.getElementById("dataTable").innerHTML = `
      <tr>
        <td colspan="3" class="p-3 text-red-500">
          ${err.message}
        </td>
      </tr>
    `;
  }
}

function renderDataPenduduk() {
  const table = document.getElementById("dataTable");
  table.innerHTML = "";

  const dataToShow = showAll ? fullData : fullData.slice(0, 5);

  dataToShow.forEach(row => {
    table.innerHTML += `
      <tr>
        <td class="p-3">${row.Tahun}</td>
        <td class="p-3">${row.Jumlah}</td>
        <td class="p-3">${row.Laju}</td>
      </tr>
    `;
  });
}

function toggleDataView() {
  showAll = !showAll;
  renderDataPenduduk();

  const btn = document.getElementById("toggleDataBtn");
  btn.innerText = showAll ? "Lihat Lebih Sedikit" : "Lihat Selengkapnya";
}

/* =====================================================
   LOAD HASIL PREDIKSI ADMIN (JSON)
===================================================== */
async function loadHasilPrediksiAdmin() {
  try {
    const res = await fetch("/api/get_prediksi_admin");
    const result = await res.json();

    if (result.status === "success") {
      hasilPrediksiAdmin = result.data.prediksi;
      renderChartAdminResult(
        result.data.prediksi,
        result.data.evaluasi
      );
    } else {
      renderEmptyAdminResult();
    }
  } catch (err) {
    renderEmptyAdminResult();
  }
}

function renderChartAdminResult(prediksi, evaluasi) {
  const labels = prediksi.map(p => p.tahun);
  const values = prediksi.map(p => p.jumlah);

  const ctx = document.getElementById("chartAdminResult").getContext("2d");
  if (chartAdminResult) chartAdminResult.destroy();

  chartAdminResult = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Prediksi Admin",
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

  const mape = evaluasi.MAPE;
  const mae = evaluasi.MAE;
  let akurasi = Math.max(0, Math.min(100, 100 - mape));

  document.getElementById("mapeAdminResult").innerText = mape.toFixed(3);
  document.getElementById("maeAdminResult").innerText = mae.toFixed(3);
  document.getElementById("akurasiAdminResult").innerText = akurasi.toFixed(2);
}

function renderEmptyAdminResult() {
  const ctx = document.getElementById("chartAdminResult").getContext("2d");
  if (chartAdminResult) chartAdminResult.destroy();

  chartAdminResult = new Chart(ctx, {
    type: "line",
    data: { labels: [], datasets: [] },
    options: { responsive: true, maintainAspectRatio: false }
  });

  document.getElementById("mapeAdminResult").innerText = "-";
  document.getElementById("maeAdminResult").innerText = "-";
  document.getElementById("akurasiAdminResult").innerText = "-";
}

/* =====================================================
   PREDIKSI USER (CHART + TABEL)
===================================================== */
async function prediksiUser() {
  const tahunAkhir = document.getElementById("tahunAkhir").value;
  if (!tahunAkhir) {
    alert("Tahun akhir wajib diisi");
    return;
  }

  const res = await fetch("/api/prediksi_user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tahun_akhir: tahunAkhir })
  });

  const data = await res.json();
  if (data.status !== "success") {
    alert(data.error || "Gagal melakukan prediksi");
    return;
  }

  document.getElementById("hasilPrediksi").classList.remove("hidden");

  const labels = data.prediksi.map(p => p.tahun);
  const values = data.prediksi.map(p => p.jumlah);

  const ctx = document.getElementById("chartUser").getContext("2d");
  if (chartUser) chartUser.destroy();

  chartUser = new Chart(ctx, {
    type: "line",
    data: {
      labels,
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

  // Evaluasi
  document.getElementById("mapeUser").innerText =
    data.evaluasi?.MAPE.toFixed(3) || "-";
  document.getElementById("maeUser").innerText =
    data.evaluasi?.MAE.toFixed(3) || "-";

  // === TABEL HASIL PREDIKSI USER ===
  let tableHTML = `
    <table class="min-w-full text-sm text-center mt-6 border">
      <thead class="bg-bright text-white">
        <tr>
          <th class="p-2">Tahun</th>
          <th class="p-2">Jumlah Penduduk</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.prediksi.forEach(p => {
    tableHTML += `
      <tr>
        <td class="p-2">${p.tahun}</td>
        <td class="p-2">${p.jumlah}</td>
      </tr>
    `;
  });

  tableHTML += `</tbody></table>`;
  document.getElementById("hasilPrediksi").insertAdjacentHTML("beforeend", tableHTML);
}

/* =====================================================
   DOWNLOAD CSV & PDF ADMIN
===================================================== */
function downloadPrediksiAdminCSV() {
  if (hasilPrediksiAdmin.length === 0) {
    alert("Belum ada prediksi admin");
    return;
  }

  let csv = "Tahun,Jumlah\n";
  hasilPrediksiAdmin.forEach(r => {
    csv += `${r.tahun},${r.jumlah}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "hasil_prediksi_admin.csv";
  a.click();

  URL.revokeObjectURL(url);
}

function terbilang(nilai) {
  const angka = [
    "", "satu", "dua", "tiga", "empat", "lima",
    "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"
  ];

  if (nilai < 12) return angka[nilai];
  if (nilai < 20) return terbilang(nilai - 10) + " belas";
  if (nilai < 100)
    return terbilang(Math.floor(nilai / 10)) + " puluh " + terbilang(nilai % 10);
  if (nilai < 200)
    return "seratus " + terbilang(nilai - 100);
  if (nilai < 1000)
    return terbilang(Math.floor(nilai / 100)) + " ratus " + terbilang(nilai % 100);
  if (nilai < 2000)
    return "seribu " + terbilang(nilai - 1000);
  if (nilai < 1000000)
    return terbilang(Math.floor(nilai / 1000)) + " ribu " + terbilang(nilai % 1000);
  if (nilai < 1000000000)
    return terbilang(Math.floor(nilai / 1000000)) + " juta " + terbilang(nilai % 1000000);

  return "jumlah sangat besar";
}

function generateNarasiPrediksi(prediksi, evaluasi) {
  if (!prediksi || prediksi.length === 0) return "";

  const tahunAwal = prediksi[0].tahun;
  const tahunAkhir = prediksi[prediksi.length - 1].tahun;

  const jumlahAwal = parseInt(prediksi[0].jumlah);
  const jumlahAkhir = parseInt(prediksi[prediksi.length - 1].jumlah);

  const tren = jumlahAkhir > jumlahAwal
    ? "mengalami peningkatan"
    : jumlahAkhir < jumlahAwal
    ? "mengalami penurunan"
    : "cenderung stabil";

  const mape = evaluasi?.MAPE ?? 0;
  const mae = evaluasi?.MAE ?? 0;
  const akurasi = Math.max(0, Math.min(100, 100 - mape));

  return `
Berdasarkan hasil pemodelan menggunakan metode Long Short-Term Memory (LSTM),
diperoleh prediksi jumlah penduduk Provinsi Sulawesi Utara untuk periode
${tahunAwal} hingga ${tahunAkhir}. Model ini dilatih menggunakan data historis
jumlah penduduk dan laju pertumbuhan penduduk, sehingga mampu menangkap pola
perubahan jumlah penduduk dari waktu ke waktu.

Hasil prediksi menunjukkan bahwa jumlah penduduk Provinsi Sulawesi Utara
${tren}. Pada awal periode prediksi, yaitu tahun ${tahunAwal},
jumlah penduduk diperkirakan mencapai
${jumlahAwal.toLocaleString("id-ID")} jiwa
(sekitar ${terbilang(jumlahAwal)} penduduk).
Jumlah ini terus berkembang hingga tahun ${tahunAkhir}, dengan estimasi mencapai
${jumlahAkhir.toLocaleString("id-ID")} jiwa
(sekitar ${terbilang(jumlahAkhir)} penduduk).

Berdasarkan evaluasi model, diperoleh nilai Mean Absolute Percentage Error (MAPE)
sebesar ${mape.toFixed(2)} persen dan Mean Absolute Error (MAE) sebesar
${mae.toFixed(0)} jiwa. Nilai tersebut menunjukkan bahwa tingkat akurasi model
mencapai sekitar ${akurasi.toFixed(2)} persen, sehingga hasil prediksi
dapat dikategorikan cukup baik dan layak digunakan sebagai gambaran tren
pertumbuhan penduduk di masa mendatang.

Dengan demikian, hasil prediksi ini dapat dimanfaatkan sebagai bahan
pertimbangan dalam perencanaan pembangunan daerah, khususnya pada sektor
kependudukan, pendidikan, kesehatan, dan infrastruktur di Provinsi Sulawesi Utara.
`.trim();
}


function downloadPrediksiAdminPDF() {
  if (!chartAdminResult || hasilPrediksiAdmin.length === 0) {
    alert("Data prediksi belum tersedia");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  const pageHeight = 297;
  let y = 15;

  const checkPageBreak = (height = 10) => {
    if (y + height > pageHeight - 15) {
      doc.addPage();
      y = 15;
    }
  };

  /* ==========================
     JUDUL
  ========================== */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("LAPORAN HASIL PREDIKSI JUMLAH PENDUDUK", 105, y, { align: "center" });

  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Provinsi Sulawesi Utara", 105, y, { align: "center" });

  y += 8;
  doc.line(10, y, 200, y);
  y += 8;

  /* ==========================
     EVALUASI
  ========================== */
  const mape = document.getElementById("mapeAdminResult").innerText;
  const mae = document.getElementById("maeAdminResult").innerText;
  const akurasi = document.getElementById("akurasiAdminResult").innerText;

  const boxW = 55;
  const boxH = 20;
  const startX = 15;

  doc.setFontSize(10);

  ["MAPE (%)", "MAE", "Akurasi (%)"].forEach((label, i) => {
    const val = [mape, mae, akurasi][i];
    doc.rect(startX + i * (boxW + 5), y, boxW, boxH);
    doc.text(label, startX + i * (boxW + 5) + boxW / 2, y + 7, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(val, startX + i * (boxW + 5) + boxW / 2, y + 14, { align: "center" });
    doc.setFont("helvetica", "normal");
  });

  y += boxH + 10;

  /* ==========================
   NARASI OTOMATIS
========================== */
checkPageBreak(40);
doc.setFont("helvetica", "bold");
doc.setFontSize(11);
doc.text("Ringkasan Hasil Prediksi", 10, y);
y += 6;

doc.setFont("helvetica", "normal");
doc.setFontSize(10);

const narasi = generateNarasiPrediksi(
  hasilPrediksiAdmin,
  {
    MAPE: parseFloat(document.getElementById("mapeAdminResult").innerText),
    MAE: parseFloat(document.getElementById("maeAdminResult").innerText)
  }
);

const narasiLines = doc.splitTextToSize(narasi, 190);

narasiLines.forEach(line => {
  checkPageBreak(6);
  doc.text(line, 10, y);
  y += 5;
});

y += 4;


  /* ==========================
     TABEL
  ========================== */
  checkPageBreak(20);
  doc.setFont("helvetica", "bold");
  doc.text("Tabel Hasil Prediksi Jumlah Penduduk", 10, y);
  y += 6;

  doc.setFontSize(10);
  doc.rect(10, y, 25, 8);
  doc.rect(35, y, 155, 8);
  doc.text("Tahun", 22, y + 5, { align: "center" });
  doc.text("Estimasi Jumlah Penduduk", 112, y + 5, { align: "center" });

  y += 8;
  doc.setFont("helvetica", "normal");

  hasilPrediksiAdmin.forEach(row => {
    checkPageBreak(10);

    const angka = parseInt(row.jumlah);
    const teks = terbilang(angka).trim();
    const formatted =
      angka.toLocaleString("id-ID") +
      " jiwa (sekitar " +
      teks +
      " penduduk)";

    doc.rect(10, y, 25, 10);
    doc.rect(35, y, 155, 10);
    doc.text(String(row.tahun), 22, y + 6, { align: "center" });
    doc.text(formatted, 37, y + 6);

    y += 10;
  });

  /* ==========================
     GRAFIK
  ========================== */
  checkPageBreak(100);
  doc.setFont("helvetica", "bold");
  doc.text("Grafik Hasil Prediksi Jumlah Penduduk", 10, y + 5);

  const canvas = document.getElementById("chartAdminResult");
  const chartImage = canvas.toDataURL("image/png", 1.0);

  doc.addImage(chartImage, "PNG", 15, y + 10, 180, 90);

  /* ==========================
     FOOTER
  ========================== */
  doc.setFontSize(9);
  doc.text(
    `Dihasilkan oleh Sistem Prediksi Penduduk | ${new Date().toLocaleDateString("id-ID")}`,
    105,
    290,
    { align: "center" }
  );

  doc.save("laporan_prediksi_penduduk_sulut.pdf");
}



/* =====================================================
   INIT
===================================================== */
window.onload = loadDataPenduduk;
