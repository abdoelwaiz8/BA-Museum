const BARepository    = require('../repositories/BARepository');
const responseHandler = require('../utils/responseHandler');
const { generateBAHtml } = require('../utils/baTemplate');
const { htmlToPdf }      = require('../utils/pdfGenerator');

const JENIS_BA_VALID = ['Penyerahan', 'Pengembalian'];

/** POST /api/berita-acara */
exports.create = async (req, res) => {
  try {
    const {
      nomor_surat, jenis_ba, tanggal_serah_terima,
      pihak_pertama_id,
      pihak_kedua_id,   pihak_kedua_ext,   // salah satu wajib ada
      saksi1_id,
      saksi2_id,        saksi2_ext,         // opsional, salah satu
      items,
    } = req.body;

    // ── Validasi field wajib ────────────────────────────────────
    if (!nomor_surat || !jenis_ba || !tanggal_serah_terima || !pihak_pertama_id) {
      return responseHandler.sendError(res, 400,
        'Field nomor_surat, jenis_ba, tanggal_serah_terima, dan pihak_pertama_id wajib diisi.');
    }

    // Pihak Kedua: harus ada salah satu (internal ID atau data eksternal)
    const p2HasInternal = !!pihak_kedua_id;
    const p2HasExternal = pihak_kedua_ext && pihak_kedua_ext.nama;
    if (!p2HasInternal && !p2HasExternal) {
      return responseHandler.sendError(res, 400,
        'Pihak Kedua wajib diisi — pilih dari daftar staff atau isi data eksternal.');
    }

    if (!JENIS_BA_VALID.includes(jenis_ba)) {
      return responseHandler.sendError(res, 400,
        `jenis_ba tidak valid. Pilihan: ${JENIS_BA_VALID.join(', ')}.`);
    }

    // ── Validasi items ──────────────────────────────────────────
    const itemsArray = Array.isArray(items) ? items : [];
    for (const [index, item] of itemsArray.entries()) {
      if (!item.koleksi_id || !item.kondisi) {
        return responseHandler.sendError(res, 400,
          `Item ke-${index + 1} tidak lengkap. Wajib ada: koleksi_id dan kondisi.`);
      }
    }

    // ── Bangun header BA ────────────────────────────────────────
    const headerData = {
      nomor_surat,
      jenis_ba,
      tanggal_serah_terima,
      pihak_pertama_id,
      // Simpan sebagai JSON jika eksternal
      pihak_kedua_id:    p2HasInternal ? pihak_kedua_id : null,
      pihak_kedua_ext:   p2HasExternal ? JSON.stringify(pihak_kedua_ext) : null,
      saksi1_id:         saksi1_id || null,
      saksi2_id:         (saksi2_id && !saksi2_ext) ? saksi2_id : null,
      saksi2_ext:        saksi2_ext?.nama ? JSON.stringify(saksi2_ext) : null,
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

/** DELETE /api/berita-acara/:id */
exports.remove = async (req, res) => {
  try {
    await BARepository.deleteBA(req.params.id);
    return responseHandler.sendSuccess(res, 200, 'Berita Acara berhasil dihapus.');
  } catch (error) {
    console.error('[BA Delete Error]', error.message);
    return responseHandler.sendError(res, 500, `Gagal menghapus BA: ${error.message}`);
  }
};
