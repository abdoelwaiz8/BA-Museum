const PerawatanRepository = require('../repositories/PerawatanRepository');
const BARepository = require('../repositories/BARepository');
const responseHandler = require('../utils/responseHandler');
const { generatePerawatanHtml } = require('../utils/perawatanTemplate');
const { htmlToPdf } = require('../utils/pdfGenerator');

/** GET /api/perawatan/ba-available */
exports.getAvailableBA = async (req, res) => {
  try {
    const data = await PerawatanRepository.getAvailableBA();
    return responseHandler.sendSuccess(res, 200, 'Daftar BA yang tersedia', data);
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};

/** POST /api/perawatan */
exports.create = async (req, res) => {
  try {
    const payload = req.body;
    
    if (!payload.mode || !['individu', 'lampiran'].includes(payload.mode)) {
      return responseHandler.sendError(res, 400, 'Mode tidak valid (harus individu atau lampiran)');
    }

    if (payload.mode === 'individu' && !payload.koleksi_id) {
      return responseHandler.sendError(res, 400, 'Koleksi wajib dipilih untuk mode individu');
    }

    if (payload.mode === 'lampiran' && !payload.ba_id) {
      return responseHandler.sendError(res, 400, 'Berita Acara wajib dipilih untuk mode lampiran');
    }

    if (!payload.tanggal_perawatan) {
      return responseHandler.sendError(res, 400, 'Tanggal perawatan wajib diisi');
    }

    const petugasId = req.user?.id || null; 

    const result = await PerawatanRepository.createPerawatan(payload, petugasId);
    return responseHandler.sendSuccess(res, 201, 'Perawatan berhasil ditambahkan', result);
  } catch (error) {
    console.error('[Perawatan Create Error]', error.message);
    return responseHandler.sendError(res, 500, error.message);
  }
};

/** GET /api/perawatan */
exports.getAll = async (req, res) => {
  try {
    const data = await PerawatanRepository.findAllForms();
    return responseHandler.sendSuccess(res, 200, 'Daftar Form Perawatan', data);
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};

/** GET /api/perawatan/:id */
exports.getDetail = async (req, res) => {
  try {
    const data = await PerawatanRepository.getFullDetail(req.params.id);
    if (!data) return responseHandler.sendError(res, 404, 'Form tidak ditemukan.');
    return responseHandler.sendSuccess(res, 200, 'Detail Form Perawatan', data);
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};

/** DELETE /api/perawatan/:id */
exports.remove = async (req, res) => {
  try {
    const deleted = await PerawatanRepository.delete(req.params.id);
    if (!deleted) return responseHandler.sendError(res, 404, 'Form tidak ditemukan.');
    return responseHandler.sendSuccess(res, 200, 'Form Perawatan berhasil dihapus.');
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};

/** GET /api/perawatan/:id/pdf */
exports.generatePdf = async (req, res) => {
  try {
    const formData = await PerawatanRepository.getFullDetail(req.params.id);
    if (!formData) return responseHandler.sendError(res, 404, 'Form Perawatan tidak ditemukan.');

    const htmlContent = generatePerawatanHtml(formData);
    const pdfBuffer = await htmlToPdf(htmlContent);

    const namaFile = `Form_Perawatan_${formData.kode_perawatan.replace(/\//g, '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${namaFile}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (error) {
    console.error('[Perawatan PDF Error]', error.message);
    return responseHandler.sendError(res, 500, `Gagal generate PDF: ${error.message}`);
  }
};
