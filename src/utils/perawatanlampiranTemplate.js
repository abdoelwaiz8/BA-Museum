'use strict';

/* ─── helpers ───────────────────────────────────────────────────────────── */

function toSet(val) {
  if (!val) return new Set();
  if (Array.isArray(val)) return new Set(val.map(v => v.trim()));
  return new Set(String(val).split(',').map(v => v.trim()));
}

function box(set, val) {
  const checked = set.has(val);
  return checked
    ? `<span style="display:inline-block;width:11px;height:11px;border:1px solid #000;font-size:9px;line-height:11px;text-align:center;vertical-align:middle;font-weight:bold;">&#10003;</span>`
    : `<span style="display:inline-block;width:11px;height:11px;border:1px solid #000;font-size:9px;line-height:11px;text-align:center;vertical-align:middle;">&nbsp;</span>`;
}

function bul(set, val) {
  return set.has(val) ? '&#9679;' : '&#9675;';
}

function fmtDate(val) {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

/* ─── data klasifikasi ─────────────────────────────────────────────────── */
const KLASIFIKASI = [
  { code: '01', label: 'GEOLOGIKA',    bg: '#000000', text: '#fff' },
  { code: '02', label: 'BIOLOGIKA',    bg: '#555555', text: '#fff' },
  { code: '03', label: 'ETNOGRAFIKA',  bg: '#999999', text: '#fff' },
  { code: '04', label: 'ARKEOLOGIKA',  bg: '#c05000', text: '#fff' },
  { code: '05', label: 'HISTORIKA',    bg: '#1a1a1a', text: '#fff' },
  { code: '06', label: 'NUMISMATIKA',  bg: '#7a5b00', text: '#fff' },
  { code: '07', label: 'FILOLOGIKA',   bg: '#b8960c', text: '#fff' },
  { code: '08', label: 'KERAMOLOGIKA', bg: '#2e7d7d', text: '#fff' },
  { code: '09', label: 'SENI RUPA',    bg: '#5b9bd5', text: '#fff' },
  { code: '10', label: 'TEKNOLOGIKA',  bg: '#ffffff', text: '#000' },
];

/* ─── main generator ────────────────────────────────────────────────────── */
function generatePerawatanLampiranHtml(data) {
  const petugas  = data.petugas  || {};

  /* Parse semua field CSV menjadi Set */
  const sKlasifikasi = toSet(data.klasifikasi_koleksi);
  const sMaterial    = toSet(data.material);
  const sKondisi     = toSet(data.kondisi);
  const sFaktor      = toSet(data.faktor_kerusakan);
  const sAlat        = toSet(data.alat);
  const sBahan       = toSet(data.bahan);
  const sPembungkus  = toSet(data.pembungkus);
  const sPengawet    = toSet(data.pengawet);

  /* Parse "Lainnya: teks" dari field material */
  let materialLainnyaTxt = data.material_lainnya || '';
  if (!materialLainnyaTxt) {
    for (const item of sMaterial) {
      if (item.toLowerCase().startsWith('lainnya')) {
        const colon = item.indexOf(':');
        if (colon >= 0) materialLainnyaTxt = item.slice(colon + 1).trim();
        break;
      }
    }
  }
  const hasLainnya = [...sMaterial].some(v => v.toLowerCase().startsWith('lainnya'));
  if (hasLainnya) sMaterial.add('Lainnya');

  /* Jenis organik */
  const jenisKoleksiTxt =
    data.jenis_organik === true  ? 'Organik' :
    data.jenis_organik === false ? 'Anorganik' : '-';

  /* ── Data dari BA terkait ── */
  const nomorBA     = data.ba?.nomor_surat || data.nomor_ba || '-';
  const jumlahKoleksi = data.ba?.jumlah_koleksi || data.jumlah_koleksi || '-';

  /* ── Kondisi (3 kolom) ── */
  const kondisiCol1 = ['Polutan/debu','Jamur','Lembab','Lapuk','Mengelupas','Berubah Warna'];
  const kondisiCol2 = ['Tergores','Berlubang','Sompel','Robek','Noda Kotoran','Bekas Perbaikan (repair)'];
  const kondisiCol3 = ['Pecah','Retak','Patah','Karatan'];

  /* ── Alat (5 kolom) ── */
  const alatCols = [
    ['Kuas','Pinset','Spatula','Scraple'],
    ['Sikat gigi','Sikat Plastik','Beaker Glass','Pipet Tetes'],
    ['Jarum Pentul','Jarum Jahit','Jarum Suntik','Gunting'],
    ['Spons','Selang Air','Ember','Alat Penumbuk'],
    ['Oven','Timbangan','Vacum Cleaner','Wadah Stanliesh'],
  ];

  /* ── Bahan (5 kolom) ── */
  const bahanCols = [
    ['Typol','Citrit Acid','Aquades'],
    ['Alkohol','Parafin','Naftalena'],
    ['Kain/serbet','Kain Kasa','Benang'],
    ['Karet Penghapus','Sabun cuci','Sabun Antiseptik'],
    ['Lem','Tali','Kapas'],
  ];

  /* ── Pembungkus (2 kolom) ── */
  const pembungkusLeft  = ['Amplop','Box File','Busa Lapis','Busa Polyfoam'];
  const pembungkusRight = ['Kertas Bebas asam','Kain kerah (staplek)','Kain Belacu','Kertas Wrab'];

  /* ── helper render kolom alat/bahan ── */
  const renderCols = (cols, set, cellW) => {
    const maxRows = Math.max(...cols.map(c => c.length));
    let html = `<table style="width:100%;border-collapse:collapse;font-size:9.5px;">`;
    for (let r = 0; r < maxRows; r++) {
      html += '<tr>';
      cols.forEach(col => {
        const item = col[r] || '';
        html += `<td style="border:none;padding:1px 4px;width:${cellW};white-space:nowrap;">`;
        if (item) html += `${box(set, item)}&nbsp;${item}`;
        html += '</td>';
      });
      html += '</tr>';
    }
    html += '</table>';
    return html;
  };

  /* ── Klasifikasi rows ── */
  const klasRows = KLASIFIKASI.map(({ code, label, bg, text }) => {
    const isActive = sKlasifikasi.has(code);
    return `
      <tr>
        <td style="width:26px;padding:2px 5px;font-size:10px;font-weight:bold;
                   background:${bg};color:${text};border:1px solid #888;text-align:center;">
          ${code}
        </td>
        <td style="padding:${isActive ? '3px 7px' : '2px 7px'};border:1px solid #888;
                   background:${isActive ? '#fff' : '#fafafa'};
                   font-size:${isActive ? '10.5px' : '8.5px'};
                   font-weight:${isActive ? 'bold' : 'normal'};
                   color:${isActive ? '#000' : '#ccc'};
                   letter-spacing:${isActive ? '0.3px' : '0'};">
          ${isActive
            ? `<span style="color:#000;font-size:11px;font-weight:bold;">&#10003;</span>&nbsp;<strong>${label}</strong>`
            : label}
        </td>
      </tr>`;
  }).join('');

  /* ── Kondisi rows ── */
  const maxKondisiRows = Math.max(kondisiCol1.length, kondisiCol2.length, kondisiCol3.length);
  let kondisiRows = '';
  for (let i = 0; i < maxKondisiRows; i++) {
    kondisiRows += '<tr>';
    [kondisiCol1, kondisiCol2, kondisiCol3].forEach((col, ci) => {
      const item = col[i] || '';
      kondisiRows += `<td style="border:none;padding:1px 3px;font-size:9.5px;${ci===2?'width:80px':''}">`;
      if (item) kondisiRows += `${box(sKondisi, item)}&nbsp;${item}`;
      kondisiRows += '</td>';
    });
    kondisiRows += '</tr>';
  }

  /* ─── Nama petugas untuk tanda tangan ─── */
  const namaPetugas  = petugas.nama  || data.nama_petugas  || '';
  const namaPendataan = data.nama_pendataan || '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Form Perawatan Koleksi (Lampiran)</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10px;
    color: #000;
    background: #fff;
    padding: 14mm 14mm 14mm 14mm;
  }
  .sec-header {
    background: #d0c8a0;
    border: 1px solid #000;
    font-size: 10px;
    font-weight: bold;
    padding: 3px 6px;
    margin-bottom: 4px;
    margin-top: 8px;
  }
</style>
</head>
<body>

<!-- ═══════════ HEADER ═══════════ -->
<div style="background:#1a1a1a;color:#fff;padding:6px 10px;margin-bottom:2px;">
  <div style="font-size:14px;font-weight:bold;letter-spacing:0.5px;">FORM PERAWATAN KOLEKSI MUSEUM ACEH&nbsp;<span style="font-size:12px;font-style:italic;">(Lampiran)</span></div>
</div>
<div style="border:1px solid #000;border-top:none;padding:3px 10px;font-size:10px;margin-bottom:10px;">
  Kode Perawatan &nbsp;: &nbsp;<strong>NO.PK</strong>
  &nbsp;&nbsp;&nbsp;<span style="border-bottom:1px solid #000;display:inline-block;min-width:60px;padding:0 4px;">&nbsp;${data.kode_perawatan || ''}&nbsp;</span>
  &nbsp;/&nbsp;
  <span style="border-bottom:1px solid #000;display:inline-block;min-width:40px;padding:0 4px;">&nbsp;20&nbsp;</span>
</div>

<!-- ═══════════ I. IDENTIFIKASI ═══════════ -->
<div class="sec-header">I. IDENTIFIKASI KOLEKSI</div>

<table style="width:100%;border-collapse:collapse;">
<tr>
  <!-- KIRI: data koleksi dari BA -->
  <td style="vertical-align:top;padding-right:8px;width:62%;">
    <table style="width:100%;border-collapse:collapse;font-size:9.5px;">
      <tr>
        <td style="width:22px;padding:1px;background:#c05000;">&nbsp;</td>
        <td style="padding:1.5px 6px;">Nomor Berita Acara</td>
        <td style="width:8px;">:</td>
        <td style="border-bottom:1px solid #888;padding:1.5px 4px;font-weight:bold;">${nomorBA}</td>
      </tr>
      <tr>
        <td style="background:#e07030;">&nbsp;</td>
        <td style="padding:1.5px 6px;">Jumlah Koleksi</td>
        <td>:</td>
        <td style="border-bottom:1px solid #888;padding:1.5px 4px;font-weight:bold;">${jumlahKoleksi}</td>
      </tr>
      <tr>
        <td style="background:#aaa;">&nbsp;</td>
        <td style="padding:1.5px 6px;">Asal Koleksi</td>
        <td>:</td>
        <td style="padding:1.5px 4px;">${data.asal_koleksi || 'Storage / Ruang Pamer / RA'}</td>
      </tr>
      <tr>
        <td style="background:#cde;">&nbsp;</td>
        <td style="padding:1.5px 6px;">Jenis Koleksi <span style="font-size:8px;">(Bahan)</span></td>
        <td>:</td>
        <td style="padding:1.5px 4px;">${jenisKoleksiTxt !== '-' ? jenisKoleksiTxt : 'Organik / Anorganik'}</td>
      </tr>
      <tr>
        <td style="background:#e8d8a0;">&nbsp;</td>
        <td style="padding:1.5px 6px;vertical-align:top;">Material Bahan</td>
        <td style="vertical-align:top;">:</td>
        <td style="padding:2px 4px;">
          <table style="border-collapse:collapse;font-size:9px;">
            <tr>
              <td style="padding:1px 6px 1px 0;">${box(sMaterial,'Batu')}&nbsp;Batu</td>
              <td style="padding:1px 6px;">${box(sMaterial,'Kulit')}&nbsp;Kulit</td>
            </tr>
            <tr>
              <td style="padding:1px 6px 1px 0;">${box(sMaterial,'Kayu')}&nbsp;Kayu</td>
              <td style="padding:1px 6px;">${box(sMaterial,'Rotan')}&nbsp;Rotan</td>
            </tr>
            <tr>
              <td style="padding:1px 6px 1px 0;">${box(sMaterial,'Logam')}&nbsp;Logam</td>
              <td style="padding:1px 6px;">${box(sMaterial,'Kertas')}&nbsp;Kertas</td>
            </tr>
            <tr>
              <td style="padding:1px 6px 1px 0;">${box(sMaterial,'Tekstil')}&nbsp;Tekstil</td>
              <td style="padding:1px 6px;">${box(sMaterial,'Keramik')}&nbsp;Keramik</td>
            </tr>
            <tr>
              <td colspan="2" style="padding:1px 0;">
                ${box(sMaterial,'Lainnya')}&nbsp;Lainnya &nbsp;
                <span style="display:inline-block;border-bottom:1px solid #000;min-width:80px;padding:0 4px;">
                  ${materialLainnyaTxt || '&nbsp;'}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>

  <!-- KANAN: Klasifikasi -->
  <td style="vertical-align:top;width:38%;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td colspan="2" style="background:#1a1a1a;color:#fff;font-size:9px;font-weight:bold;
                               padding:3px 6px;border:1px solid #888;text-align:center;">
          KLASIFIKASI KOLEKSI
        </td>
      </tr>
      ${klasRows}
    </table>
  </td>
</tr>
</table>

<!-- ═══════════ II. KONDISI KOLEKSI ═══════════ -->
<div class="sec-header">II. KONDISI KOLEKSI</div>

<table style="width:100%;border-collapse:collapse;">
<tr>
  <td style="vertical-align:top;width:60%;padding-right:6px;">
    <table style="width:100%;border-collapse:collapse;font-size:9.5px;">
      ${kondisiRows}
    </table>
  </td>
  <td style="vertical-align:top;width:40%;">
    <table style="width:100%;border-collapse:collapse;border:1px solid #888;">
      <tr>
        <td colspan="2" style="background:#1a1a1a;color:#fff;font-size:9px;font-weight:bold;
                               padding:3px 6px;text-align:center;">
          Faktor Penyebab Kerusakan
        </td>
      </tr>
      <tr>
        <td style="padding:2px 8px;font-size:9px;border:none;">${bul(sFaktor,'Cahaya')} Cahaya</td>
        <td style="padding:2px 8px;font-size:9px;border:none;">${bul(sFaktor,'Debu')} Debu</td>
      </tr>
      <tr>
        <td style="padding:2px 8px;font-size:9px;border:none;">${bul(sFaktor,'Suhu')} Suhu</td>
        <td style="padding:2px 8px;font-size:9px;border:none;">${bul(sFaktor,'Kelembaban')} Kelembaban</td>
      </tr>
      <tr>
        <td style="padding:2px 8px;font-size:9px;border:none;">${bul(sFaktor,'Bencana')} Bencana</td>
        <td style="padding:2px 8px;font-size:9px;border:none;">${bul(sFaktor,'Insect/serangga/hama')} Insect/serangga/hama</td>
      </tr>
      <tr>
        <td style="padding:2px 8px;font-size:9px;border:none;">${bul(sFaktor,'Disosiasi')} Disosiasi</td>
        <td style="padding:2px 8px;font-size:9px;border:none;">${bul(sFaktor,'Vandalisme/Tekanan')} Vandalisme/ Tekanan</td>
      </tr>
    </table>
  </td>
</tr>
</table>

<!-- ═══════════ III. METODE KONSERVASI ═══════════ -->
<div class="sec-header">III. METODE KONSERVASI</div>

<table style="width:62%;border-collapse:collapse;font-size:9.5px;margin-bottom:4px;">
  <tr>
    <td style="width:22px;background:#1a1a1a;">&nbsp;</td>
    <td style="padding:1.5px 6px;width:130px;">Teknis Penanganan</td>
    <td style="width:8px;">:</td>
    <td style="padding:1.5px 4px;">
      ${data.teknis_penanganan
        ? `<strong>${data.teknis_penanganan}</strong>`
        : '<span style="color:#888;">Basah / Kering</span>'}
    </td>
  </tr>
  <tr>
    <td style="background:#e07030;">&nbsp;</td>
    <td style="padding:1.5px 6px;">Metode perawatan</td>
    <td>:</td>
    <td style="padding:1.5px 4px;">
      ${data.metode_perawatan
        ? `<strong>${data.metode_perawatan}</strong>`
        : '<span style="color:#888;">Preventif / Kuratif</span>'}
    </td>
  </tr>
  <tr>
    <td style="background:#bbb;">&nbsp;</td>
    <td style="padding:1.5px 6px;">Metode Bahan</td>
    <td>:</td>
    <td style="padding:1.5px 4px;">
      ${data.metode_bahan
        ? `<strong>${data.metode_bahan}</strong>`
        : '<span style="color:#888;">Kimia / Alami</span>'}
    </td>
  </tr>
</table>

<!-- sub-header ALAT -->
<div style="background:#1a1a1a;color:#fff;border:1px solid #000;font-size:9.5px;font-weight:bold;
            padding:2px 6px;margin-bottom:3px;">ALAT</div>
${renderCols(alatCols, sAlat, '20%')}

<!-- sub-header BAHAN -->
<div style="background:#d0c8a0;border:1px solid #000;font-size:9.5px;font-weight:bold;
            padding:2px 6px;margin:4px 0 3px 0;">BAHAN</div>
${renderCols(bahanCols, sBahan, '20%')}

<!-- ═══════════ PENGAMANAN KOLEKSI ═══════════ -->
<div class="sec-header" style="margin-top:6px;">PENGAMANAN KOLEKSI</div>

<table style="width:100%;border-collapse:collapse;border:1px solid #888;">
<tr>
  <!-- Pembungkus -->
  <td style="vertical-align:top;width:55%;border-right:1px solid #888;padding:0;">
    <div style="background:#e8d8a0;font-size:9px;font-weight:bold;padding:2px 6px;border-bottom:1px solid #888;">
      Bahan Pembungkus Koleksi
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:9.5px;padding:4px;">
      <tr>
        ${pembungkusLeft.map((item,i) => `
          <td style="border:none;padding:2px 8px;width:50%;">
            ${box(sPembungkus, item)}&nbsp;${item}
          </td>
          <td style="border:none;padding:2px 8px;width:50%;">
            ${box(sPembungkus, pembungkusRight[i] || '')}&nbsp;${pembungkusRight[i] || ''}
          </td>
        `).join('</tr><tr>')}
      </tr>
    </table>
  </td>

  <!-- Pengawet -->
  <td style="vertical-align:top;width:45%;padding:0;">
    <div style="background:#e8d8a0;font-size:9px;font-weight:bold;padding:2px 6px;border-bottom:1px solid #888;">
      Bahan Pengawet Koleksi
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:9.5px;">
      <tr>
        <td style="border:none;padding:2px 8px;">${bul(sPengawet,'Cengkeh')} Cengkeh</td>
        <td style="border:none;padding:2px 8px;">${bul(sPengawet,'Silica-gel')} Cilica-gel</td>
      </tr>
      <tr>
        <td style="border:none;padding:2px 8px;">${bul(sPengawet,'Lada Hitam')} Lada Hitam</td>
        <td style="border:none;padding:2px 8px;">${bul(sPengawet,'Kapur Barus')} Kapur Barus</td>
      </tr>
      <tr>
        <td colspan="2" style="border:none;padding:2px 8px;">${bul(sPengawet,'Tembakau')} Tembakau</td>
      </tr>
    </table>
  </td>
</tr>
</table>

<!-- ═══════════ TANDA TANGAN (Lampiran: 2 kolom) ═══════════ -->
<div style="margin-top:20px;">
  <div style="font-size:9.5px;font-weight:bold;margin-bottom:12px;">Laboratorium Museum Aceh</div>
  <table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="width:50%;border:none;font-size:9.5px;vertical-align:top;padding-right:10px;">
      <div style="margin-bottom:4px;">Petugas Konservasi &nbsp;:&nbsp;
        <span style="display:inline-block;border-bottom:1px solid #000;min-width:110px;">&nbsp;${namaPetugas}&nbsp;</span>
      </div>
    </td>
    <td style="width:50%;border:none;font-size:9.5px;vertical-align:top;">
      <div style="margin-bottom:4px;">Pendataan &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;
        <span style="display:inline-block;border-bottom:1px solid #000;min-width:110px;">&nbsp;${namaPendataan}&nbsp;</span>
      </div>
    </td>
  </tr>
  </table>
</div>

</body>
</html>`;
}

module.exports = { generatePerawatanLampiranHtml };
