/* ============================================================
   Museum Aceh — koleksi.js
   Logic: tabel koleksi, filter, delete dengan konfirmasi
   ============================================================ */

requireAuth();

// ── State ──────────────────────────────────────────────────────
const state = {
  page: 1,
  limit: 20,
  q: '',
  kondisi_terkini: '',
  jenis_koleksi: '',
  lokasi_terkini: '',
  sort_by: 'no_inventaris',
  sort_order: 'asc',
  total: 0,
  totalPages: 0,
};

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  renderUserInfo();
  bindFilterEvents();
  await loadKoleksiOptions();
  await loadKoleksi();
});

// ── Bind Filter Events ─────────────────────────────────────────
function bindFilterEvents() {
  const inputQ = document.getElementById('filter-q');
  const selKondisi = document.getElementById('filter-kondisi');
  const selJenis = document.getElementById('filter-jenis');
  const inputLokasi = document.getElementById('filter-lokasi');
  const selSortBy = document.getElementById('filter-sort-by');
  const selSortOrder = document.getElementById('filter-sort-order');
  const selLimit = document.getElementById('filter-limit');
  const btnReset = document.getElementById('btn-reset-filter');

  const debouncedLoad = debounce(async () => {
    state.page = 1;
    await loadKoleksi();
  }, 400);

  if (inputQ) {
    inputQ.addEventListener('input', () => {
      state.q = inputQ.value.trim();
      debouncedLoad();
    });
  }

  if (selKondisi) {
    selKondisi.addEventListener('change', async () => {
      state.kondisi_terkini = selKondisi.value;
      state.page = 1;
      await loadKoleksi();
    });
  }

  if (selJenis) {
    selJenis.addEventListener('change', async () => {
      state.jenis_koleksi = selJenis.value;
      state.page = 1;
      await loadKoleksi();
    });
  }

  if (inputLokasi) {
    inputLokasi.addEventListener('input', () => {
      state.lokasi_terkini = inputLokasi.value.trim();
      debouncedLoad();
    });
  }

  if (selSortBy) {
    selSortBy.addEventListener('change', async () => {
      state.sort_by = selSortBy.value;
      state.page = 1;
      await loadKoleksi();
    });
  }

  if (selSortOrder) {
    selSortOrder.addEventListener('change', async () => {
      state.sort_order = selSortOrder.value;
      state.page = 1;
      await loadKoleksi();
    });
  }

  if (selLimit) {
    selLimit.addEventListener('change', async () => {
      state.limit = parseInt(selLimit.value);
      state.page = 1;
      await loadKoleksi();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      state.q = ''; state.kondisi_terkini = ''; state.jenis_koleksi = '';
      state.lokasi_terkini = ''; state.sort_by = 'no_inventaris';
      state.sort_order = 'asc'; state.limit = 20; state.page = 1;

      if (inputQ) inputQ.value = '';
      if (selKondisi) selKondisi.value = '';
      if (selJenis) selJenis.value = '';
      if (inputLokasi) inputLokasi.value = '';
      if (selSortBy) selSortBy.value = 'no_inventaris';
      if (selSortOrder) selSortOrder.value = 'asc';
      if (selLimit) selLimit.value = '20';

      await loadKoleksi();
    });
  }
}

// ── Load jenis koleksi untuk dropdown ─────────────────────────
async function loadKoleksiOptions() {
  try {
    const res = await API.getKoleksi({ limit: 500 });
    const list = res?.data?.data ?? [];
    const jenisSet = [...new Set(list.map(k => k.jenis_koleksi).filter(Boolean))].sort();

    const selJenis = document.getElementById('filter-jenis');
    if (selJenis && jenisSet.length) {
      selJenis.innerHTML = '<option value="">Semua Jenis</option>' +
        jenisSet.map(j => `<option value="${j}">${j}</option>`).join('');
    }
  } catch (err) {
    // Silently fail for dropdown
  }
}

