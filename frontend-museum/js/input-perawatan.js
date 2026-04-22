requireAuth();

// ── Checkbox options ───────────────────────────────────────────
const OPT_MATERIAL   = ['Batu','Kayu','Logam','Tekstil','Kulit','Rotan','Kertas','Keramik', 'Lainnya'];
const OPT_KONDISI    = ['Polutan/debu','Jamur','Lembab','Lapuk','Mengelupas','Berubah Warna','Tergores','Berlubang','Sompel','Robek','Noda Kotoran','Bekas Perbaikan','Pecah','Retak','Patah','Karatan'];
const OPT_FAKTOR     = ['Cahaya','Debu','Suhu','Kelembaban','Bencana','Serangga/hama','Disosiasi','Vandalisme/Tekanan'];
const OPT_ALAT       = ['Kuas','Pinset','Spatula','Scraple','Sikat gigi','Sikat Plastik','Beaker Glass','Pipet Tetes','Jarum Pentul','Jarum Jahit','Jarum Suntik','Gunting','Spons','Selang Air','Ember','Alat Penumbuk','Oven','Timbangan','Vacum Cleaner','Wadah Stanliesh'];
const OPT_BAHAN      = ['Typol','Citrit Acid','Aquades','Alkohol','Parafin','Naftalena','Kain/serbet','Kain Kasa','Benang','Karet Penghapus','Sabun cuci','Sabun Antiseptik','Lem','Tali','Kapas'];
const OPT_PEMBUNGKUS = ['Amplop','Box File','Busa Lapis','Busa Polyfoam','Kertas Bebas asam','Kain kerah (staplek)','Kain Belacu','Kertas Wrab'];
const OPT_PENGAWET   = ['Cengkeh','Lada hitam','Tembakau','Silica-gel','Kapur Barus'];

const OPT_KLASIFIKASI = [
  { val: '01', label: '01 GEOLOGIKA' },
  { val: '02', label: '02 BIOLOGIKA' },
  { val: '03', label: '03 ETNOGRAFIKA' },
  { val: '04', label: '04 ARKEOLOGIKA' },
  { val: '05', label: '05 HISTORIKA' },
  { val: '06', label: '06 NUMISMATIKA' },
  { val: '07', label: '07 FILOLOGIKA' },
  { val: '08', label: '08 KERAMOLOGIKA' },
  { val: '09', label: '09 SENI RUPA' },
  { val: '10', label: '10 TEKNOLOGIKA' }
];

let selectedKoleksiId = null;
let selectedItems = [];
let currentMode = 'individu';
let availableBaCache = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderUserInfo();
  renderCheckboxGrid('cb-material', 'material_bahan', OPT_MATERIAL);
  renderCheckboxGrid('cb-kondisi', 'kondisi_koleksi', OPT_KONDISI);
  renderCheckboxGrid('cb-faktor', 'faktor_kerusakan', OPT_FAKTOR);
  renderCheckboxGrid('cb-alat', 'alat_digunakan', OPT_ALAT);
  renderCheckboxGrid('cb-bahan', 'bahan_digunakan', OPT_BAHAN);
  renderCheckboxGrid('cb-pembungkus', 'bahan_pembungkus', OPT_PEMBUNGKUS);
  renderCheckboxGrid('cb-pengawet', 'bahan_pengawet', OPT_PENGAWET);
  renderCheckboxGridObj('cb-klasifikasi', 'klasifikasi_koleksi', OPT_KLASIFIKASI);

  await loadStaff();
  initModeToggle();
  
  document.getElementById('btn-tambah-koleksi')?.addEventListener('click', openKoleksiModal);
  
  await loadAvailableBa();
  
  document.getElementById('ba_id').addEventListener('change', handleBaSelect);
  document.getElementById('form-perawatan')?.addEventListener('submit', e => { e.preventDefault(); submitForm(); });
});

function renderCheckboxGrid(containerId, name, options) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = options.filter(o => o !== 'Lainnya').map(o => `<label><input type="checkbox" name="${name}" value="${o}"> ${o}</label>`).join('');
}
function renderCheckboxGridObj(containerId, name, options) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = options.map(o => `<label><input type="checkbox" name="${name}" value="${o.val}"> ${o.label}</label>`).join('');
}

