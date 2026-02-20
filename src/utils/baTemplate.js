/**
 * Template HTML untuk generate PDF Berita Acara
 * Menghasilkan dokumen 2 halaman:
 *   - Halaman 1 : Header institusi, isi BA, blok tanda tangan
 *   - Halaman 2 : Lampiran Daftar Koleksi (tabel)
 */

const { format } = require('date-fns');
const { id: localeId } = require('date-fns/locale');

/**
 * Konversi tanggal ke format teks Indonesia
 * Contoh: "2026-02-13" → "Jumat, Tiga Belas Februari Tahun Dua Ribu Dua Puluh Enam"
 */
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const SATUAN = [
  '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima',
  'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh',
  'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas',
  'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas',
];

const PULUHAN = [
  '', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh',
  'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh',
];

function angkaKeKata(n) {
  if (n < 20) return SATUAN[n];
  if (n < 100) return (PULUHAN[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + SATUAN[n % 10] : '')).trim();
  if (n < 1000) {
    const ratus = Math.floor(n / 100);
    const sisa  = n % 100;
    return ((ratus === 1 ? 'Seratus' : SATUAN[ratus] + ' Ratus') + (sisa ? ' ' + angkaKeKata(sisa) : '')).trim();
  }
  if (n < 10000) {
    const ribu = Math.floor(n / 1000);
    const sisa = n % 1000;
    return ((ribu === 1 ? 'Seribu' : SATUAN[ribu] + ' Ribu') + (sisa ? ' ' + angkaKeKata(sisa) : '')).trim();
  }
  return String(n);
}

function tanggalKeKalimat(dateStr) {
  const date    = new Date(dateStr);
  const hari    = HARI[date.getDay()];
  const tanggal = angkaKeKata(date.getDate());
  const bulan   = BULAN[date.getMonth()];
  const tahun   = angkaKeKata(date.getFullYear());
  return `${hari}, ${tanggal} ${bulan} Tahun ${tahun}`;
}

