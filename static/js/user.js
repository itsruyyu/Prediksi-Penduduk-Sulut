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

function downloadPrediksiAdminPDF() {
  if (!chartAdminResult) {
    alert("Grafik belum tersedia");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Laporan Prediksi Admin", 10, 10);
  let y = 20;

  chartAdminResult.data.labels.forEach((label, i) => {
    doc.text(`${label} : ${chartAdminResult.data.datasets[0].data[i]}`, 10, y);
    y += 8;
  });

  doc.save("laporan_prediksi_admin.pdf");
}

/* =====================================================
   INIT
===================================================== */
window.onload = loadDataPenduduk;