// ── Toggle Mode ───────────────────────────────────────────────
function initModeToggle() {
  const radios = document.querySelectorAll('input[name="form_mode"]');
  radios.forEach(r => r.addEventListener('change', (e) => {
    currentMode = e.target.value;
    if (currentMode === 'individu') {
      document.getElementById('section-individu').style.display = 'block';
      document.getElementById('section-lampiran').style.display = 'none';
      document.getElementById('ba_id').value = '';
      updateGlobalJenisAndKlasifikasi();
    } else {
      document.getElementById('section-individu').style.display = 'none';
      document.getElementById('section-lampiran').style.display = 'block';
      document.getElementById('fill-jenis').value = '';
      document.getElementById('fill-jumlah').value = '';
      clearKlasifikasi();
    }
  }));
}

// ── Mapping Klasifikasi ────────────────────────────────────────
function autoCheckKlasifikasi(jenisTeks) {
  if (!jenisTeks) return;
  const t = jenisTeks.toLowerCase();
  let code = null;
  if(t.includes('batu') || t.includes('fosil')) code = '01';
  else if(t.includes('biolo') || t.includes('tengkorak') || t.includes('kayu')) code = '02';
  else if(t.includes('etno') || t.includes('pakaian') || t.includes('senjata')) code = '03';
  else if(t.includes('arkeo') || t.includes('arca')) code = '04';
  else if(t.includes('histo') || t.includes('sejarah') || t.includes('tokoh')) code = '05';
  else if(t.includes('uang') || t.includes('koin') || t.includes('numis')) code = '06';
  else if(t.includes('naskah') || t.includes('buku') || t.includes('kertas') || t.includes('filo')) code = '07';
  else if(t.includes('keramik') || t.includes('kaca') || t.includes('gerabah') || t.includes('tanah liat')) code = '08';
  else if(t.includes('lukisan') || t.includes('seni') || t.includes('patung')) code = '09';
  else if(t.includes('tekno') || t.includes('mesin') || t.includes('alat')) code = '10';
  
  if(code) {
    const cb = document.querySelector(`input[name="klasifikasi_koleksi"][value="${code}"]`);
    if(cb) cb.checked = true;
  }
}
function clearKlasifikasi() {
  document.querySelectorAll('input[name="klasifikasi_koleksi"]').forEach(c => c.checked = false);
}

// ── BA Dropdown & API ──────────────────────────────────────────
async function loadAvailableBa() {
  try {
    const res = await API.get('/api/perawatan/ba-available');
    availableBaCache = res.data || [];
    const sel = document.getElementById('ba_id');
    if(!sel) return;
    sel.innerHTML = '<option value="">— Pilih BA —</option>' + availableBaCache.map(b => `<option value="${b.id}">${b.nomor_surat} (${b.jenis_ba})</option>`).join('');
  } catch (err) {
    console.error('Failed to load BA:', err);
  }
}

async function handleBaSelect(e) {
  const baId = e.target.value;
  clearKlasifikasi();
  document.getElementById('fill-jenis').value = '';
  document.getElementById('fill-jumlah').value = '';
  if(!baId) return;

  try {
    const res = await API.getDetailBa(baId);
    if(res?.data) {
      const items = res.data.items || [];
      document.getElementById('fill-jumlah').value = items.length + ' Item';
      
      const allJenis = new Set();
      items.forEach(it => {
        if(it.koleksi?.jenis_koleksi) {
          allJenis.add(it.koleksi.jenis_koleksi);
          autoCheckKlasifikasi(it.koleksi.jenis_koleksi);
        }
      });
      document.getElementById('fill-jenis').value = Array.from(allJenis).join(', ');
    }
  } catch(err) {
    showToast('Gagal memuat detail BA', 'error');
  }
}

async function loadStaff() {
  try {
    const res = await API.getStaff({ limit: 1000 });
    const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : [];
    const sel = document.getElementById('petugas_id');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Pilih Staff Konservasi —</option>' + list.map(s => `<option value="${s.nama}">${s.nama} — ${s.jabatan}</option>`).join('');
  } catch (err) {
    showToast('Gagal memuat staff: ' + err.message, 'error');
  }
}

