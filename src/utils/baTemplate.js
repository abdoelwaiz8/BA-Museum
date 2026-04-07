/**
 * Museum Aceh — baTemplate.js v5.0.0
 * Sesuai dokumen asli: hanya 2 jenis BA (Penyerahan & Pengembalian)
 * - Layout TTD pakai display:table agar konsisten di Puppeteer
 * - Paragraf & Pasal berbeda per jenis BA
 * - Tanda tangan: nama bold+underline, NIP di bawah
 * - Saksi-saksi: label tengah, kiri & kanan
 */

const HARI    = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const BULAN   = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const SATUAN  = ['','Satu','Dua','Tiga','Empat','Lima','Enam','Tujuh','Delapan','Sembilan','Sepuluh','Sebelas','Dua Belas','Tiga Belas','Empat Belas','Lima Belas','Enam Belas','Tujuh Belas','Delapan Belas','Sembilan Belas'];
const PULUHAN = ['','','Dua Puluh','Tiga Puluh','Empat Puluh','Lima Puluh','Enam Puluh','Tujuh Puluh','Delapan Puluh','Sembilan Puluh'];

function angkaKeKata(n) {
  if (n < 20) return SATUAN[n];
  if (n < 100) return (PULUHAN[Math.floor(n/10)] + (n%10 !== 0 ? ' '+SATUAN[n%10] : '')).trim();
  if (n < 1000) { const r=Math.floor(n/100),s=n%100; return ((r===1?'Seratus':SATUAN[r]+' Ratus')+(s?' '+angkaKeKata(s):'')).trim(); }
  if (n < 10000) { const r=Math.floor(n/1000),s=n%1000; return ((r===1?'Seribu':SATUAN[r]+' Ribu')+(s?' '+angkaKeKata(s):'')).trim(); }
  return String(n);
}

function tanggalKeKalimat(d) {
  const dt = new Date(d);
  return `${HARI[dt.getDay()]}, ${angkaKeKata(dt.getDate())} ${BULAN[dt.getMonth()]} Tahun ${angkaKeKata(dt.getFullYear())}`;
}

function tanggalPendek(d) {
  const dt = new Date(d);
  return `${dt.getDate()} ${BULAN[dt.getMonth()]} ${dt.getFullYear()}`;
}

function nipLine(nip) {
  if (!nip || nip === '-') return '';
  return `<div class="ttd-nip">NIP. ${nip}</div>`;
}

// Logo Pancacita (Pemerintah Aceh) — loaded via URL by Puppeteer (networkidle0)
const LOGO_PANCACITA = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Coat_of_arms_of_Aceh.svg/300px-Coat_of_arms_of_Aceh.svg.png';

function buatBarisKoleksi(items) {
  return items.map((item, i) => `
    <tr>
      <td class="c">${i+1}</td>
      <td class="c">${item.koleksi?.no_inventaris||'-'}</td>
      <td>${item.koleksi?.nama_koleksi||'-'}</td>
      <td class="c">${item.koleksi?.jenis_koleksi||'-'}</td>
      <td>${item.kondisi_saat_transaksi||item.koleksi?.kondisi_terkini||'-'}</td>
    </tr>`).join('');
}

/**
 * Hasilkan HTML untuk PDF Berita Acara.
 * Mendukung: jenis_ba = 'Penyerahan' | 'Pengembalian'
 */