// ── Load Koleksi ───────────────────────────────────────────────
async function loadKoleksi() {
  const tbody = document.getElementById('tbody-koleksi');
  const infoEl = document.getElementById('pagination-info');
  const filterBadge = document.getElementById('filter-badge');

  if (!tbody) return;
  tbody.innerHTML = skeletonRows(state.limit, 7);

  // Update filter badge
  const activeFilters = [state.q, state.kondisi_terkini, state.jenis_koleksi, state.lokasi_terkini]
    .filter(Boolean).length;
  if (filterBadge) {
    filterBadge.textContent = activeFilters > 0 ? `${activeFilters} filter aktif` : '';
    filterBadge.style.display = activeFilters > 0 ? 'inline-flex' : 'none';
  }

  try {
    const res = await API.getKoleksi({
      q:               state.q,
      kondisi_terkini: state.kondisi_terkini,
      jenis_koleksi:   state.jenis_koleksi,
      lokasi_terkini:  state.lokasi_terkini,
      sort_by:         state.sort_by,
      sort_order:      state.sort_order,
      page:            state.page,
      limit:           state.limit,
    });

    const list = res?.data?.data ?? [];
    const meta = res?.data?.meta ?? {};

    state.total = meta.total ?? 0;
    state.totalPages = meta.totalPages ?? 1;

    // Update pagination info
    if (infoEl) {
      const from = Math.min((state.page - 1) * state.limit + 1, state.total);
      const to = Math.min(state.page * state.limit, state.total);
      infoEl.textContent = `Menampilkan ${from}–${to} dari ${state.total.toLocaleString('id-ID')} koleksi`;
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty">
            <div class="empty-icon">🔍</div>
            <div class="empty-text">Tidak ada koleksi yang ditemukan</div>
          </td>
        </tr>`;
    } else {
      tbody.innerHTML = list.map((k, i) => `
        <tr>
          <td class="text-muted text-sm">${(state.page - 1) * state.limit + i + 1}</td>
          <td><code style="font-size:13px;color:var(--teks-sekunder)">${k.no_inventaris || '-'}</code></td>
          <td><strong>${k.nama_koleksi || '-'}</strong></td>
          <td>${k.jenis_koleksi || '-'}</td>
          <td>${getBadgeKondisi(k.kondisi_terkini)}</td>
          <td>${k.lokasi_terkini || '-'}</td>
          <td>
            <div class="action-group">
              <a href="input-koleksi.html?id=${k.id}" class="btn btn-sm btn-secondary" title="Edit koleksi">✏️</a>
              <button class="btn btn-sm btn-danger" onclick="konfirmasiHapus('${k.id}','${escapeHtml(k.nama_koleksi)}','${escapeHtml(k.no_inventaris)}')" title="Hapus koleksi">🗑️</button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    renderPagination();

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty"><div class="empty-text text-danger">❌ ${err.message}</div></td></tr>`;
    showToast('Gagal memuat koleksi: ' + err.message, 'error');
  }
}

// ── Konfirmasi & Hapus ─────────────────────────────────────────
function konfirmasiHapus(id, nama, noInv) {
  showModalHapus({
    judul: 'Hapus Koleksi?',
    nama: nama,
    sub: `No. Inventaris: ${noInv}`,
    onConfirm: async () => {
      try {
        const res = await API.deleteKoleksi(id);
        if (res?.success) {
          showToast(`Koleksi "${nama}" berhasil dihapus.`, 'success');
          await loadKoleksi();
        } else {
          showToast(res?.message || 'Gagal menghapus koleksi.', 'error');
        }
      } catch (err) {
        showToast('Gagal menghapus: ' + err.message, 'error');
      }
    }
  });
}

// ── Render Pagination ──────────────────────────────────────────
function renderPagination() {
  const container = document.getElementById('pagination-controls');
  if (!container) return;

  const { page, totalPages } = state;
  const pages = [];

  // Always show first, last, current, and neighbors
  const range = new Set([1, totalPages, page, page - 1, page + 1].filter(p => p >= 1 && p <= totalPages));
  const sorted = [...range].sort((a, b) => a - b);

  let html = `<button class="page-btn" onclick="goToPage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>← Prev</button>`;

  let prev = null;
  sorted.forEach(p => {
    if (prev !== null && p - prev > 1) html += `<span class="page-btn" style="pointer-events:none;border-color:transparent">…</span>`;
    html += `<button class="page-btn ${p === page ? 'active' : ''}" onclick="goToPage(${p})">${p}</button>`;
    prev = p;
  });

  html += `<button class="page-btn" onclick="goToPage(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>Next →</button>`;

  container.innerHTML = html;
}

async function goToPage(p) {
  if (p < 1 || p > state.totalPages) return;
  state.page = p;
  await loadKoleksi();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Escape HTML ────────────────────────────────────────────────
function escapeHtml(str) {
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}