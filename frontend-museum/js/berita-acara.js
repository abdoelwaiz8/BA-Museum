/* ============================================================
   Museum Aceh — berita-acara.js
   Logic: Buat BA baru, list BA tersimpan, download PDF
   ============================================================ */

requireAuth();

// ── State ──────────────────────────────────────────────────────
let staffList = [];
let selectedItems = []; // { koleksi, kondisi, lokasi_tujuan, keterangan }

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  renderUserInfo();
  await Promise.all([
    loadStaff(),
    loadBeritaAcaraList(),
  ]);
  bindFormEvents();

  // Check if URL has hash for detail
  if (window.location.hash.startsWith('#detail-')) {
    const id = window.location.hash.replace('#detail-', '');
    if (id) openDetailModal(id);
  }
});

// ── Load Staff untuk Dropdown ──────────────────────────────────
async function loadStaff() {
  try {
    const res = await API.getStaff({ limit: 200 });
    staffList = res?.data?.data ?? [];
    populateStaffDropdowns();
  } catch (err) {
    showToast('Gagal memuat data staff: ' + err.message, 'error');
  }
}

function populateStaffDropdowns() {
  const opts = '<option value="">Pilih Staff...</option>' +
    staffList.map(s => `<option value="${s.id}">${s.nama} — ${s.jabatan}</option>`).join('');

  ['pihak_pertama_id', 'pihak_kedua_id', 'saksi1_id', 'saksi2_id'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opts;
  });
}

// ── Bind Form Events ───────────────────────────────────────────
function bindFormEvents() {
  const form = document.getElementById('form-ba');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitBA();
  });

  // Lampiran toggle
  const lampSwitch = document.getElementById('toggle-lampiran');
  if (lampSwitch) {
    lampSwitch.addEventListener('change', () => {
      const section = document.getElementById('lampiran-section');
      if (section) section.style.display = lampSwitch.checked ? 'block' : 'none';
    });
  }

  // Btn tambah koleksi
  const btnTambahKoleksi = document.getElementById('btn-tambah-koleksi');
  if (btnTambahKoleksi) {
    btnTambahKoleksi.addEventListener('click', () => openKoleksiModal());
  }
}

