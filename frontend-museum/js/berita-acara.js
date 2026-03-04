/* ============================================================
   Museum Aceh — berita-acara.js  (FIXED)

   PERBAIKAN:
   1. Staff dropdown — error logging eksplisit, handle res.data.data
      vs res.data langsung, diagnosa ke console jika kosong
   2. Multi-select modal — modal TIDAK tutup saat klik "+Tambah",
      ada tombol "Selesai" & counter item terpilih  
   3. Validasi — items tidak wajib saat lampiran nonaktif
   ============================================================ */

requireAuth();

let staffList     = [];
let selectedItems = [];
let lampiranAktif = false;

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  renderUserInfo();
  await Promise.all([loadStaff(), loadBeritaAcaraList()]);
  bindFormEvents();

  if (window.location.hash.startsWith('#detail-')) {
    openDetailModal(window.location.hash.replace('#detail-', ''));
  }
});

// ── Load Staff ─────────────────────────────────────────────────
async function loadStaff() {
  try {
    const res = await API.getStaff({ limit: 1000 });

    // Cek apakah request berhasil
    if (!res) {
      console.error('[Staff] API mengembalikan null — mungkin sesi expired.');
      return;
    }

    if (!res.success) {
      console.error('[Staff] API error:', res.message);
      showToast(`Gagal memuat staff: ${res.message}`, 'error');
      return;
    }

    // Handle dua kemungkinan struktur response:
    // { success, data: { data: [...], meta: {...} } }  ← dari findAllWithFilters
    // { success, data: [...] }                         ← jika controller langsung return array
    if (Array.isArray(res.data)) {
      staffList = res.data;
    } else if (res.data?.data && Array.isArray(res.data.data)) {
      staffList = res.data.data;
    } else {
      staffList = [];
    }

    console.log(`[Staff] Berhasil memuat ${staffList.length} staff.`);

    if (staffList.length === 0) {
      showToast(
        '⚠️ Tidak ada data staff. Tambahkan data staff via Supabase atau endpoint /api/staff.',
        'warning'
      );
    }

    populateStaffDropdowns();

  } catch (err) {
    console.error('[Staff] Exception:', err);
    showToast('Error memuat staff: ' + err.message, 'error');
  }
}

function populateStaffDropdowns() {
  const pihakOpts =
    '<option value="">— Pilih Staff —</option>' +
    staffList.map((s) => `<option value="${s.id}">${s.nama} — ${s.jabatan}</option>`).join('');

  const saksiOpts =
    '<option value="">— Pilih Saksi (Opsional) —</option>' +
    staffList.map((s) => `<option value="${s.id}">${s.nama} — ${s.jabatan}</option>`).join('');

  ['pihak_pertama_id', 'pihak_kedua_id'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = pihakOpts;
  });

  ['saksi1_id', 'saksi2_id'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = saksiOpts;
  });
}