// ── Modal Cari Koleksi (Multi-picker) ──────────────────────────
function openKoleksiModal() {
  document.getElementById('modal-koleksi-picker')?.remove();
  const modal = document.createElement('div');
  modal.id = 'modal-koleksi-picker';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width:660px;display:flex;flex-direction:column;max-height:90vh">
      <div class="modal-header" style="flex-shrink:0">
        <div style="display:flex;align-items:center;gap:10px">
          <h3 class="modal-title">Cari Koleksi</h3>
          <span id="picker-count-badge" class="item-count-badge" style="display:none;background:var(--hijau-sukses)">0 dipilih</span>
        </div>
        <button type="button" class="modal-close" onclick="closeKoleksiModal()">✕</button>
      </div>
      <div style="padding:14px 24px 0;flex-shrink:0">
        <div class="input-wrapper" style="margin-bottom:6px">
          <span class="input-icon" style="font-style:normal;font-size:11px;">Cari</span>
          <input type="text" id="search-koleksi-picker" class="form-control"
            placeholder="Cari nama koleksi atau no. inventaris..." style="padding-left:36px" autocomplete="off">
        </div>
        <p class="text-muted text-sm" style="padding-bottom:8px">
          Klik <strong>+ Tambah</strong> — modal tidak menutup sampai klik Selesai.
        </p>
      </div>
      <div id="picker-results" style="flex:1;overflow-y:auto;padding:0 24px;min-height:180px;max-height:50vh">
        <p class="text-muted text-sm text-center" style="padding:28px">Ketik untuk mencari koleksi...</p>
      </div>
      <div style="padding:12px 24px;border-top:1px solid var(--abu-border);flex-shrink:0;
                  display:flex;align-items:center;justify-content:space-between;background:#f8fafc;border-radius:0 0 12px 12px">
        <span id="picker-footer-info" class="text-muted text-sm">Belum ada koleksi dipilih</span>
        <button type="button" class="btn btn-primary btn-sm" onclick="closeKoleksiModal()" id="btn-selesai-picker">✓ Selesai</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('active'));
  modal.addEventListener('click', e => { if (e.target === modal) closeKoleksiModal(); });
  
  const inp = document.getElementById('search-koleksi-picker');
  inp?.focus();
  inp?.addEventListener('input', debounce(async () => {
    const q = inp.value.trim();
    if (!q) {
      document.getElementById('picker-results').innerHTML =
        `<p class="text-muted text-sm text-center" style="padding:28px">Ketik nama atau nomor inventaris...</p>`;
      return;
    }
    await searchKoleksiForPicker(q);
  }, 350));
  updatePickerFooter();
}

function closeKoleksiModal() {
  document.getElementById('modal-koleksi-picker')?.remove();
}

function updatePickerFooter() {
  const c = selectedItems.length;
  const badge = document.getElementById('picker-count-badge');
  if (badge) { badge.textContent = `${c} dipilih`; badge.style.display = c > 0 ? 'inline-flex' : 'none'; }
  const footer = document.getElementById('picker-footer-info');
  if (footer) footer.textContent = c > 0 ? `${c} koleksi dipilih` : 'Belum ada koleksi dipilih';
  const btn = document.getElementById('btn-selesai-picker');
  if (btn) btn.textContent = c > 0 ? `✓ Selesai (${c})` : '✓ Selesai';
}

async function searchKoleksiForPicker(q) {
  const container = document.getElementById('picker-results');
  if (!container) return;
  container.innerHTML = `<p class="text-muted text-sm text-center" style="padding:20px">Mencari...</p>`;
  try {
    const res  = await API.getKoleksi({ q, limit: 30 });
    const list = res?.data?.data ?? [];
    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:28px">
          <p class="text-muted text-sm" style="margin-bottom:10px">Tidak ditemukan untuk "<strong>${escapeJs(q)}</strong>"</p>
        </div>`;
      return;
    }
    container.innerHTML = list.map(k => renderPickerItem(k)).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-danger text-sm text-center" style="padding:20px">${err.message}</p>`;
  }
}