// ── Submit BA ──────────────────────────────────────────────────
async function submitBA() {
  if (!validateBA()) return;

  const payload = {
    nomor_surat:          getValue('nomor_surat'),
    jenis_ba:             getValue('jenis_ba'),
    tanggal_serah_terima: getValue('tanggal_serah_terima'),
    pihak_pertama_id:     getValue('pihak_pertama_id'),
    pihak_kedua_id:       getValue('pihak_kedua_id'),
    saksi1_id:            getValue('saksi1_id') || null,
    saksi2_id:            getValue('saksi2_id') || null,
    items: selectedItems.map(item => ({
      koleksi_id:    item.koleksi.id,
      kondisi:       item.kondisi,
      lokasi_tujuan: item.lokasi_tujuan,
      keterangan:    item.keterangan || '',
    })),
  };

  const btn = document.getElementById('btn-cetak');
  setLoading(btn, true);

  try {
    const res = await API.createBeritaAcara(payload);

    if (res?.success) {
      showToast('Berita Acara berhasil dibuat!', 'success');

      // Offer PDF download
      const ba = res.data;
      if (ba?.id) {
        setTimeout(() => {
          if (confirm(`Berita Acara berhasil dibuat. Download PDF sekarang?`)) {
            downloadPDF(ba.id, payload.nomor_surat);
          }
        }, 500);
      }

      // Reset form & reload list
      document.getElementById('form-ba').reset();
      selectedItems = [];
      renderSelectedItems();
      await loadBeritaAcaraList();

    } else {
      showToast(res?.message || 'Gagal membuat Berita Acara.', 'error');
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
}

// ── Validate BA Form ───────────────────────────────────────────
function validateBA() {
  const required = [
    { id: 'nomor_surat', label: 'Nomor Surat' },
    { id: 'jenis_ba', label: 'Jenis BA' },
    { id: 'tanggal_serah_terima', label: 'Tanggal' },
    { id: 'pihak_pertama_id', label: 'Pihak Pertama' },
    { id: 'pihak_kedua_id', label: 'Pihak Kedua' },
  ];

  let valid = true;
  required.forEach(({ id, label }) => {
    const val = getValue(id);
    const el = document.getElementById(id);
    if (!val) {
      if (el) el.classList.add('is-invalid');
      valid = false;
    } else {
      if (el) el.classList.remove('is-invalid');
    }
  });

  if (!valid) {
    showToast('Harap isi semua field yang wajib diisi.', 'warning');
    return false;
  }

  if (selectedItems.length === 0) {
    showToast('Minimal harus ada 1 koleksi dalam Berita Acara.', 'warning');
    return false;
  }

  return true;
}

// ── Modal Cari Koleksi ─────────────────────────────────────────
function openKoleksiModal() {
  const existing = document.getElementById('modal-koleksi-picker');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'modal-koleksi-picker';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width:600px">
      <div class="modal-header">
        <h3 class="modal-title">🏺 Cari Koleksi</h3>
        <button class="modal-close" onclick="document.getElementById('modal-koleksi-picker').remove()">✕</button>
      </div>
      <div class="modal-body">
        <div class="input-wrapper" style="margin-bottom:16px">
          <span class="input-icon">🔍</span>
          <input type="text" id="search-koleksi-picker" class="form-control" placeholder="Cari nama koleksi..." style="padding-left:36px">
        </div>
        <div id="picker-results" style="max-height:350px;overflow-y:auto">
          <p class="text-muted text-sm text-center" style="padding:20px">Ketik untuk mencari koleksi...</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('active'));

  const searchInput = document.getElementById('search-koleksi-picker');
  if (searchInput) {
    searchInput.focus();
    searchInput.addEventListener('input', debounce(async () => {
      const q = searchInput.value.trim();
      if (!q) return;
      await searchKoleksiForPicker(q);
    }, 350));
  }

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });
}

async function searchKoleksiForPicker(q) {
  const container = document.getElementById('picker-results');
  if (!container) return;

  container.innerHTML = '<p class="text-muted text-sm text-center" style="padding:20px">Mencari...</p>';

  try {
    const res = await API.getKoleksi({ q, limit: 20 });
    const list = res?.data?.data ?? [];

    if (list.length === 0) {
      container.innerHTML = `<p class="text-muted text-sm text-center" style="padding:20px">Koleksi tidak ditemukan.</p>`;
      return;
    }

    container.innerHTML = list.map(k => `
      <div class="picker-item" onclick="addKoleksiToBA('${k.id}', '${escapeJs(k.no_inventaris)}', '${escapeJs(k.nama_koleksi)}', '${escapeJs(k.jenis_koleksi || '')}', '${k.kondisi_terkini || 'Baik'}')"
        style="padding:12px;border-bottom:1px solid var(--abu-border);cursor:pointer;transition:background 0.15s;border-radius:4px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700;font-size:14px">${k.nama_koleksi}</div>
            <div style="font-size:12px;color:var(--teks-sekunder)">${k.no_inventaris} · ${k.jenis_koleksi || '-'}</div>
          </div>
          ${getBadgeKondisi(k.kondisi_terkini)}
        </div>
      </div>
    `).join('');

    // Hover effect
    container.querySelectorAll('.picker-item').forEach(item => {
      item.addEventListener('mouseenter', () => item.style.background = '#FEF2F2');
      item.addEventListener('mouseleave', () => item.style.background = '');
    });

  } catch (err) {
    container.innerHTML = `<p class="text-danger text-sm text-center" style="padding:20px">Gagal: ${err.message}</p>`;
  }
}

