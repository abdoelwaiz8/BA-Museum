/**
 * Template PDF Form Perawatan (Lampiran BA)
 */

function isChecked(arr, val) {
  return (arr && arr.includes(val)) ? '☑' : '☐';
}

function generatePerawatanHtml(data) {
  const ba = data.berita_acara;
  const items = ba.items || [];
  
  // Hitung jumlah koleksi dan kumpulkan id koleksi
  const jumlahKoleksi = items.length;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Form Perawatan Lampiran BA</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        font-size: 11px;
        line-height: 1.4;
        margin: 20px;
        color: #000;
      }
      .header {
        text-align: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #000;
        padding-bottom: 10px;
      }
      .title {
        font-size: 14px;
        font-weight: bold;
      }
      .subtitle {
        font-size: 12px;
        margin-top: 5px;
      }
      .section-title {
        font-weight: bold;
        background: #f0f0f0;
        padding: 4px;
        margin-top: 15px;
        margin-bottom: 5px;
        border: 1px solid #000;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        margin-bottom: 5px;
      }
      .col {
        flex: 1;
        padding-right: 10px;
      }
      .col-half {
        flex: 0 0 50%;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 10px;
      }
      table, th, td {
        border: 1px solid #000;
      }
      th, td {
        padding: 4px;
        vertical-align: top;
      }
      .checkbox-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 5px;
      }
      .checkbox-grid.col-4 {
        grid-template-columns: repeat(4, 1fr);
      }
      .footer {
        margin-top: 30px;
        display: flex;
        justify-content: space-between;
      }
      .sign-box {
        text-align: center;
        width: 200px;
      }
      .sign-space {
        height: 60px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="title">FORM PERAWATAN KOLEKSI MUSEUM ACEH</div>
      <div class="subtitle">(Lampiran Berita Acara)</div>
    </div>

    <div style="text-align: right; font-weight: bold; margin-bottom: 15px;">
      Kode Perawatan: \${data.kode_perawatan}
    </div>

    <!-- SEKSI I -->
    <div class="section-title">SEKSI I — IDENTIFIKASI KOLEKSI</div>
    <table>
      <tr>
        <td width="30%"><strong>Nomor Berita Acara</strong></td>
        <td>\${ba.nomor_surat} (Tgl: \${new Date(ba.tanggal_serah_terima).toLocaleDateString('id-ID')})</td>
      </tr>
      <tr>
        <td><strong>Jumlah Koleksi</strong></td>
        <td>\${jumlahKoleksi} Item</td>
      </tr>
      <tr>
        <td><strong>Asal Koleksi</strong></td>
        <td>\${data.asal_koleksi || '-'}</td>
      </tr>
      <tr>
        <td><strong>Jenis Koleksi</strong></td>
        <td>\${data.jenis_bahan || '-'}</td>
      </tr>
      <tr>
        <td><strong>Klasifikasi Koleksi</strong></td>
        <td>\${data.klasifikasi_koleksi || '-'}</td>
      </tr>
    </table>

    <strong>Material Bahan:</strong>
    <div class="checkbox-grid col-4" style="margin-top: 5px; margin-bottom: 10px; border: 1px solid #000; padding: 5px;">
      <div>\${isChecked(data.material_bahan, 'Batu')} Batu</div>
      <div>\${isChecked(data.material_bahan, 'Kulit')} Kulit</div>
      <div>\${isChecked(data.material_bahan, 'Kayu')} Kayu</div>
      <div>\${isChecked(data.material_bahan, 'Rotan')} Rotan</div>
      <div>\${isChecked(data.material_bahan, 'Logam')} Logam</div>
      <div>\${isChecked(data.material_bahan, 'Kertas')} Kertas</div>
      <div>\${isChecked(data.material_bahan, 'Tekstil')} Tekstil</div>
      <div>\${isChecked(data.material_bahan, 'Keramik')} Keramik</div>
      <div>\${isChecked(data.material_bahan, 'Lainnya')} Lainnya</div>
    </div>

    <!-- SEKSI II -->
    <div class="section-title">SEKSI II — KONDISI KOLEKSI SAAT INI</div>
    <div class="row">
      <div class="col-half" style="border: 1px solid #000; padding: 5px; margin-right: 5px;">
        <strong>Kondisi Koleksi:</strong>
        <div class="checkbox-grid" style="grid-template-columns: repeat(2, 1fr); margin-top: 5px;">
          <div>\${isChecked(data.kondisi_koleksi, 'Polutan/debu')} Polutan/debu</div>
          <div>\${isChecked(data.kondisi_koleksi, 'Sompel')} Sompel</div>
          <div>\${isChecked(data.kondisi_koleksi, 'Jamur')} Jamur</div>
          <div>\${isChecked(data.kondisi_koleksi, 'Robek')} Robek</div>
          <div>\${isChecked(data.kondisi_koleksi, 'Lembab')} Lembab</div>
          <div>\${isChecked(data.kondisi_koleksi, 'Noda Kotoran')} Noda</div>
          <div>\${isChecked(data.kondisi_koleksi, 'Lapuk')} Lapuk</div>
          <div>\${isChecked(data.kondisi_koleksi, 'Bekas Perbaikan')} Perbaikan</div>
          <div>\${isChecked(data.kondisi_koleksi, 'Mengelupas')} Mengelupas</div>
          <div>\${isChecked(data.kondisi_koleksi, 'Pecah')} Pecah</div>
          <div>\${isChecked(data.kondisi_koleksi, 'Berubah Warna')} Berubah Warna</div>
          <div>\${isChecked(data.kondisi_koleksi, 'Retak')} Retak</div>
          <div>\${isChecked(data.kondisi_koleksi, 'Tergores')} Tergores</div>
          <div>\${isChecked(data.kondisi_koleksi, 'Patah')} Patah</div>
          <div>\${isChecked(data.kondisi_koleksi, 'Berlubang')} Berlubang</div>
          <div>\${isChecked(data.kondisi_koleksi, 'Karatan')} Karatan</div>
        </div>
      </div>
      <div class="col-half" style="border: 1px solid #000; padding: 5px;">
        <strong>Faktor Penyebab Kerusakan:</strong>
        <div class="checkbox-grid" style="grid-template-columns: repeat(2, 1fr); margin-top: 5px;">
          <div>\${isChecked(data.faktor_kerusakan, 'Cahaya')} Cahaya</div>
          <div>\${isChecked(data.faktor_kerusakan, 'Debu')} Debu</div>
          <div>\${isChecked(data.faktor_kerusakan, 'Suhu')} Suhu</div>
          <div>\${isChecked(data.faktor_kerusakan, 'Kelembaban')} Kelembaban</div>
          <div>\${isChecked(data.faktor_kerusakan, 'Bencana')} Bencana</div>
          <div>\${isChecked(data.faktor_kerusakan, 'Insect/serangga/hama')} Serangga</div>
          <div>\${isChecked(data.faktor_kerusakan, 'Disosiasi')} Disosiasi</div>
          <div>\${isChecked(data.faktor_kerusakan, 'Vandalisme/Tekanan')} Vandalisme</div>
        </div>
      </div>
    </div>

    <!-- SEKSI III -->
    <div class="section-title">SEKSI III — METODE KONSERVASI</div>
    <table>
      <tr>
        <td width="33%"><strong>Teknis Penanganan:</strong> <br>\${data.teknis_penanganan || '-'}</td>
        <td width="33%"><strong>Metode Perawatan:</strong> <br>\${data.metode_perawatan || '-'}</td>
        <td width="33%"><strong>Metode Bahan:</strong> <br>\${data.metode_bahan || '-'}</td>
      </tr>
    </table>

    <div class="row">
      <div class="col-half" style="border: 1px solid #000; padding: 5px; margin-right: 5px;">
        <strong>ALAT:</strong>
        <div class="checkbox-grid" style="grid-template-columns: repeat(2, 1fr); margin-top: 5px;">
          <div>\${isChecked(data.alat_digunakan, 'Kuas')} Kuas</div>
          <div>\${isChecked(data.alat_digunakan, 'Suntik')} Suntik</div>
          <div>\${isChecked(data.alat_digunakan, 'Pinset')} Pinset</div>
          <div>\${isChecked(data.alat_digunakan, 'Gunting')} Gunting</div>
          <div>\${isChecked(data.alat_digunakan, 'Spatula')} Spatula</div>
          <div>\${isChecked(data.alat_digunakan, 'Spons')} Spons</div>
          <div>\${isChecked(data.alat_digunakan, 'Scraple')} Scraple</div>
          <div>\${isChecked(data.alat_digunakan, 'Selang Air')} Selang Air</div>
          <div>\${isChecked(data.alat_digunakan, 'Sikat gigi')} Sikat gigi</div>
          <div>\${isChecked(data.alat_digunakan, 'Ember')} Ember</div>
          <div>\${isChecked(data.alat_digunakan, 'Sikat Plastik')} Sikat Plastik</div>
          <div>\${isChecked(data.alat_digunakan, 'Oven')} Oven</div>
          <div>\${isChecked(data.alat_digunakan, 'Beaker Glass')} Beaker Glass</div>
          <div>\${isChecked(data.alat_digunakan, 'Timbangan')} Timbangan</div>
          <div>\${isChecked(data.alat_digunakan, 'Pipet Tetes')} Pipet</div>
          <div>\${isChecked(data.alat_digunakan, 'Vacuum Cleaner')} Vacuum Cleaner</div>
          <div>\${isChecked(data.alat_digunakan, 'Jarum Pentul')} Jarum Pentul</div>
          <div>\${isChecked(data.alat_digunakan, 'Wadah Stanliesh')} Wadah Stanliesh</div>
          <div>\${isChecked(data.alat_digunakan, 'Jarum Jahit')} Jarum Jahit</div>
          <div>\${isChecked(data.alat_digunakan, 'Alat Penumbuk')} Alat Penumbuk</div>
        </div>
      </div>
      <div class="col-half" style="border: 1px solid #000; padding: 5px;">
        <strong>BAHAN:</strong>
        <div class="checkbox-grid" style="grid-template-columns: repeat(2, 1fr); margin-top: 5px;">
          <div>\${isChecked(data.bahan_digunakan, 'Typol')} Typol</div>
          <div>\${isChecked(data.bahan_digunakan, 'Naftalena')} Naftalena</div>
          <div>\${isChecked(data.bahan_digunakan, 'Citrit Acid')} Citrit Acid</div>
          <div>\${isChecked(data.bahan_digunakan, 'Kain/serbet')} Kain/serbet</div>
          <div>\${isChecked(data.bahan_digunakan, 'Aquades')} Aquades</div>
          <div>\${isChecked(data.bahan_digunakan, 'Kain Kasa')} Kain Kasa</div>
          <div>\${isChecked(data.bahan_digunakan, 'Alkohol')} Alkohol</div>
          <div>\${isChecked(data.bahan_digunakan, 'Benang')} Benang</div>
          <div>\${isChecked(data.bahan_digunakan, 'Parafin')} Parafin</div>
          <div>\${isChecked(data.bahan_digunakan, 'Karet Penghapus')} Penghapus</div>
          <div>\${isChecked(data.bahan_digunakan, 'Sabun cuci')} Sabun cuci</div>
          <div>\${isChecked(data.bahan_digunakan, 'Sabun Antiseptik')} Antiseptik</div>
          <div>\${isChecked(data.bahan_digunakan, 'Lem')} Lem</div>
          <div>\${isChecked(data.bahan_digunakan, 'Tali')} Tali</div>
          <div>\${isChecked(data.bahan_digunakan, 'Kapas')} Kapas</div>
        </div>
      </div>
    </div>

    <!-- SEKSI IV -->
    <div class="section-title">SEKSI PENGAMANAN KOLEKSI</div>
    <div class="row">
      <div class="col-half" style="border: 1px solid #000; padding: 5px; margin-right: 5px;">
        <strong>Bahan Pembungkus:</strong>
        <div class="checkbox-grid" style="grid-template-columns: repeat(2, 1fr); margin-top: 5px;">
          <div>\${isChecked(data.bahan_pembungkus, 'Amplop')} Amplop</div>
          <div>\${isChecked(data.bahan_pembungkus, 'Kertas Bebas asam')} Kertas Bebas asam</div>
          <div>\${isChecked(data.bahan_pembungkus, 'Box File')} Box File</div>
          <div>\${isChecked(data.bahan_pembungkus, 'Kain kerah/staplek')} Kain kerah</div>
          <div>\${isChecked(data.bahan_pembungkus, 'Busa Lapis')} Busa Lapis</div>
          <div>\${isChecked(data.bahan_pembungkus, 'Kain Belacu')} Kain Belacu</div>
          <div>\${isChecked(data.bahan_pembungkus, 'Busa Polyfoam')} Busa Polyfoam</div>
          <div>\${isChecked(data.bahan_pembungkus, 'Kertas Wrab')} Kertas Wrab</div>
        </div>
      </div>
      <div class="col-half" style="border: 1px solid #000; padding: 5px;">
        <strong>Bahan Pengawet:</strong>
        <div class="checkbox-grid" style="grid-template-columns: repeat(2, 1fr); margin-top: 5px;">
          <div>\${isChecked(data.bahan_pengawet, 'Cengkeh')} Cengkeh</div>
          <div>\${isChecked(data.bahan_pengawet, 'Cilica-gel')} Cilica-gel</div>
          <div>\${isChecked(data.bahan_pengawet, 'Lada hitam')} Lada hitam</div>
          <div>\${isChecked(data.bahan_pengawet, 'Kapur Barus')} Kapur Barus</div>
          <div>\${isChecked(data.bahan_pengawet, 'Tembakau')} Tembakau</div>
        </div>
      </div>
    </div>

    <!-- TTD -->
    <div class="footer">
      <div class="sign-box">
        <div>Pendataan,</div>
        <div class="sign-space"></div>
        <div><strong>\${data.pendataan || '_____________________'}</strong></div>
      </div>
      <div class="sign-box">
        <div>Banda Aceh, \${new Date().toLocaleDateString('id-ID')}</div>
        <div>Petugas Konservasi,</div>
        <div class="sign-space"></div>
        <div><strong>\${data.petugas_konservasi || '_____________________'}</strong></div>
      </div>
    </div>
  </body>
  </html>
  `;
}

module.exports = { generatePerawatanHtml };