function generateBAHtml(ba) {
  const tglKalimat = tanggalKeKalimat(ba.tanggal_serah_terima);
  const tglPendek_ = tanggalPendek(ba.tanggal_serah_terima);
  const jumlah     = ba.items?.length || 0;
  const jumlahKata = angkaKeKata(jumlah);
  const jenis      = ba.jenis_ba || 'Penyerahan';

  /* ── Paragraf pembuka & Pasal 1 berbeda per jenis ── */
  let paragrafPembuka, pasal1;
  if (jenis === 'Penyerahan') {
    paragrafPembuka = `PIHAK PERTAMA telah melakukan penyerahan koleksi kepada PIHAK KEDUA
      sebanyak ${jumlah} (${jumlahKata}) koleksi untuk di Konservasi
      dengan ketentuan sebagai berikut:`;
    pasal1 = `PIHAK PERTAMA menyerahkan sebanyak ${jumlah} (${jumlahKata}) koleksi
      (daftar dan identitas koleksi terlampir) kepada PIHAK KEDUA dan PIHAK KEDUA
      telah menerima koleksi tersebut.`;
  } else {
    // Pengembalian
    paragrafPembuka = `PIHAK PERTAMA telah melakukan Pengembalian Koleksi setelah dikonservasi
      kepada PIHAK KEDUA untuk disimpan kembali pada ruang penyimpanan koleksi
      dengan ketentuan sebagai berikut:`;
    pasal1 = `PIHAK PERTAMA mengembalikan sebanyak ${jumlah} (${jumlahKata}) koleksi
      (daftar dan identitas koleksi terlampir) kepada PIHAK KEDUA dan PIHAK KEDUA
      telah menerima koleksi tersebut.`;
  }

  /* ── Blok tanda tangan saksi ── */
  const adaSaksi = ba.saksi1 || ba.saksi2;
  const saksiHtml = adaSaksi ? `
    <div class="ttd-row" style="margin-top: 10px;">
      <div class="ttd-col kiri">
        ${ba.saksi1 ? `
          <div class="ttd-label">Saksi 1,</div>
          <div class="ttd-nama"><u><b>${ba.saksi1.nama}</b></u></div>
          ${nipLine(ba.saksi1.nip)}` : ''}
      </div>
      <div class="ttd-col kanan">
        ${ba.saksi2 ? `
          <div class="ttd-label">Saksi 2,</div>
          <div class="ttd-nama"><u><b>${ba.saksi2.nama}</b></u></div>
          ${nipLine(ba.saksi2.nip)}` : ''}
      </div>
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    color: #000;
    background: #fff;
  }

  /* ── HALAMAN 1 ─────────────────────────── */
  @page {
    margin: 15mm 20mm 15mm 25mm;
  }
  .pg1 { padding: 0; }
  .pg2 {
    page-break-before: always;
    padding-top: 6mm;
  }

  /* ── KOP SURAT ─────────────────────────── */
  .kop {
    display: table;
    width: 100%;
    border-bottom: 4px double #000;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
  .kop-logo {
    display: table-cell;
    vertical-align: middle;
    width: 105px;
  }
  .kop-logo img {
    width: 95px;
    height: 95px;
    object-fit: contain;
  }
  .kop-txt {
    display: table-cell;
    vertical-align: middle;
    text-align: center;
    line-height: 1.35;
  }
  .kop-txt .k0 { font-size: 9pt;  font-weight: bold; letter-spacing: 1px; }
  .kop-txt .k1 { font-size: 12pt; font-weight: bold; }
  .kop-txt .k2 { font-size: 12pt; font-weight: bold; }
  .kop-txt .k3 { font-size: 20pt; font-weight: bold; letter-spacing: 2px; }
  .kop-txt .al { font-size: 8pt;  margin-top: 4px; line-height: 1.4; }

  /* ── JUDUL BA ─────────────────────────── */
  .jd { text-align: center; margin: 12px 0 4px; }
  .jd .j {
    font-size: 12pt;
    font-weight: bold;
    text-decoration: underline;
    text-transform: uppercase;
  }
  .jd .n { font-size: 12pt; margin-top: 3px; }

  /* ── ISI SURAT ────────────────────────── */
  .bt {
    margin: 10px 0;
    text-align: justify;
    line-height: 1.6;
    font-size: 12pt;
  }

  /* Tabel identitas — indent kiri 20px */
  .ti {
    width: 100%;
    margin: 4px 0 4px 20px;
    border-collapse: collapse;
    font-size: 12pt;
  }
  .ti td { padding: 1px 4px; vertical-align: top; }
  .ti .lb { width: 70px; }
  .ti .tk { width: 14px; text-align: center; }
  .ti .vl { font-weight: bold; }

  /* Pasal */
  .ps {
    text-align: center;
    margin: 12px 0 4px;
    font-size: 12pt;
    font-weight: bold;
  }
  .pi {
    text-align: justify;
    line-height: 1.6;
    font-size: 12pt;
  }

  /* ── BLOK TANDA TANGAN ────────────────────────
     Pakai display:table supaya kolom benar-benar
     sejajar di Puppeteer (bukan flexbox)
  ──────────────────────────────────────────────── */
  .ttd-wrap {
    margin-top: 15px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Baris TTD utama: Pihak Kedua | Pihak Pertama */
  .ttd-row {
    display: table;
    width: 100%;
    table-layout: fixed;
    margin-bottom: 10px;
  }
  .ttd-col {
    display: table-cell;
    vertical-align: top;
    width: 50%;
  }
  .ttd-col.kiri {
    text-align: left;
    padding-left: 10px;
  }
  .ttd-col.kanan {
    text-align: right;
    padding-right: 10px;
  }

  .ttd-label {
    font-size: 11pt;
    margin-bottom: 50px;   /* ruang tanda tangan */
  }
  .ttd-kota {
    font-size: 11pt;
    margin-bottom: 2px;
  }
  .ttd-nama {
    font-size: 11pt;
  }
  .ttd-nip {
    font-size: 11pt;
  }

  /* ── LAMPIRAN ─────────────────────────── */
  .lj {
    text-align: center;
    font-weight: bold;
    font-size: 13pt;
    margin-bottom: 8px;
    text-decoration: underline;
  }
  .ls {
    font-weight: bold;
    margin-bottom: 6px;
    font-size: 12pt;
  }
  .tk-tbl {
    width: 100%;
    border-collapse: collapse;
    font-size: 10.5pt;
  }
  .tk-tbl thead { display: table-header-group; }
  .tk-tbl th, .tk-tbl td {
    border: 1px solid #000;
    padding: 4px 6px;
    vertical-align: middle;
  }
  .tk-tbl th {
    background: #f0f0f0;
    text-align: center;
    font-weight: bold;
  }
  .tk-tbl td.c { text-align: center; }

  @media print {
    .ttd-wrap, .saksi-wrap { page-break-inside: avoid; break-inside: avoid; }
    .pg2 { page-break-before: always; }
  }
</style>
</head>
<body>

<!-- ═══════════════════════════════════════
     HALAMAN 1
═══════════════════════════════════════ -->
<div class="pg1">

  <!-- KOP -->
  <div class="kop">
    <div class="kop-logo">
      <img src="${LOGO_PANCACITA}" alt="Logo Museum Aceh">
    </div>
    <div class="kop-txt">
      <div class="k1">PEMERINTAH ACEH</div>
      <div class="k2">DINAS KEBUDAYAAN DAN PARIWISATA</div>
      <div class="k3">MUSEUM ACEH</div>
      <div class="al">
        Jalan Sultan Alaiddin Mahmudsyah, Banda Aceh 23241 &nbsp;
        Telepon (0651) 21033, 23144, 23352 &nbsp; Fax. (0651) 21033<br>
        Website&nbsp;:&nbsp;www.museum.acehprov.go.id
        &nbsp;&nbsp;&nbsp; email&nbsp;:&nbsp;aceh_museum@yahoo.com
      </div>
    </div>
  </div>

  <!-- JUDUL -->
  <div class="jd">
    <div class="j">BERITA ACARA ${jenis.toUpperCase()} KOLEKSI</div>
    <div class="n">${ba.nomor_surat}</div>
  </div>

  <!-- PEMBUKA -->
  <div class="bt">
    Pada hari ini ${tglKalimat} yang bertanda tangan di bawah ini:
  </div>

  <!-- PIHAK PERTAMA -->
  <table class="ti">
    <tr><td class="lb">Nama</td>   <td class="tk">:</td><td class="vl">${ba.pihak1?.nama||'-'}</td></tr>
    <tr><td class="lb">NIP</td>    <td class="tk">:</td><td>${ba.pihak1?.nip||'-'}</td></tr>
    <tr><td class="lb">Jabatan</td><td class="tk">:</td><td>${ba.pihak1?.jabatan||'-'}</td></tr>
    <tr><td class="lb">Alamat</td> <td class="tk">:</td><td>${ba.pihak1?.alamat||'Museum Aceh'}</td></tr>
  </table>

  <div class="bt">Selanjutnya disebut PIHAK PERTAMA,</div>

  <!-- PIHAK KEDUA -->
  <table class="ti">
    <tr><td class="lb">Nama</td>   <td class="tk">:</td><td class="vl">${ba.pihak2?.nama||'-'}</td></tr>
    <tr><td class="lb">NIP</td>    <td class="tk">:</td><td>${(ba.pihak2?.nip && ba.pihak2.nip!=='-') ? ba.pihak2.nip : '-'}</td></tr>
    <tr><td class="lb">Jabatan</td><td class="tk">:</td><td>${ba.pihak2?.jabatan||'-'}</td></tr>
    <tr><td class="lb">Alamat</td> <td class="tk">:</td><td>${ba.pihak2?.alamat||'Museum Aceh'}</td></tr>
  </table>

  <div class="bt">Selanjutnya disebut PIHAK KEDUA,</div>

  <!-- PARAGRAF PEMBUKA (berbeda per jenis) -->
  <div class="bt">${paragrafPembuka}</div>

  <!-- PASAL 1 -->
  <div class="ps">Pasal 1</div>
  <div class="pi">${pasal1}</div>

  <!-- PASAL 2 -->
  <div class="ps">Pasal 2</div>
  <div class="pi">
    Sejak dilakukan serah terima koleksi ini maka segala sesuatu yang menyangkut
    koleksi tersebut termasuk pengamanannya menjadi tanggung jawab PIHAK KEDUA.
  </div>

  <div class="bt">Demikian Berita acara ini dibuat untuk dipergunakan seperlunya.</div>

  <!-- ═══ BLOK TANDA TANGAN ═══ -->
  <div class="ttd-wrap">

    <!-- Baris 1: Pihak Kedua (kiri) & Pihak Pertama (kanan) -->
    <div class="ttd-row">
      <!-- KIRI: Pihak Kedua -->
      <div class="ttd-col kiri">
        <div class="ttd-label">PIHAK KEDUA,</div>
        <div class="ttd-nama"><u><b>${ba.pihak2?.nama||'-'}</b></u></div>
        ${nipLine(ba.pihak2?.nip)}
      </div>
      <!-- KANAN: Banda Aceh + Pihak Pertama -->
      <div class="ttd-col kanan">
        <div class="ttd-kota">Banda Aceh, ${tglPendek_}</div>
        <div class="ttd-label">PIHAK PERTAMA,</div>
        <div class="ttd-nama"><u><b>${ba.pihak1?.nama||'-'}</b></u></div>
        ${nipLine(ba.pihak1?.nip)}
      </div>
    </div>

    <!-- Baris 2: Saksi-saksi (jika ada) -->
    ${saksiHtml}

  </div><!-- /ttd-wrap -->

</div><!-- /pg1 -->

<!-- ═══════════════════════════════════════
     HALAMAN 2 — LAMPIRAN
═══════════════════════════════════════ -->
<div class="pg2">
  <div class="lj">Lampiran Data Koleksi</div>
  <table class="tk-tbl">
    <thead>
      <tr>
        <th style="width:34px">NO</th>
        <th style="width:110px">NO. INVENTARIS</th>
        <th>NAMA KOLEKSI</th>
        <th style="width:100px">JENIS KOLEKSI</th>
        <th style="width:130px">KONDISI</th>
      </tr>
    </thead>
    <tbody>${buatBarisKoleksi(ba.items||[])}</tbody>
  </table>
</div>

</body>
</html>`;
}

module.exports = { generateBAHtml };