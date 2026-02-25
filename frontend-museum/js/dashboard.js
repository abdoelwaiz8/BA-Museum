/* ============================================================
   Museum Aceh — dashboard.js
   Logic: statistik, grafik Chart.js, tabel BA, aktivitas
   ============================================================ */

requireAuth();

// ── State ──────────────────────────────────────────────────────
let chartKondisi = null;
let chartJenis = null;

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  renderUserInfo();
  showSkeletons();
  await Promise.all([
    loadStatistik(),
    loadGrafik(),
    loadBeritaAcaraTerbaru(),
    loadAktivitas(),
  ]);
});

// ── Skeleton loading ───────────────────────────────────────────
function showSkeletons() {
  document.querySelectorAll('.stat-value').forEach(el => {
    el.innerHTML = '<div class="skeleton skeleton-stat"></div>';
  });
}

// ── Load Statistik ─────────────────────────────────────────────
async function loadStatistik() {
  try {
    const [resTotal, resBA, resBaik] = await Promise.all([
      API.getKoleksi({ limit: 1 }),
      API.getBeritaAcara(),
      API.getKoleksi({ kondisi_terkini: 'Baik', limit: 1 }),
    ]);

    const total = resTotal?.data?.meta?.total ?? 0;
    const totalBA = resBA?.data?.length ?? 0;
    const baik = resBaik?.data?.meta?.total ?? 0;
    const perhatian = Math.max(0, total - baik);

    // Animate counting
    animateCount('stat-total', total);
    animateCount('stat-ba', totalBA);
    animateCount('stat-baik', baik);
    animateCount('stat-perhatian', perhatian);

  } catch (err) {
    showToast('Gagal memuat statistik: ' + err.message, 'error');
  }
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const duration = 800;
  const step = Math.ceil(target / (duration / 16));
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current.toLocaleString('id-ID');
    if (current >= target) clearInterval(timer);
  }, 16);
}

// ── Load Grafik ────────────────────────────────────────────────
async function loadGrafik() {
  try {
    const [resBaik, resRingan, resBerat, resAll] = await Promise.all([
      API.getKoleksi({ kondisi_terkini: 'Baik', limit: 1 }),
      API.getKoleksi({ kondisi_terkini: 'Rusak Ringan', limit: 1 }),
      API.getKoleksi({ kondisi_terkini: 'Rusak Berat', limit: 1 }),
      API.getKoleksi({ limit: 500 }),
    ]);

    const dataKondisi = {
      baik:   resBaik?.data?.meta?.total ?? 0,
      ringan: resRingan?.data?.meta?.total ?? 0,
      berat:  resBerat?.data?.meta?.total ?? 0,
    };

    renderChartKondisi(dataKondisi);

    // Kelompokkan by jenis_koleksi
    const koleksiList = resAll?.data?.data ?? [];
    const jenisMap = {};
    koleksiList.forEach(k => {
      const jenis = k.jenis_koleksi || 'Tidak Diketahui';
      jenisMap[jenis] = (jenisMap[jenis] || 0) + 1;
    });

    // Sort descending, ambil top 8
    const sorted = Object.entries(jenisMap)
      .sort(([,a],[,b]) => b - a)
      .slice(0, 8);

    renderChartJenis(sorted);

  } catch (err) {
    console.error('Grafik error:', err);
  }
}