function renderPickerItem(k) {
  const added = selectedItems.some(i => i.koleksi.id === k.id);
  const getBadgeKondisi = (knd) => {
    if (!knd || knd === 'Baik') return `<span style="font-size:11px;color:#16a34a;border:1px solid #bbf7d0;background:#f0fdf4;padding:2px 6px;border-radius:4px">Baik</span>`;
    if (knd.toLowerCase().includes('rusak berat')) return `<span style="font-size:11px;color:#dc2626;border:1px solid #fecaca;background:#fef2f2;padding:2px 6px;border-radius:4px">Rusak Berat</span>`;
    return `<span style="font-size:11px;color:#d97706;border:1px solid #fde68a;background:#fffbeb;padding:2px 6px;border-radius:4px">${knd}</span>`;
  };

  return `
    <div id="picker-item-${k.id}" style="padding:9px 10px;border-bottom:1px solid var(--abu-border);
         display:flex;align-items:center;justify-content:space-between;gap:10px;border-radius:4px">
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${k.nama_koleksi}</div>
        <div style="font-size:11px;color:var(--teks-sekunder);margin-top:1px"><code>${k.no_inventaris}</code> · ${k.jenis_koleksi||'-'}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
        ${getBadgeKondisi(k.kondisi_terkini)}
        ${added
          ? `<span style="font-size:11px;color:var(--hijau-sukses);font-weight:700;background:#dcfce7;padding:2px 8px;border-radius:99px">✓ Dipilih</span>`
          : `<button type="button" class="btn btn-sm btn-secondary" style="font-size:12px;padding:3px 10px"
               onclick="addKoleksiToPerawatan('${k.id}','${escapeJs(k.no_inventaris)}','${escapeJs(k.nama_koleksi)}','${escapeJs(k.jenis_koleksi||'')}','${k.kondisi_terkini||'Baik'}')">
               + Tambah
             </button>`}
      </div>
    </div>`;
}

function addKoleksiToPerawatan(id, noInv, nama, jenis, kondisi) {
  if (selectedItems.find(i => i.koleksi.id === id)) { showToast('Sudah ada dalam daftar.', 'warning'); return; }
  selectedItems.push({
    koleksi: { id, no_inventaris: noInv, nama_koleksi: nama, jenis_koleksi: jenis },
    kondisi_kategori: kondisi === 'Baik' ? 'Baik' : kondisi,
    kondisi_detail: '',
  });
  
  const itemEl = document.getElementById(`picker-item-${id}`);
  if (itemEl) {
    const btn = itemEl.querySelector('button');
    if (btn) btn.outerHTML = `<span style="font-size:11px;color:var(--hijau-sukses);font-weight:700;background:#dcfce7;padding:2px 8px;border-radius:99px">✓ Dipilih</span>`;
  }
  
  updatePickerFooter();
  renderSelectedItems();
  updateGlobalJenisAndKlasifikasi();
  showToast(`"${nama}" ditambahkan`, 'success');
}