// ── Bind Events ────────────────────────────────────────────────
function bindFormEvents() {
  const form = document.getElementById('form-ba');
  if (!form) return;

  form.addEventListener('submit', async (e) => { e.preventDefault(); await submitBA(); });

  const lampSwitch = document.getElementById('toggle-lampiran');
  if (lampSwitch) {
    lampSwitch.addEventListener('change', () => {
      lampiranAktif = lampSwitch.checked;
      const section = document.getElementById('lampiran-section');
      if (section) section.style.display = lampiranAktif ? 'block' : 'none';
      if (!lampiranAktif) { selectedItems = []; renderSelectedItems(); }
    });
  }

  document.getElementById('btn-tambah-koleksi')?.addEventListener('click', openKoleksiModal);
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
    items: selectedItems.map((item) => ({
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
      const ba = res.data;
      if (ba?.id) {
        setTimeout(() => {
          if (confirm('Berita Acara berhasil dibuat. Download PDF sekarang?')) {
            downloadPDF(ba.id, payload.nomor_surat);
          }
        }, 500);
      }
      document.getElementById('form-ba').reset();
      selectedItems = [];
      lampiranAktif = false;
      document.getElementById('lampiran-section').style.display = 'none';
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

// ── Validate ───────────────────────────────────────────────────
function validateBA() {
  const required = [
    { id: 'nomor_surat',          label: 'Nomor Surat' },
    { id: 'jenis_ba',             label: 'Jenis BA' },
    { id: 'tanggal_serah_terima', label: 'Tanggal' },
    { id: 'pihak_pertama_id',     label: 'Pihak Pertama' },
    { id: 'pihak_kedua_id',       label: 'Pihak Kedua' },
  ];
  let valid = true;
  required.forEach(({ id, label }) => {
    const el = document.getElementById(id);
    if (!getValue(id)) { if (el) el.classList.add('is-invalid'); valid = false; }
    else               { if (el) el.classList.remove('is-invalid'); }
  });
  if (!valid) { showToast('Harap isi semua field yang wajib diisi.', 'warning'); return false; }

  // Items hanya wajib jika lampiran diaktifkan
  if (lampiranAktif && selectedItems.length === 0) {
    showToast('Lampiran aktif — minimal harus ada 1 koleksi dipilih.', 'warning');
    return false;
  }
  return true;
}

// ── Modal Cari Koleksi — MULTI-SELECT ─────────────────────────
//
//  PERUBAHAN UTAMA:
//  - Modal TIDAK menutup saat item diklik "+Tambah"
//  - Tombol berubah jadi "✓ Dipilih" (hijau) setelah diklik
//  - Counter "N terpilih" tampil di header modal
//  - Tombol "Selesai" di bawah untuk menutup modal
//  - User bisa search lagi dan tambah item lain tanpa modal tutup
//
function openKoleksiModal() {
  document.getElementById('modal-koleksi-picker')?.remove();

  const modal = document.createElement('div');
  modal.id    = 'modal-koleksi-picker';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width:660px;display:flex;flex-direction:column;max-height:90vh">

      <!-- Header -->
      <div class="modal-header" style="flex-shrink:0">
        <div style="display:flex;align-items:center;gap:10px">
          <h3 class="modal-title">🏺 Cari Koleksi</h3>
          <span id="picker-count-badge"
            class="item-count-badge"
            style="display:none;background:var(--hijau-sukses)"
          >0 dipilih</span>
        </div>
        <button class="modal-close" onclick="closeKoleksiModal()">✕</button>
      </div>

      <!-- Search -->
      <div style="padding:16px 24px 0;flex-shrink:0">
        <div class="input-wrapper" style="margin-bottom:6px">
          <span class="input-icon">🔍</span>
          <input
            type="text"
            id="search-koleksi-picker"
            class="form-control"
            placeholder="Cari nama koleksi atau no. inventaris..."
            style="padding-left:36px"
            autocomplete="off"
          >
        </div>
        <p class="text-muted text-sm" style="padding-bottom:10px">
          💡 Bisa cari berdasarkan nama <strong>atau</strong> nomor inventaris.
          Klik <strong>+ Tambah</strong> pada beberapa item — modal tidak akan menutup.
        </p>
      </div>

      <!-- Results (scrollable) -->
      <div id="picker-results"
        style="flex:1;overflow-y:auto;padding:0 24px;min-height:200px;max-height:50vh">
        <p class="text-muted text-sm text-center" style="padding:32px">
          Ketik di atas untuk mencari koleksi...
        </p>
      </div>

      <!-- Footer — tombol Selesai -->
      <div style="padding:14px 24px;border-top:1px solid var(--abu-border);flex-shrink:0;
                  display:flex;align-items:center;justify-content:space-between;
                  background:#f8fafc;border-radius:0 0 12px 12px">
        <span id="picker-footer-info" class="text-muted text-sm">
          Belum ada koleksi dipilih
        </span>
        <button
          class="btn btn-primary btn-sm"
          onclick="closeKoleksiModal()"
          id="btn-selesai-picker"
        >
          ✓ Selesai
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('active'));

  // Tutup jika klik overlay
  modal.addEventListener('click', (e) => { if (e.target === modal) closeKoleksiModal(); });

  const searchInput = document.getElementById('search-koleksi-picker');
  if (searchInput) {
    searchInput.focus();
    searchInput.addEventListener('input', debounce(async () => {
      const q = searchInput.value.trim();
      if (!q) {
        document.getElementById('picker-results').innerHTML =
          `<p class="text-muted text-sm text-center" style="padding:32px">Ketik nama atau nomor inventaris...</p>`;
        return;
      }
      await searchKoleksiForPicker(q);
    }, 350));
  }

  updatePickerFooter();
}

function closeKoleksiModal() {
  document.getElementById('modal-koleksi-picker')?.remove();
}

// Update badge & footer text di modal
function updatePickerFooter() {
  const badge    = document.getElementById('picker-count-badge');
  const footerEl = document.getElementById('picker-footer-info');
  const count    = selectedItems.length;

  if (badge) {
    if (count > 0) {
      badge.textContent = `${count} dipilih`;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }

  if (footerEl) {
    footerEl.textContent = count > 0
      ? `${count} koleksi dipilih — klik Selesai untuk menutup`
      : 'Belum ada koleksi dipilih';
  }

  // Update tombol Selesai
  const btnSelesai = document.getElementById('btn-selesai-picker');
  if (btnSelesai) {
    btnSelesai.textContent = count > 0 ? `✓ Selesai (${count} dipilih)` : '✓ Selesai';
  }
}

async function searchKoleksiForPicker(q) {
  const container = document.getElementById('picker-results');
  if (!container) return;

  container.innerHTML = `<p class="text-muted text-sm text-center" style="padding:24px">🔍 Mencari...</p>`;

  try {
    const res  = await API.getKoleksi({ q, limit: 30 });
    const list = res?.data?.data ?? [];

    if (list.length === 0) {
      container.innerHTML = `
        <p class="text-muted text-sm text-center" style="padding:24px">
          Koleksi tidak ditemukan untuk "<strong>${escapeJs(q)}</strong>"
        </p>`;
      return;
    }

    container.innerHTML = list.map((k) => renderPickerItem(k)).join('');
    attachPickerHoverEffects(container);

  } catch (err) {
    container.innerHTML =
      `<p class="text-danger text-sm text-center" style="padding:24px">❌ ${err.message}</p>`;
  }
}

// Render satu baris item di picker
function renderPickerItem(k) {
  const alreadyAdded = selectedItems.some((i) => i.koleksi.id === k.id);
  return `
    <div
      id="picker-item-${k.id}"
      style="padding:10px 12px;border-bottom:1px solid var(--abu-border);
             display:flex;align-items:center;justify-content:space-between;gap:12px;
             transition:background 0.15s;border-radius:4px"
    >
      <!-- Info koleksi -->
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:14px;
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${k.nama_koleksi}
        </div>
        <div style="font-size:12px;color:var(--teks-sekunder);margin-top:2px">
          📋 <code>${k.no_inventaris}</code> &nbsp;·&nbsp; ${k.jenis_koleksi || '-'}
        </div>
      </div>

      <!-- Badge kondisi + tombol -->
      <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
        ${getBadgeKondisi(k.kondisi_terkini)}
        ${alreadyAdded
          ? `<span style="font-size:12px;color:var(--hijau-sukses);font-weight:700;
                          background:#dcfce7;padding:3px 10px;border-radius:99px;
                          white-space:nowrap">
               ✓ Dipilih
             </span>`
          : `<button
               class="btn btn-sm btn-secondary"
               style="white-space:nowrap;font-size:12px;padding:4px 12px"
               onclick="addKoleksiToBA(
                 '${k.id}',
                 '${escapeJs(k.no_inventaris)}',
                 '${escapeJs(k.nama_koleksi)}',
                 '${escapeJs(k.jenis_koleksi || '')}',
                 '${k.kondisi_terkini || 'Baik'}'
               )"
             >
               + Tambah
             </button>`
        }
      </div>
    </div>
  `;
}

function attachPickerHoverEffects(container) {
  container.querySelectorAll('[id^="picker-item-"]').forEach((el) => {
    el.addEventListener('mouseenter', () => el.style.background = '#FEF2F2');
    el.addEventListener('mouseleave', () => el.style.background = '');
  });
}

// FIXED: Modal TIDAK menutup — hanya update UI item & counter
function addKoleksiToBA(id, noInv, nama, jenis, kondisi) {
  if (selectedItems.find((i) => i.koleksi.id === id)) {
    showToast('Koleksi sudah ada dalam daftar.', 'warning');
    return;
  }

  selectedItems.push({
    koleksi: { id, no_inventaris: noInv, nama_koleksi: nama, jenis_koleksi: jenis },
    kondisi,
    lokasi_tujuan: '',
    keterangan:    '',
  });

  // Ubah tombol item yang baru saja dipilih menjadi "✓ Dipilih"
  const itemEl = document.getElementById(`picker-item-${id}`);
  if (itemEl) {
    const btn = itemEl.querySelector('button');
    if (btn) {
      btn.outerHTML = `
        <span style="font-size:12px;color:var(--hijau-sukses);font-weight:700;
                     background:#dcfce7;padding:3px 10px;border-radius:99px;
                     white-space:nowrap">
          ✓ Dipilih
        </span>
      `;
    }
  }

  // Update counter badge & footer
  updatePickerFooter();

  // Update badge di luar modal (form)
  renderSelectedItems();

  // Tampilkan toast ringkas tanpa mengganggu alur
  showToast(`✅ "${nama}" ditambahkan`, 'success');
}

function removeItemFromBA(idx) {
  selectedItems.splice(idx, 1);
  renderSelectedItems();
}

// ── Render tabel koleksi terpilih di form ──────────────────────
function renderSelectedItems() {
  const container = document.getElementById('selected-items-table');
  const countEl   = document.getElementById('item-count');
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
          <option value="Baik"         ${item.kondisi === 'Baik'         ? 'selected' : ''}>Baik</option>
          <option value="Rusak Ringan" ${item.kondisi === 'Rusak Ringan' ? 'selected' : ''}>Rusak Ringan</option>
          <option value="Rusak Berat"  ${item.kondisi === 'Rusak Berat'  ? 'selected' : ''}>Rusak Berat</option>
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

// ── Load list BA tersimpan ─────────────────────────────────────
async function loadBeritaAcaraList() {
  const tbody = document.getElementById('tbody-ba-list');
  if (!tbody) return;

  tbody.innerHTML = skeletonRows(5, 5);

  try {
    const res  = await API.getBeritaAcara();
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

    tbody.innerHTML = list.map((ba) => `
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
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">
      <div class="empty-text text-danger">Gagal memuat data</div></td></tr>`;
  }
}

// ── Detail Modal ───────────────────────────────────────────────
async function openDetailModal(id) {
  document.getElementById('modal-detail-ba')?.remove();

  const modal = document.createElement('div');
  modal.id    = 'modal-detail-ba';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width:700px">
      <div class="modal-header">
        <h3 class="modal-title">📋 Detail Berita Acara</h3>
        <button class="modal-close" onclick="document.getElementById('modal-detail-ba').remove()">✕</button>
      </div>
      <div class="modal-body" id="modal-detail-content">
        <div class="skeleton skeleton-text w-100" style="height:100px;margin-bottom:16px"></div>
        <div class="skeleton skeleton-text w-75"></div>
      </div>
      <div class="modal-footer" id="modal-detail-footer">
        <button class="btn btn-ghost" onclick="document.getElementById('modal-detail-ba').remove()">Tutup</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('active'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  try {
    const res = await API.getBeritaAcaraById(id);
    const ba  = res?.data;
    if (!ba) throw new Error('Data tidak ditemukan.');

    document.getElementById('modal-detail-content').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
        <div><p class="text-sm text-muted">Nomor Surat</p><p class="fw-700">${ba.nomor_surat}</p></div>
        <div><p class="text-sm text-muted">Jenis BA</p><p class="fw-700">${ba.jenis_ba}</p></div>
        <div><p class="text-sm text-muted">Tanggal Serah Terima</p><p class="fw-700">${formatDate(ba.tanggal_serah_terima)}</p></div>
        <div><p class="text-sm text-muted">Dibuat</p><p class="fw-700">${formatDate(ba.created_at)}</p></div>
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
      <p class="fw-700" style="margin-bottom:10px">Daftar Koleksi (${ba.items?.length || 0} item)</p>
      <div class="table-wrapper" style="border:1px solid var(--abu-border);border-radius:8px">
        <table class="table" style="font-size:13px">
          <thead><tr>
            <th>No. Inventaris</th><th>Nama Koleksi</th>
            <th>Jenis</th><th>Kondisi</th><th>Lokasi Tujuan</th>
          </tr></thead>
          <tbody>
            ${(ba.items || []).map((item) => `
              <tr>
                <td><code>${item.koleksi?.no_inventaris || '-'}</code></td>
                <td><strong>${item.koleksi?.nama_koleksi || '-'}</strong></td>
                <td>${item.koleksi?.jenis_koleksi || '-'}</td>
                <td>${getBadgeKondisi(item.kondisi_saat_transaksi)}</td>
                <td>${item.lokasi_tujuan || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
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
    btn.textContent  = 'Memproses...';
  } else {
    btn.classList.remove('loading');
    btn.textContent = btn.dataset.orig || 'Cetak PDF';
  }
}

function escapeJs(str) {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '');
}