function renderChartKondisi({ baik, ringan, berat }) {
  const ctx = document.getElementById('chart-kondisi');
  if (!ctx) return;
  if (chartKondisi) chartKondisi.destroy();

  chartKondisi = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Baik', 'Rusak Ringan', 'Rusak Berat'],
      datasets: [{
        data: [baik, ringan, berat],
        backgroundColor: ['#16A34A', '#CA8A04', '#DC2626'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 3,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            font: { family: "'Source Sans 3', sans-serif", size: 13 },
            usePointStyle: true,
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.raw} koleksi`
          }
        }
      }
    }
  });
}

function renderChartJenis(data) {
  const ctx = document.getElementById('chart-jenis');
  if (!ctx) return;
  if (chartJenis) chartJenis.destroy();

  const labels = data.map(([k]) => k);
  const values = data.map(([,v]) => v);

  chartJenis = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Jumlah Koleksi',
        data: values,
        backgroundColor: labels.map((_, i) => `rgba(185,28,28,${0.5 + (i / labels.length) * 0.5})`),
        borderColor: '#B91C1C',
        borderWidth: 1,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.raw} koleksi`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: "'Source Sans 3', sans-serif", size: 11 },
            maxRotation: 30,
          }
        },
        y: {
          grid: { color: '#f1f5f9' },
          ticks: {
            font: { family: "'Source Sans 3', sans-serif", size: 12 },
            stepSize: 1,
          },
          beginAtZero: true,
        }
      }
    }
  });
}

// ── Load BA Terbaru ────────────────────────────────────────────
async function loadBeritaAcaraTerbaru() {
  const tbody = document.getElementById('tbody-ba');
  if (!tbody) return;

  tbody.innerHTML = skeletonRows(5, 6);

  try {
    const res = await API.getBeritaAcara();
    const list = res?.data ?? [];
    const terbaru = list.slice(0, 5);

    if (terbaru.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="table-empty">
            <div class="empty-icon">📋</div>
            <div class="empty-text">Belum ada berita acara</div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = terbaru.map((ba, i) => `
      <tr>
        <td><strong>${ba.nomor_surat || '-'}</strong></td>
        <td>${ba.jenis_ba || '-'}</td>
        <td>${formatDate(ba.tanggal_serah_terima)}</td>
        <td>${ba.pihak1?.nama || '-'}</td>
        <td>${ba.pihak2?.nama || '-'}</td>
        <td>
          <div class="action-group">
            <a href="berita-acara.html#detail-${ba.id}" class="btn btn-sm btn-ghost" title="Lihat detail">👁️</a>
            <button class="btn btn-sm btn-secondary" onclick="downloadPDF('${ba.id}','${ba.nomor_surat}')" title="Download PDF">⬇️ PDF</button>
          </div>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty"><div class="empty-text text-danger">Gagal memuat data</div></td></tr>`;
    showToast('Gagal memuat berita acara: ' + err.message, 'error');
  }
}

// ── Load Aktivitas ─────────────────────────────────────────────
async function loadAktivitas() {
  const container = document.getElementById('aktivitas-feed');
  if (!container) return;

  container.innerHTML = `<div class="skeleton skeleton-text w-100"></div>`.repeat(5);

  try {
    const [resBA, resKoleksi] = await Promise.all([
      API.getBeritaAcara(),
      API.getKoleksi({ sort_by: 'created_at', sort_order: 'desc', limit: 5 }),
    ]);

    const activities = [];

    (resBA?.data ?? []).slice(0, 5).forEach(ba => {
      activities.push({
        icon: '📋',
        text: `Berita Acara <strong>${ba.nomor_surat}</strong> (${ba.jenis_ba}) dibuat`,
        time: ba.created_at,
      });
    });

    (resKoleksi?.data?.data ?? []).forEach(k => {
      activities.push({
        icon: '🏺',
        text: `Koleksi <strong>${k.nama_koleksi}</strong> ditambahkan`,
        time: k.created_at,
      });
    });

    // Sort by time descending
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const top = activities.slice(0, 8);

    if (top.length === 0) {
      container.innerHTML = `<p class="text-muted text-sm">Belum ada aktivitas.</p>`;
      return;
    }

    container.innerHTML = `
      <div class="timeline">
        ${top.map(a => `
          <div class="timeline-item">
            <div class="timeline-content">
              <div class="timeline-text">${a.icon} ${a.text}</div>
              <div class="timeline-time">🕐 ${timeAgo(a.time)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

  } catch (err) {
    container.innerHTML = `<p class="text-danger text-sm">Gagal memuat aktivitas.</p>`;
  }
}