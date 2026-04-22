requireAuth();

document.addEventListener('DOMContentLoaded', async () => {
  renderUserInfo();
  await loadForms();
  
  const tabBtns = document.querySelectorAll('.tab-btn');
  const form = document.getElementById('perawatanForm');
  const modeInput = document.getElementById('currentMode');
  const sectionIndividu = document.getElementById('sectionIndividu');
  const sectionLampiran = document.getElementById('sectionLampiran');

  // 1. Logic Toggling Tab
  tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
          tabBtns.forEach(b => {
              b.classList.remove('active', 'btn-primary');
              b.classList.add('btn-outline-primary');
          });
          e.target.classList.remove('btn-outline-primary');
          e.target.classList.add('active', 'btn-primary');
          
          const mode = e.target.dataset.mode;
          modeInput.value = mode;

          if (mode === 'individu') {
              sectionIndividu.style.display = 'block';
              sectionLampiran.style.display = 'none';
          } else {
              sectionIndividu.style.display = 'none';
              sectionLampiran.style.display = 'block';
          }
          
          resetDynamicFields();
      });
  });

  function resetDynamicFields() {
      document.getElementById('koleksiId').value = '';
      document.getElementById('baId').value = '';
      document.getElementById('searchKoleksi').value = '';
      document.getElementById('searchBa').value = '';
      document.getElementById('jumlahKoleksi').value = '';
      document.querySelectorAll('#perawatanForm input[type="checkbox"]').forEach(c => c.checked = false);
  }

  // 2. Modal Cari Koleksi (Mode Individu)
  const searchKoleksi = document.getElementById('searchKoleksi');
  const noInventarisDisplay = document.getElementById('noInventarisDisplay');

  searchKoleksi.addEventListener('click', () => {
      openKoleksiModal();
  });

  function openKoleksiModal() {
      document.getElementById('modal-koleksi-picker')?.remove();
      const modal = document.createElement('div');
      modal.id = 'modal-koleksi-picker';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal" style="max-width:660px;display:flex;flex-direction:column;max-height:90vh">
          <div class="modal-header" style="flex-shrink:0">
            <h3 class="modal-title">Cari Koleksi</h3>
            <button class="modal-close" onclick="closeKoleksiModal()">✕</button>
          </div>
          <div style="padding:14px 24px 0;flex-shrink:0">
            <div class="input-wrapper" style="margin-bottom:6px">
              <span class="input-icon" style="font-style:normal;font-size:11px;">Cari</span>
              <input type="text" id="search-koleksi-picker" class="form-control"
                placeholder="Cari nama koleksi atau no. inventaris..." style="padding-left:36px" autocomplete="off">
            </div>
            <p class="text-muted text-sm" style="padding-bottom:8px">
              Silakan ketik dan pilih <strong>+ Tambah</strong> untuk memasukkan koleksi ke form.
            </p>
          </div>
          <div id="picker-results" style="flex:1;overflow-y:auto;padding:0 24px;min-height:180px;max-height:50vh">
            <p class="text-muted text-sm text-center" style="padding:28px">Ketik untuk mencari koleksi...</p>
          </div>
          <div style="padding:12px 24px;border-top:1px solid var(--abu-border);flex-shrink:0;
                      display:flex;align-items:center;justify-content:flex-end;background:#f8fafc;border-radius:0 0 12px 12px">
            <button class="btn btn-ghost btn-sm" onclick="closeKoleksiModal()">Batal</button>
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
  }

  window.closeKoleksiModal = function() {
      document.getElementById('modal-koleksi-picker')?.remove();
  }

  async function searchKoleksiForPicker(q) {
      const container = document.getElementById('picker-results');
      if (!container) return;
      container.innerHTML = `<p class="text-muted text-sm text-center" style="padding:20px">Mencari...</p>`;
      try {
        const res  = await API.getKoleksi({ search: q, limit: 30 });
        let list = [];
        if (Array.isArray(res?.data)) list = res.data;
        else if (Array.isArray(res?.data?.data)) list = res.data.data;
        if (list.length === 0) {
          container.innerHTML = `
            <div style="text-align:center;padding:28px">
              <p class="text-muted text-sm">Tidak ditemukan untuk "<strong>${escapeHtml(q)}</strong>"</p>
            </div>`;
          return;
        }
        container.innerHTML = list.map(k => `
            <div style="padding:9px 10px;border-bottom:1px solid var(--abu-border);
                 display:flex;align-items:center;justify-content:space-between;gap:10px;border-radius:4px">
              <div style="flex:1;min-width:0">
                <div style="font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(k.nama_koleksi)}</div>
                <div style="font-size:11px;color:var(--teks-sekunder);margin-top:1px"><code>${escapeHtml(k.no_inventaris)}</code> · ${escapeHtml(k.jenis_koleksi||'-')}</div>
              </div>
              <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                <button class="btn btn-sm btn-primary" style="font-size:12px;padding:3px 10px"
                   onclick="selectKoleksiForForm('${k.id}', '${escapeHtmlAttr(k.nama_koleksi)}', '${escapeHtmlAttr(k.no_inventaris)}', '${escapeHtmlAttr(k.jenis_koleksi||'')}')">
                   + Tambah
                 </button>
              </div>
            </div>
        `).join('');
      } catch (err) {
        container.innerHTML = `<p class="text-danger text-sm text-center" style="padding:20px">${err.message}</p>`;
      }
  }

  window.selectKoleksiForForm = function(id, nama, noInv, jenis) {
      document.getElementById('koleksiId').value = id;
      document.getElementById('searchKoleksi').value = nama;
      if(noInventarisDisplay) {
          noInventarisDisplay.value = noInv;
      }
      
      document.querySelectorAll('input[name="klasifikasi_koleksi"]').forEach(c => c.checked = false);
      if (jenis) {
           const checkbox = document.querySelector(`input[name="klasifikasi_koleksi"][value="${jenis}"]`);
           if(checkbox) checkbox.checked = true;
      }
      
      closeKoleksiModal();
  }

  function debounce(func, delay) {
      let timeout;
      return function(...args) {
          clearTimeout(timeout);
          timeout = setTimeout(() => func(...args), delay);
      };
  }

  // 3. Logic Autocomplete & Fetch Mode Lampiran BA
  const searchBa = document.getElementById('searchBa');
  const autocompleteBa = document.getElementById('autocompleteBa');
  let timeoutId2;
  searchBa.addEventListener('input', (e) => {
      clearTimeout(timeoutId2);
      const query = e.target.value.trim();
      autocompleteBa.innerHTML = '';
      if (query.length < 3) return;
      
      timeoutId2 = setTimeout(async () => {
          try {
              const res = await API.getBeritaAcara({ search: query });
              const data = res?.data || [];
              
              if (data.length > 0) {
                  data.forEach(ba => {
                      const div = document.createElement('div');
                      div.className = 'autocomplete-item';
                      div.style.padding = '8px';
                      div.style.cursor = 'pointer';
                      div.style.borderBottom = '1px solid #eee';
                      div.innerHTML = `<strong>${escapeHtml(ba.nomor_surat)}</strong>`;
                      div.addEventListener('click', () => {
                           document.getElementById('baId').value = ba.id;
                           searchBa.value = ba.nomor_surat;
                           document.getElementById('jumlahKoleksi').value = ba.total_item_koleksi || (ba.items ? ba.items.length : 0);
                           autocompleteBa.innerHTML = '';
                           
                           document.querySelectorAll('input[name="klasifikasi_koleksi"]').forEach(c => c.checked = false);
                           if (ba.jenis_koleksi_array && Array.isArray(ba.jenis_koleksi_array)) {
                               ba.jenis_koleksi_array.forEach(jenis => {
                                   const checkbox = document.querySelector(`input[name="klasifikasi_koleksi"][value="${jenis}"]`);
                                   if(checkbox) checkbox.checked = true;
                               });
                           }
                      });
                      autocompleteBa.appendChild(div);
                  });
              } else {
                  autocompleteBa.innerHTML = '<div style="padding:8px; color:red;">Tidak ditemukan</div>';
              }
          } catch (err) {
              console.error("Gagal mendapatkan Berita Acara:", err);
          }
      }, 500);
  });

  // Utilitas Escape HTML
  function escapeHtml(unsafe) {
      if(!unsafe) return '';
      return String(unsafe).replace(/[&<"'>]/g, function (match) {
          const escape = {
              '&': '&amp;',
              '<': '&lt;',
              '>': '&gt;',
              '"': '&quot;',
              "'": '&#039;'
          };
          return escape[match];
      });
  }

  // Tutup dropdown jika klik diluar
  document.addEventListener('click', (e) => {
      if (e.target !== searchBa) autocompleteBa.innerHTML = '';
  });

  // Helper EscapeHtmlAttr
  window.escapeHtmlAttr = function(unsafe) {
      if(!unsafe) return '';
      return String(unsafe).replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  };

  // 4. Submit State Handler & Object Building
  form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);

      const mode = formData.get('mode');
      const koleksi_id = formData.get('koleksi_id') || null;
      const ba_id = formData.get('ba_id') || null;

      const kode1 = formData.get('kode_perawatan_1') || '';
      const kode2 = formData.get('kode_perawatan_2') || '20';
      const kodePerawatan = `NO.PK ${kode1}/${kode2}`;

      const materialBahan = formData.getAll('material_bahan');
      const materialLain = formData.get('material_bahan_lain');
      if (materialLain && materialLain.trim()) {
          materialBahan.push(`Lainnya: ${materialLain.trim()}`);
      }

      const tanggalPerawatan = new Date().toISOString().split('T')[0];

      const metodeKonservasi = {
          kode_perawatan: kodePerawatan,
          asal_koleksi: formData.get('asal_koleksi'),
          jenis_koleksi: formData.get('jenis_koleksi'),
          metode_perawatan: formData.get('metode_perawatan'),
          metode_bahan: formData.get('metode_bahan'),
          petugas_konservasi: formData.get('petugas_konservasi'),
          pendataan: formData.get('pendataan') 
      };

      const alat = formData.getAll('alat_digunakan').join(', ');
      const bahan = formData.getAll('bahan_digunakan').join(', ');
      const alatBahan = `Alat: ${alat || '-'}\nBahan: ${bahan || '-'}`;

      const pembungkus = formData.getAll('bahan_pembungkus').join(', ');
      const pengawet = formData.getAll('bahan_pengawet').join(', ');
      const pengamananTXT = `Pembungkus: ${pembungkus || '-'}\nPengawet: ${pengawet || '-'}`;

      const payload = {
          mode: mode,
          koleksi_id: koleksi_id,
          ba_id: ba_id,
          tanggal_perawatan: tanggalPerawatan,
          klasifikasi_koleksi: formData.getAll('klasifikasi_koleksi'),
          material_bahan: materialBahan,
          kondisi: formData.getAll('kondisi'),
          faktor_kerusakan: formData.getAll('faktor_kerusakan'),
          metode_konservasi: metodeKonservasi,
          teknis_penanganan: formData.get('teknis_penanganan') || '-',
          alat_bahan: alatBahan,
          pengamanan: pengamananTXT
      };

      try {
          const res = await API.createPerawatan(payload);
          if (res?.success) {
              showToast('Data perawatan berhasil disimpan dengan sukses.', 'success');
              form.reset();
              resetDynamicFields();
              await loadForms();
          } else {
              showToast('Terjadi error: ' + res.message, 'error');
          }
      } catch (error) {
          console.error('Error saat melakukan submit form:', error);
          showToast('Kesalahan jaringan / Error Internal Web.', 'error');
      }
  });
});

