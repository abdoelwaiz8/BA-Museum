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
      keperluan,
      pihak_pertama_id, pihak_pertama_ext,
      pihak_kedua_id,   pihak_kedua_ext,
      saksi1_id,
      saksi2_id,        saksi2_ext,
      items,
    } = req.body;

    // ── Validasi field wajib ────────────────────────────────────
    if (!nomor_surat || !jenis_ba || !tanggal_serah_terima) {
      return responseHandler.sendError(res, 400,
        'Field nomor_surat, jenis_ba, dan tanggal_serah_terima wajib diisi.');
    }

    // Pihak Pertama: internal (id) atau eksternal (ext)
    const p1HasInternal = !!pihak_pertama_id;
    const p1HasExternal = pihak_pertama_ext && pihak_pertama_ext.nama;
    if (!p1HasInternal && !p1HasExternal) {
      return responseHandler.sendError(res, 400,
        'Pihak Pertama wajib diisi — pilih dari daftar staff atau isi data eksternal.');
    }

    // Pihak Kedua: harus ada salah satu
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
      keperluan: keperluan || 'Konservasi',
      pihak_pertama_id:  p1HasInternal ? pihak_pertama_id : null,
      pihak_kedua_id:    p2HasInternal ? pihak_kedua_id : null,
      saksi1_id:         saksi1_id || null,
      saksi2_id:         (saksi2_id && !saksi2_ext) ? saksi2_id : null,
    };

    if (p1HasExternal) headerData.pihak_pertama_ext = JSON.stringify(pihak_pertama_ext);
    if (p2HasExternal) headerData.pihak_kedua_ext = JSON.stringify(pihak_kedua_ext);
    if (saksi2_ext?.nama) headerData.saksi2_ext = JSON.stringify(saksi2_ext);

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

    // Urutkan item berdasarkan no_inventaris dari kecil ke besar khusus untuk PDF
    if (baData.items && baData.items.length > 0) {
      baData.items.sort((a, b) => {
        const noA = a.koleksi?.no_inventaris || '';
        const noB = b.koleksi?.no_inventaris || '';
        return noA.localeCompare(noB, undefined, { numeric: true, sensitivity: 'base' });
      });
    }

    // tampilkan_kondisi: default aktif (1/true), kirim ?tampilkan_kondisi=0 untuk nonaktifkan
    const tampilkanKondisi = req.query.tampilkan_kondisi !== '0';
    const htmlContent = generateBAHtml(baData, { tampilkanKondisi });
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

/** PUT /api/berita-acara/:id/status-kembali */
exports.statusKembali = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return responseHandler.sendError(res, 400, 'ID Berita Acara wajib disertakan.');

    const result = await BARepository.updateStatusKembali(id);
    return responseHandler.sendSuccess(res, 200, 'Status pengembalian berhasil diupdate.', result);
  } catch (error) {
    console.error('[BA Status Kembali Error]', error.message);
    return responseHandler.sendError(res, 500, error.message);
  }
};

/** GET /api/berita-acara/stats/penyerahan-per-bulan */
exports.getStatsPenyerahanPerBulan = async (req, res) => {
  try {
    const data = await BARepository.getPenyerahanStatsPerMonth();
    return responseHandler.sendSuccess(res, 200, 'Statistik koleksi BA Penyerahan per bulan.', data);
  } catch (error) {
    console.error('[BA Stats Error]', error.message);
    return responseHandler.sendError(res, 500, `Gagal memuat statistik BA: ${error.message}`);
  }
};