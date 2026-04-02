/**
 * laporanTemplate.js
 *
 * Generates HTML for the monthly maintenance report PDF.
 * Function: generateLaporanBulananHtml(rows, meta)
 */

const BULAN_NAMES = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

/**
 * @param {Array} rows — result from PerawatanRepository.getLaporanBulanan()
 * @param {Object} meta — { bulan, tahun, kepala_nama, kepala_nip, konservator_nama, konservator_nip }
 */
function generateLaporanBulananHtml(rows, meta) {
  const bulanName = BULAN_NAMES[(Number(meta.bulan) - 1)] || meta.bulan;

  // ── Group by jenis_koleksi ──────────────────────────────────
  const groups = {};
  (rows || []).forEach(row => {
    const jenis = row.koleksi?.jenis_koleksi || 'Tidak Diketahui';
    if (!groups[jenis]) groups[jenis] = [];
    groups[jenis].push(row);
  });

  let totalKoleksi = 0;
  let no = 0;

  const tableRows = Object.entries(groups).map(([jenis, items]) => {
    no++;
    const count = items.length;
    totalKoleksi += count;

    // Combine names
    const namaList = [...new Set(items.map(i => i.koleksi?.nama_koleksi || '-'))].join(', ');
    
    // Combine all unique kondisi
    const allKondisi = [];
    items.forEach(i => { if (Array.isArray(i.kondisi)) allKondisi.push(...i.kondisi); });
    const kondisiStr = [...new Set(allKondisi)].join(', ') || '-';

    // Combine all unique alat
    const allAlat = [];
    items.forEach(i => { if (Array.isArray(i.alat)) allAlat.push(...i.alat); });
    const alatStr = [...new Set(allAlat)].join(', ') || '-';

    // Combine all unique bahan
    const allBahan = [];
    items.forEach(i => { if (Array.isArray(i.bahan)) allBahan.push(...i.bahan); });
    const bahanStr = [...new Set(allBahan)].join(', ') || '-';

    // Metode: check if Preventif or Kuratif
    const hasPreventif = items.some(i => i.metode_perawatan === 'Preventif');
    const hasKuratif   = items.some(i => i.metode_perawatan === 'Kuratif');

    return `<tr>
      <td class="c">${no}</td>
      <td>${namaList}</td>
      <td class="c">${count} Koleksi</td>
      <td class="c">${jenis}</td>
      <td style="font-size:8pt;">${kondisiStr}</td>
      <td style="font-size:8pt;">${alatStr}</td>
      <td style="font-size:8pt;">${bahanStr}</td>
      <td class="c">${hasPreventif ? '✓' : ''}</td>
      <td class="c">${hasKuratif ? '✓' : ''}</td>
      <td>Pemeliharaan koleksi</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size:10pt; color:#000; background:#fff; }
  table { border-collapse:collapse; width:100%; }
  th, td { border:1px solid #000; padding:3px 5px; vertical-align:top; font-size:9pt; }
  th { background:#f0f0f0; text-align:center; font-weight:bold; }
  .c { text-align:center; }
  .header-wrap { display:flex; align-items:center; margin-bottom:10px; }
  .header-side { writing-mode:vertical-lr; transform:rotate(180deg); font-weight:bold; font-size:10pt; letter-spacing:2px; padding-right:10px; }
  .header-main { flex:1; }
  .sign-wrap { display:flex; justify-content:space-between; margin-top:20px; font-size:10pt; }
  .sign-box { width:45%; text-align:center; }
  .sign-space { height:60px; }
</style>
</head>
<body>

<div class="header-wrap">
  <div class="header-side">LAPORAN JUMLAH DATA PEMELIHARAAN KOLEKSI MUSEUM ACEH</div>
  <div class="header-main">
    <div style="font-weight:bold; font-size:11pt; text-align:center; margin-bottom:6px;">
      LAPORAN JUMLAH DATA PEMELIHARAAN KOLEKSI MUSEUM ACEH
    </div>
    <div style="text-align:center; margin-bottom:10px;">
      BULAN : ${bulanName.toUpperCase()} &nbsp;&nbsp; TAHUN ${meta.tahun}
    </div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th rowspan="2" style="width:30px">NO</th>
      <th rowspan="2">NAMA KOLEKSI</th>
      <th rowspan="2" style="width:70px">JUMLAH</th>
      <th rowspan="2" style="width:80px">JENIS KOLEKSI</th>
      <th rowspan="2" style="width:90px">KONDISI</th>
      <th rowspan="2" style="width:90px">ALAT</th>
      <th rowspan="2" style="width:90px">BAHAN</th>
      <th colspan="2" style="width:80px">METODE KONSERVASI</th>
      <th rowspan="2" style="width:100px">KETERANGAN</th>
    </tr>
    <tr>
      <th style="width:40px">Preventif</th>
      <th style="width:40px">Kuratif</th>
    </tr>
  </thead>
  <tbody>
    ${tableRows || '<tr><td colspan="10" class="c">Tidak ada data perawatan bulan ini</td></tr>'}
    <tr style="font-weight:bold;">
      <td class="c" colspan="2">JUMLAH</td>
      <td class="c">${totalKoleksi} KOLEKSI</td>
      <td colspan="7"></td>
    </tr>
  </tbody>
</table>

<!-- SIGNATURE FOOTER -->
<div class="sign-wrap">
  <div class="sign-box" style="text-align:left;">
    <div>Banda Aceh, ........................</div>
    <div style="margin-top:2px;">Konservator</div>
    <div class="sign-space"></div>
    <div style="font-weight:bold; text-decoration:underline;">${meta.konservator_nama || '_______________'}</div>
    <div>NIP. ${meta.konservator_nip || '_______________'}</div>
  </div>
  <div class="sign-box" style="text-align:right;">
    <div>Mengetahui</div>
    <div style="margin-top:2px;">Kepala Subbag Tata Usaha</div>
    <div class="sign-space"></div>
    <div style="font-weight:bold; text-decoration:underline;">${meta.kepala_nama || '_______________'}</div>
    <div>NIP. ${meta.kepala_nip || '_______________'}</div>
  </div>
</div>

</body>
</html>`;
}

module.exports = { generateLaporanBulananHtml };