async function loadForms() {
  const tbody = document.getElementById('tbody-forms');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5">Memuat...</td></tr>';
  try {
    const res = await API.getPerawatan();
    const data = res?.data || [];
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada form perawatan</td></tr>';
      return;
    }
    const u = JSON.parse(localStorage.getItem('user')||'{}');
    const isAdmin = u.role === 'admin';

    tbody.innerHTML = data.map(f => `
      <tr>
        <td><strong>${f.kode_perawatan || f.id.slice(0,8)}</strong></td>
        <td>${f.tanggal_perawatan ? new Date(f.tanggal_perawatan).toLocaleDateString('id-ID') : (f.created_at ? new Date(f.created_at).toLocaleDateString('id-ID') : '-')}</td>
        <td>${f.berita_acara?.nomor_surat || '-'}</td>
        <td>${f.petugas_konservasi || '-'}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="downloadPerawatanPdf('${f.id}','${escapeJs(f.kode_perawatan||f.id)}')">PDF</button>
          ${isAdmin ? `<button class="btn btn-sm btn-danger" onclick="hapusForm('${f.id}','${escapeJs(f.kode_perawatan||f.id)}')">Hapus</button>` : ''}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">Gagal memuat list: ${err.message}</td></tr>`;
  }
}

function escapeJs(s) { return (s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\n/g,' '); }

async function hapusForm(id, kode) {
  showModalHapus({
    judul: 'Hapus Form',
    nama: kode,
    onConfirm: async () => {
      try {
        const res = await API.deletePerawatan(id);
        if (res?.success) {
          showToast('Berhasil dihapus', 'success');
          loadForms();
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  });
}