function addKoleksiToBA(id, noInv, nama, jenis, kondisi) {
  // Cek duplikat
  if (selectedItems.find(i => i.koleksi.id === id)) {
    showToast('Koleksi sudah ada dalam daftar.', 'warning');
    return;
  }

  selectedItems.push({
    koleksi: { id, no_inventaris: noInv, nama_koleksi: nama, jenis_koleksi: jenis },
    kondisi: kondisi,
    lokasi_tujuan: '',
    keterangan: '',
  });

  renderSelectedItems();
  document.getElementById('modal-koleksi-picker')?.remove();
  showToast(`Koleksi "${nama}" ditambahkan.`, 'success');
}

function removeItemFromBA(idx) {
  selectedItems.splice(idx, 1);
  renderSelectedItems();
}

// ── Render selected items table ────────────────────────────────
function renderSelectedItems() {
  const container = document.getElementById('selected-items-table');
  const countEl = document.getElementById('item-count');

  if (countEl) countEl.textContent = selectedItems.length;

  if (!container) return;

  if (selectedItems.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="5" class="table-empty">
          <div class="empty-icon">📦</div>
          <div class="empty-text">Belum ada koleksi dipilih</div>
        </td>
      </tr>`;
    return;
  }

  container.innerHTML = selectedItems.map((item, i) => `
    <tr>
      <td><code style="font-size:12px">${item.koleksi.no_inventaris}</code></td>
      <td><strong>${item.koleksi.nama_koleksi}</strong></td>
      <td>
        <select class="filter-control" style="min-width:120px;font-size:13px;padding:5px 8px"
          onchange="updateItem(${i},'kondisi',this.value)">
          <option value="Baik" ${item.kondisi==='Baik'?'selected':''}>Baik</option>
          <option value="Rusak Ringan" ${item.kondisi==='Rusak Ringan'?'selected':''}>Rusak Ringan</option>
          <option value="Rusak Berat" ${item.kondisi==='Rusak Berat'?'selected':''}>Rusak Berat</option>
        </select>
      </td>
      <td>
        <input type="text" class="filter-control" value="${item.lokasi_tujuan}"
          placeholder="Lokasi tujuan..."
          style="font-size:13px;padding:5px 8px"
          onchange="updateItem(${i},'lokasi_tujuan',this.value)">
      </td>
      <td>
        <button class="btn btn-sm btn-danger btn-icon" onclick="removeItemFromBA(${i})" title="Hapus">✕</button>
      </td>
    </tr>
  `).join('');
}

function updateItem(idx, field, value) {
  if (selectedItems[idx]) selectedItems[idx][field] = value;
}

// ── Load BA List ───────────────────────────────────────────────
async function loadBeritaAcaraList() {
  const tbody = document.getElementById('tbody-ba-list');
  if (!tbody) return;

  tbody.innerHTML = skeletonRows(5, 5);

  try {
    const res = await API.getBeritaAcara();
    const list = res?.data ?? [];

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="table-empty">
            <div class="empty-icon">📋</div>
            <div class="empty-text">Belum ada Berita Acara</div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = list.map(ba => `
      <tr>
        <td><strong style="font-size:13px">${ba.nomor_surat || '-'}</strong></td>
        <td>${ba.jenis_ba || '-'}</td>
        <td>${formatDate(ba.tanggal_serah_terima)}</td>
        <td>${ba.pihak1?.nama || '-'}</td>
        <td>
          <div class="action-group">
            <button class="btn btn-sm btn-ghost" onclick="openDetailModal('${ba.id}')" title="Lihat detail">👁️</button>
            <button class="btn btn-sm btn-secondary" onclick="downloadPDF('${ba.id}','${ba.nomor_surat}')" title="Download PDF">⬇️</button>
          </div>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty"><div class="empty-text text-danger">Gagal memuat data</div></td></tr>`;
  }
}

