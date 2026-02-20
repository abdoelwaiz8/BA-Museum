const BARepository    = require('../repositories/BARepository');
const responseHandler = require('../utils/responseHandler');
const { generateBAHtml } = require('../utils/baTemplate');
const { htmlToPdf }      = require('../utils/pdfGenerator');

// Jenis Berita Acara yang valid
const JENIS_BA_VALID = ['Pengembalian', 'Peminjaman', 'Serah Terima', 'Pengiriman'];

// ─────────────────────────────────────────────────────────────────────────────

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

    if (!Array.isArray(items) || items.length === 0) {
      return responseHandler.sendError(res, 400, 'Minimal harus ada 1 koleksi dalam Berita Acara.');
    }

    for (const [index, item] of items.entries()) {
      if (!item.koleksi_id || !item.kondisi) {
        return responseHandler.sendError(res, 400,
          `Item ke-${index + 1} tidak lengkap. Wajib ada: koleksi_id dan kondisi.`);
      }
    }

    const headerData = {
      nomor_surat, jenis_ba, tanggal_serah_terima,
      pihak_pertama_id, pihak_kedua_id,
      saksi1_id:   saksi1_id   || null,
      saksi2_id:   saksi2_id   || null,
      dibuat_oleh: req.user?.id || null,
    };

    const result = await BARepository.createBATransaction(headerData, items);
    return responseHandler.sendSuccess(res, 201, 'Berita Acara berhasil dibuat.', result);

  } catch (error) {
    console.error('[BA Create Error]', error.message);
    return responseHandler.sendError(res, 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/berita-acara */
exports.getAll = async (req, res) => {
  try {
    const data = await BARepository.findAllWithStaff();
    return responseHandler.sendSuccess(res, 200, 'Daftar Berita Acara.', data);
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/berita-acara/:id/pdf
 * Generate dan kirim file PDF Berita Acara langsung ke client.
 * Format output persis seperti dokumen resmi Museum Aceh.
 */
exports.generatePdf = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Ambil data lengkap BA dari database
    const baData = await BARepository.getFullDetail(id);
    if (!baData) {
      return responseHandler.sendError(res, 404, 'Berita Acara tidak ditemukan.');
    }

    // 2. Render HTML dari template
    const htmlContent = generateBAHtml(baData);

    // 3. Konversi HTML ke PDF
    const pdfBuffer = await htmlToPdf(htmlContent);

    // 4. Kirim sebagai file download
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