function renderSelectedItems() {
  const container = document.getElementById('selected-items-list');
  if (!container) return;

  if (selectedItems.length === 0) {
    container.innerHTML = `<div class="empty-items" style="text-align: center; padding: 20px 10px; color: var(--teks-sekunder); font-size: 13px;">Belum ada koleksi dipilih</div>`;
    return;
  }

  const escapeHtmlAttr = (s) => (s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  container.innerHTML = selectedItems.map((item, i) => `
    <div class="item-row-grid">
      <div>
        <div class="item-nama">${item.koleksi.nama_koleksi}</div>
        <div class="item-inv">${item.koleksi.no_inventaris} · ${item.koleksi.jenis_koleksi || '-'}</div>
        <div class="kondisi-split">
          <select class="filter-control" style="font-size:12px;padding:4px 6px"
            onchange="updateKondisiKategori(${i}, this.value)">
            <option value="Baik"         ${item.kondisi_kategori==='Baik'         ?'selected':''}>Baik</option>
            <option value="Rusak Ringan" ${item.kondisi_kategori==='Rusak Ringan' ?'selected':''}>Rusak Ringan</option>
            <option value="Rusak Berat"  ${item.kondisi_kategori==='Rusak Berat'  ?'selected':''}>Rusak Berat</option>
          </select>
          <input type="text" id="kondisi-detail-${i}"
            class="kondisi-detail-input ${item.kondisi_kategori !== 'Baik' ? 'visible' : ''}"
            placeholder="Contoh: patah bagian pegangan..."
            value="${escapeHtmlAttr(item.kondisi_detail)}"
            oninput="updateKondisiDetail(${i}, this.value)">
        </div>
      </div>
      <button type="button" class="btn-hapus-item" onclick="removeItem(${i})" title="Hapus">✕</button>
    </div>`).join('');
}

function updateKondisiKategori(idx, val) {
  if (!selectedItems[idx]) return;
  selectedItems[idx].kondisi_kategori = val;
  const el = document.getElementById(`kondisi-detail-${idx}`);
  if (el) {
    if (val !== 'Baik') { el.classList.add('visible'); }
    else { el.classList.remove('visible'); el.value = ''; selectedItems[idx].kondisi_detail = ''; }
  }
}

function updateKondisiDetail(idx, val) {
  if (selectedItems[idx]) selectedItems[idx].kondisi_detail = val;
}

function removeItem(idx) {
  selectedItems.splice(idx, 1);
  renderSelectedItems();
  updateGlobalJenisAndKlasifikasi();
}

function updateGlobalJenisAndKlasifikasi() {
  clearKlasifikasi();
  document.getElementById('fill-jenis').value = '';
  document.getElementById('fill-jumlah').value = selectedItems.length + ' Item';
  
  if (selectedItems.length === 0) return;
  
  const allJenis = new Set();
  selectedItems.forEach(item => {
    if (item.koleksi.jenis_koleksi) {
      allJenis.add(item.koleksi.jenis_koleksi);
      autoCheckKlasifikasi(item.koleksi.jenis_koleksi);
    }
  });
  
  document.getElementById('fill-jenis').value = Array.from(allJenis).join(', ') || '-';
}

function escapeJs(s) { return (s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\\n/g,' '); }

// ── Collect form data ──────────────────────────────────────────
function collectFormData() {
  const getChecked = name => [...document.querySelectorAll(`[name="${name}"]:checked`)].map(c => c.value);
  const getRadio   = name => { const r = document.querySelector(`[name="${name}"]:checked`); return r ? r.value : null; };

  // Khusus material lainnya (opsional text)
  const matLain = document.getElementById('material_lainnya')?.value?.trim();
  let materialChecked = getChecked('material_bahan');
  if(matLain) materialChecked.push('Lainnya');

  const itemsPayload = selectedItems.map(item => ({
    koleksi_id: item.koleksi.id,
    kondisi: item.kondisi_kategori === 'Baik' ? 'Baik' : item.kondisi_kategori + (item.kondisi_detail ? ' - ' + item.kondisi_detail : '')
  }));

  return {
    kode_perawatan:      document.getElementById('kode_perawatan')?.value?.trim(),
    mode:                currentMode,
    items:               currentMode === 'individu' ? itemsPayload : [],
    ba_id:               currentMode === 'lampiran' ? document.getElementById('ba_id')?.value : null,
    petugas_konservasi:  document.getElementById('petugas_id')?.value,
    tanggal_perawatan:   document.getElementById('tanggal')?.value, // Opsional jika API tidak butuh, tapi physical form butuh
    asal_koleksi:        getRadio('asal_koleksi'),
    jenis_bahan:         getRadio('jenis_bahan'),
    klasifikasi_koleksi: getChecked('klasifikasi_koleksi'),
    material_bahan:      materialChecked,
    material_lainnya:    matLain || null,
    kondisi_koleksi:     getChecked('kondisi_koleksi'),
    faktor_kerusakan:    getChecked('faktor_kerusakan'),
    teknis_penanganan:   getRadio('teknis_penanganan'),
    metode_perawatan:    getRadio('metode_perawatan'),
    metode_bahan:        getRadio('metode_bahan'),
    alat_digunakan:      getChecked('alat_digunakan'),
    bahan_digunakan:     getChecked('bahan_digunakan'),
    bahan_pembungkus:    getChecked('bahan_pembungkus'),
    bahan_pengawet:      getChecked('bahan_pengawet'),
    catatan:             document.getElementById('catatan')?.value?.trim() || null,
  };
}

function validateForm(data) {
  if (!data.kode_perawatan) { showToast('Kode perawatan wajib diisi.', 'warning'); document.getElementById('kode_perawatan').focus(); return false; }
  if (currentMode === 'individu' && (!data.items || data.items.length === 0)) { showToast('Pilih minimal satu koleksi terlebih dahulu.', 'warning'); return false; }
  if (currentMode === 'lampiran' && !data.ba_id) { showToast('Pilih Berita Acara terlebih dahulu.', 'warning'); return false; }
  if (!data.petugas_konservasi) { showToast('Pilih petugas konservasi.', 'warning'); return false; }
  return true;
}

async function submitForm() {
  const data = collectFormData();
  if (!validateForm(data)) return;
  
  const btn = document.getElementById('btn-simpan');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }
  try {
    const res = await API.createPerawatan(data);
    if (res?.success) {
      showToast('Form perawatan berhasil disimpan!', 'success');
      if (res.data?.id && confirm('Download PDF sekarang?')) {
        downloadPerawatanPdf(res.data.id, data.kode_perawatan);
      }
      setTimeout(() => { window.location.href = 'perawatan.html'; }, 1500);
    } else {
      showToast(res?.message || 'Gagal menyimpan form.', 'error');
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Simpan Form'; }
  }
}