// ── Detail Modal ───────────────────────────────────────────────
async function openDetailModal(id) {
  // Remove existing
  document.getElementById('modal-detail-ba')?.remove();

  const modal = document.createElement('div');
  modal.id = 'modal-detail-ba';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width:700px">
      <div class="modal-header">
        <h3 class="modal-title">📋 Detail Berita Acara</h3>
        <button class="modal-close" onclick="document.getElementById('modal-detail-ba').remove()">✕</button>
      </div>
      <div class="modal-body" id="modal-detail-content">
        <div class="skeleton skeleton-text w-100" style="height:120px;margin-bottom:16px"></div>
        <div class="skeleton skeleton-text w-75"></div>
        <div class="skeleton skeleton-text w-50"></div>
      </div>
      <div class="modal-footer" id="modal-detail-footer">
        <button class="btn btn-ghost" onclick="document.getElementById('modal-detail-ba').remove()">Tutup</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('active'));

  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  try {
    const res = await API.getBeritaAcaraById(id);
    const ba = res?.data;
    if (!ba) throw new Error('Data tidak ditemukan.');

    document.getElementById('modal-detail-content').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
        <div>
          <p class="text-sm text-muted">Nomor Surat</p>
          <p class="fw-700">${ba.nomor_surat}</p>
        </div>
        <div>
          <p class="text-sm text-muted">Jenis BA</p>
          <p class="fw-700">${ba.jenis_ba}</p>
        </div>
        <div>
          <p class="text-sm text-muted">Tanggal Serah Terima</p>
          <p class="fw-700">${formatDate(ba.tanggal_serah_terima)}</p>
        </div>
        <div>
          <p class="text-sm text-muted">Dibuat</p>
          <p class="fw-700">${formatDate(ba.created_at)}</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
        <div style="background:#f8fafc;padding:12px;border-radius:8px">
          <p class="text-sm text-muted" style="margin-bottom:4px">Pihak Pertama</p>
          <p class="fw-700">${ba.pihak1?.nama || '-'}</p>
          <p class="text-sm text-muted">${ba.pihak1?.jabatan || ''}</p>
        </div>
        <div style="background:#f8fafc;padding:12px;border-radius:8px">
          <p class="text-sm text-muted" style="margin-bottom:4px">Pihak Kedua</p>
          <p class="fw-700">${ba.pihak2?.nama || '-'}</p>
          <p class="text-sm text-muted">${ba.pihak2?.jabatan || ''}</p>
        </div>
      </div>

      <div style="margin-bottom:16px">
        <p class="fw-700" style="margin-bottom:10px">Daftar Koleksi (${ba.items?.length || 0} item)</p>
        <div class="table-wrapper" style="border:1px solid var(--abu-border);border-radius:8px">
          <table class="table" style="font-size:13px">
            <thead><tr>
              <th>No. Inventaris</th>
              <th>Nama Koleksi</th>
              <th>Jenis</th>
              <th>Kondisi</th>
              <th>Lokasi Tujuan</th>
            </tr></thead>
            <tbody>
              ${(ba.items || []).map(item => `
                <tr>
                  <td>${item.koleksi?.no_inventaris || '-'}</td>
                  <td><strong>${item.koleksi?.nama_koleksi || '-'}</strong></td>
                  <td>${item.koleksi?.jenis_koleksi || '-'}</td>
                  <td>${getBadgeKondisi(item.kondisi_saat_transaksi)}</td>
                  <td>${item.lokasi_tujuan || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('modal-detail-footer').innerHTML = `
      <button class="btn btn-ghost" onclick="document.getElementById('modal-detail-ba').remove()">Tutup</button>
      <button class="btn btn-primary" onclick="downloadPDF('${ba.id}','${ba.nomor_surat}')">⬇️ Download PDF</button>
    `;

  } catch (err) {
    document.getElementById('modal-detail-content').innerHTML =
      `<div class="alert alert-error">❌ ${err.message}</div>`;
  }
}

// ── Helpers ────────────────────────────────────────────────────
function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function setLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.classList.add('loading');
    btn.dataset.orig = btn.textContent;
    btn.textContent = 'Memproses...';
  } else {
    btn.classList.remove('loading');
    btn.textContent = btn.dataset.orig || 'Cetak PDF';
  }
}

function escapeJs(str) {
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
}