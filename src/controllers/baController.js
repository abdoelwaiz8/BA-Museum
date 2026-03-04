const BARepository    = require('../repositories/BARepository');
const responseHandler = require('../utils/responseHandler');
const { generateBAHtml } = require('../utils/baTemplate');
const { htmlToPdf }      = require('../utils/pdfGenerator');

const JENIS_BA_VALID = ['Pengembalian', 'Peminjaman', 'Serah Terima', 'Pengiriman'];

/** POST /api/berita-acara */
exports.create = async (req, res) => {
  try {
    const {
      nomor_surat, jenis_ba, tanggal_serah_terima,
      pihak_pertama_id, pihak_kedua_id,
      saksi1_id, saksi2_id, items,
    } = req.body;

    if (!nomor_surat || !jenis_ba || !tanggal_serah_terima || !pihak_pertama_id || !pihak_kedua_id) {
      return responseHandler.sendError(res, 400,
        'Field nomor_surat, jenis_ba, tanggal_serah_terima, pihak_pertama_id, dan pihak_kedua_id wajib diisi.');
    }

    if (!JENIS_BA_VALID.includes(jenis_ba)) {
      return responseHandler.sendError(res, 400,
        `jenis_ba tidak valid. Pilihan: ${JENIS_BA_VALID.join(', ')}.`);
    }

    // Items boleh kosong jika lampiran tidak diaktifkan
    const itemsArray = Array.isArray(items) ? items : [];

    for (const [index, item] of itemsArray.entries()) {
      if (!item.koleksi_id || !item.kondisi) {
        return responseHandler.sendError(res, 400,
          `Item ke-${index + 1} tidak lengkap. Wajib ada: koleksi_id dan kondisi.`);
      }
    }

    // FIXED: hapus 'dibuat_oleh' — kolom ini tidak ada di tabel berita_acara
    // Error sebelumnya: "Could not find the 'dibuat_oleh' column in the schema cache"
    const headerData = {
      nomor_surat, jenis_ba, tanggal_serah_terima,
      pihak_pertama_id, pihak_kedua_id,
      saksi1_id: saksi1_id || null,
      saksi2_id: saksi2_id || null,
    };

    const result = await BARepository.createBATransaction(headerData, itemsArray);
    return responseHandler.sendSuccess(res, 201, 'Berita Acara berhasil dibuat.', result);
  } catch (error) {
    console.error('[BA Create Error]', error.message);
    return responseHandler.sendError(res, 500, error.message);
  }
};

/** GET /api/berita-acara */
exports.getAll = async (req, res) => {
  try {
    const data = await BARepository.findAllWithStaff();
    return responseHandler.sendSuccess(res, 200, 'Daftar Berita Acara.', data);
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};

/** GET /api/berita-acara/:id */
exports.getDetail = async (req, res) => {
  try {
    const data = await BARepository.getFullDetail(req.params.id);
    if (!data) return responseHandler.sendError(res, 404, 'Berita Acara tidak ditemukan.');
    return responseHandler.sendSuccess(res, 200, 'Detail Berita Acara.', data);
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};

/** GET /api/berita-acara/:id/pdf */
exports.generatePdf = async (req, res) => {
  try {
    const baData = await BARepository.getFullDetail(req.params.id);
    if (!baData) return responseHandler.sendError(res, 404, 'Berita Acara tidak ditemukan.');

    const htmlContent = generateBAHtml(baData);
    const pdfBuffer   = await htmlToPdf(htmlContent);

    const namaFile = `BA_${baData.nomor_surat.replace(/\//g, '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${namaFile}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (error) {
    console.error('[BA PDF Error]', error.message);
    return responseHandler.sendError(res, 500, `Gagal generate PDF: ${error.message}`);
  }
};