function tanggalPendek(dateStr) {
  const date = new Date(dateStr);
  return `${date.getDate()} ${BULAN[date.getMonth()]} ${date.getFullYear()}`;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Buat baris tabel lampiran koleksi
 * @param {Array} items - Array item dari ba_items join koleksi
 */
function buatBarisKoleksi(items) {
  return items
    .map(
      (item, index) => `
        <tr>
          <td class="center">${index + 1}</td>
          <td class="center">${item.koleksi?.no_inventaris || '-'}</td>
          <td>${item.koleksi?.nama_koleksi || '-'}</td>
          <td class="center">${item.koleksi?.jenis_koleksi || '-'}</td>
          <td>${item.kondisi_saat_transaksi || item.koleksi?.kondisi_terkini || '-'}</td>
        </tr>`
    )
    .join('');
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate HTML lengkap untuk satu dokumen Berita Acara
 * @param {Object} ba - Data BA dari BARepository.getFullDetail()
 * @returns {string} HTML string siap dikonversi ke PDF
 */
function generateBAHtml(ba) {
  const tanggalKalimat = tanggalKeKalimat(ba.tanggal_serah_terima);
  const tanggalTtd     = tanggalPendek(ba.tanggal_serah_terima);
  const jumlahKoleksi  = ba.items?.length || 0;

  // Teks jenis BA untuk kalimat pembuka
  const jenisMap = {
    'Pengembalian': 'Pengembalian Koleksi setelah dikonservasi',
    'Peminjaman':   'Peminjaman Koleksi',
    'Serah Terima': 'Serah Terima Koleksi',
    'Pengiriman':   'Pengiriman Koleksi',
  };
  const keteranganJenis = jenisMap[ba.jenis_ba] || ba.jenis_ba;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      color: #000;
      background: #fff;
    }

    /* ── Halaman ── */
    .halaman {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm 25mm 20mm 30mm;
      page-break-after: always;
    }
    .halaman:last-child { page-break-after: avoid; }

    /* ── Header Kop Surat ── */
    .kop {
      display: flex;
      align-items: center;
      border-bottom: 3px double #000;
      padding-bottom: 6px;
      margin-bottom: 14px;
    }
    .kop img {
      width: 70px;
      height: 70px;
      margin-right: 14px;
      object-fit: contain;
    }
    .kop-teks { text-align: center; flex: 1; }
    .kop-teks .instansi-1  { font-size: 13pt; font-weight: bold; }
    .kop-teks .instansi-2  { font-size: 13pt; font-weight: bold; }
    .kop-teks .instansi-3  { font-size: 18pt; font-weight: bold; letter-spacing: 1px; }
    .kop-teks .alamat      { font-size: 9pt; margin-top: 2px; }

    /* ── Judul ── */
    .judul-wrapper { text-align: center; margin: 16px 0 6px; }
    .judul-wrapper .judul {
      font-size: 13pt;
      font-weight: bold;
      text-decoration: underline;
      text-transform: uppercase;
    }
    .judul-wrapper .nomor { font-size: 12pt; }

    /* ── Body Teks ── */
    .body-teks { margin: 14px 0; text-align: justify; line-height: 1.6; }

    /* ── Tabel Identitas Pihak ── */
    .tabel-identitas {
      width: 100%;
      margin: 8px 0 8px 20px;
      border-collapse: collapse;
    }
    .tabel-identitas td {
      padding: 1px 4px;
      vertical-align: top;
      font-size: 12pt;
    }
    .tabel-identitas .label  { width: 80px; }
    .tabel-identitas .titik  { width: 20px; text-align: center; }
    .tabel-identitas .nilai  { font-weight: bold; }

    /* ── Pasal ── */
    .pasal { text-align: center; margin: 16px 0 8px; font-weight: normal; }
    .pasal-isi { text-align: justify; line-height: 1.7; }

    /* ── Blok Tanda Tangan ── */
    .ttd-wrapper {
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .ttd-kota {
      text-align: right;
      margin-bottom: 4px;
    }
    .ttd-blok { text-align: center; width: 200px; }
    .ttd-blok .ttd-label { margin-bottom: 60px; }
    .ttd-blok .ttd-nama  { font-weight: bold; text-decoration: underline; }
    .ttd-blok .ttd-nip   { font-size: 11pt; }

    .saksi-wrapper {
      margin-top: 28px;
      display: flex;
      justify-content: space-between;
    }
    .saksi-blok { text-align: center; width: 200px; }
    .saksi-blok .ttd-label { margin-bottom: 60px; }
    .saksi-blok .ttd-nama  { font-weight: bold; text-decoration: underline; }
    .saksi-blok .ttd-nip   { font-size: 11pt; }
    .saksi-title { font-size: 11pt; margin-bottom: 6px; }

    /* ── Lampiran ── */
    .lampiran-judul {
      text-align: center;
      font-weight: bold;
      font-size: 13pt;
      margin-bottom: 10px;
      text-decoration: underline;
    }
    .sub-judul {
      font-weight: bold;
      margin-bottom: 8px;
    }
    .tabel-koleksi {
      width: 100%;
      border-collapse: collapse;
      font-size: 11pt;
    }
    .tabel-koleksi th,
    .tabel-koleksi td {
      border: 1px solid #000;
      padding: 5px 7px;
      vertical-align: middle;
    }
    .tabel-koleksi th {
      background-color: #f0f0f0;
      text-align: center;
      font-weight: bold;
    }
    .tabel-koleksi td.center { text-align: center; }

    @media print {
      .halaman { page-break-after: always; }
    }
  </style>
</head>
<body>

<!-- ════════════════════════════════════════════════════════ -->
<!-- HALAMAN 1: DOKUMEN BERITA ACARA                         -->
<!-- ════════════════════════════════════════════════════════ -->
<div class="halaman">

  <!-- Kop Surat -->
  <div class="kop">
    <div class="kop-teks">
      <div class="instansi-1">PEMERINTAH ACEH</div>
      <div class="instansi-2">DINAS KEBUDAYAAN DAN PARIWISATA</div>
      <div class="instansi-3">MUSEUM ACEH</div>
      <div class="alamat">
        Jalan Sultan Alaiddin Mahmudsyah, Banda Aceh 23241 Telepon (0651) 21033,23144, 23352, Fax. (0651) 21033<br>
        Website : www.museum.acehprov.go.id &nbsp; email : aceh_museum@yahoo.com
      </div>
    </div>
  </div>

  <!-- Judul -->
  <div class="judul-wrapper">
    <div class="judul">BERITA ACARA ${ba.jenis_ba?.toUpperCase()} KOLEKSI</div>
    <div class="nomor">${ba.nomor_surat}</div>
  </div>

  <!-- Pembuka -->
  <div class="body-teks">
    Pada hari ini ${tanggalKalimat} yang bertanda tangan di bawah ini:
  </div>

  <!-- Pihak Pertama -->
  <table class="tabel-identitas">
    <tr><td class="label">Nama</td>    <td class="titik">:</td><td class="nilai">${ba.pihak1?.nama || '-'}</td></tr>
    <tr><td class="label">NIP</td>     <td class="titik">:</td><td>${ba.pihak1?.nip || '-'}</td></tr>
    <tr><td class="label">Jabatan</td> <td class="titik">:</td><td>${ba.pihak1?.jabatan || '-'}</td></tr>
    <tr><td class="label">Alamat</td>  <td class="titik">:</td><td>${ba.pihak1?.alamat || 'Museum Aceh'}</td></tr>
  </table>
  <div class="body-teks">Selanjutnya disebut PIHAK PERTAMA,</div>

  <!-- Pihak Kedua -->
  <table class="tabel-identitas">
    <tr><td class="label">Nama</td>    <td class="titik">:</td><td class="nilai">${ba.pihak2?.nama || '-'}</td></tr>
    <tr><td class="label">NIP</td>     <td class="titik">:</td><td>${ba.pihak2?.nip || '-'}</td></tr>
    <tr><td class="label">Jabatan</td> <td class="titik">:</td><td>${ba.pihak2?.jabatan || '-'}</td></tr>
    <tr><td class="label">Alamat</td>  <td class="titik">:</td><td>${ba.pihak2?.alamat || 'Museum Aceh'}</td></tr>
  </table>
  <div class="body-teks">Selanjutnya disebut PIHAK KEDUA,</div>

  <!-- Isi -->
  <div class="body-teks">
    PIHAK PERTAMA telah melakukan ${keteranganJenis} kepada PIHAK KEDUA
    untuk disimpan kembali pada ruang penyimpanan koleksi dengan ketentuan sebagai berikut:
  </div>

  <!-- Pasal 1 -->
  <div class="pasal">Pasal 1</div>
  <div class="pasal-isi">
    PIHAK PERTAMA mengembalikan koleksi sebanyak ${jumlahKoleksi} koleksi
    ${ba.items?.[0]?.koleksi?.jenis_koleksi || ''} (daftar dan identitas koleksi terlampir)
    kepada PIHAK KEDUA dan PIHAK KEDUA telah menerima koleksi tersebut.
  </div>

  <!-- Pasal 2 -->
  <div class="pasal">Pasal 2</div>
  <div class="pasal-isi">
    Sejak dilakukan serah terima koleksi ini maka segala sesuatu yang menyangkut koleksi tersebut
    termasuk pengamanannya menjadi tanggung jawab PIHAK KEDUA.
  </div>

  <div class="body-teks">Demikian Berita acara ini dibuat untuk dipergunakan seperlunya.</div>

  <!-- Tanda Tangan Pihak 1 & 2 -->
  <div class="ttd-wrapper">
    <!-- Pihak Kedua (kiri) -->
    <div class="ttd-blok">
      <div class="ttd-label">PIHAK KEDUA,</div>
      <div class="ttd-nama">${ba.pihak2?.nama || '-'}</div>
      <div class="ttd-nip">NIP. ${ba.pihak2?.nip || '-'}</div>
    </div>

    <!-- Kota + Pihak Pertama (kanan) -->
    <div>
      <div class="ttd-kota">Banda Aceh, ${tanggalTtd}</div>
      <div class="ttd-blok">
        <div class="ttd-label">PIHAK PERTAMA,</div>
        <div class="ttd-nama">${ba.pihak1?.nama || '-'}</div>
        <div class="ttd-nip">NIP. ${ba.pihak1?.nip || '-'}</div>
      </div>
    </div>
  </div>

  <!-- Saksi-saksi -->
  ${
    ba.saksi1 || ba.saksi2
      ? `
  <div class="saksi-wrapper">
    <div class="saksi-blok">
      ${ba.saksi1 ? `
        <div class="ttd-label">${ba.saksi2 ? '' : 'Saksi-saksi:'}</div>
        <div class="ttd-nama">${ba.saksi1.nama}</div>
        <div class="ttd-nip">NIP. ${ba.saksi1.nip}</div>
      ` : ''}
    </div>
    <div style="text-align:center; padding-top: 70px; font-size:11pt;">
      ${ba.saksi1 && ba.saksi2 ? 'Saksi-saksi:' : ''}
    </div>
    <div class="saksi-blok">
      ${ba.saksi2 ? `
        <div class="ttd-nama">${ba.saksi2.nama}</div>
        <div class="ttd-nip">NIP. ${ba.saksi2.nip}</div>
      ` : ''}
    </div>
  </div>`
      : ''
  }

</div><!-- end halaman 1 -->

<!-- ════════════════════════════════════════════════════════ -->
<!-- HALAMAN 2: LAMPIRAN DAFTAR KOLEKSI                      -->
<!-- ════════════════════════════════════════════════════════ -->
<div class="halaman">
  <div class="lampiran-judul">Lampiran Data Koleksi</div>
  <div class="sub-judul">Daftar Koleksi ${ba.items?.[0]?.koleksi?.jenis_koleksi || ''}</div>

  <table class="tabel-koleksi">
    <thead>
      <tr>
        <th style="width:40px">NO</th>
        <th style="width:110px">NO. INVENTARIS</th>
        <th>NAMA KOLEKSI</th>
        <th style="width:100px">JENIS KOLEKSI</th>
        <th style="width:130px">KONDISI</th>
      </tr>
    </thead>
    <tbody>
      ${buatBarisKoleksi(ba.items || [])}
    </tbody>
  </table>
</div><!-- end halaman 2 -->

</body>
</html>`;
}

module.exports = { generateBAHtml };