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
    const {
      kode_perawatan,
      ba_id,
      asal_koleksi,
      jenis_bahan,
      klasifikasi_koleksi,
      material_bahan,
      kondisi_koleksi,
      faktor_kerusakan,
      teknis_penanganan,
      metode_perawatan,
      metode_bahan,
      alat_digunakan,
      bahan_digunakan,
      bahan_pembungkus,
      bahan_pengawet,
      petugas_konservasi,
      pendataan
    } = req.body;

    if (!kode_perawatan || !ba_id) {
      return responseHandler.sendError(res, 400, 'kode_perawatan dan ba_id wajib diisi.');
    }

    const payload = {
      kode_perawatan,
      ba_id,
      asal_koleksi,
      jenis_bahan,
      klasifikasi_koleksi,
      material_bahan: Array.isArray(material_bahan) ? material_bahan : [],
      kondisi_koleksi: Array.isArray(kondisi_koleksi) ? kondisi_koleksi : [],
      faktor_kerusakan: Array.isArray(faktor_kerusakan) ? faktor_kerusakan : [],
      teknis_penanganan,
      metode_perawatan,
      metode_bahan,
      alat_digunakan: Array.isArray(alat_digunakan) ? alat_digunakan : [],
      bahan_digunakan: Array.isArray(bahan_digunakan) ? bahan_digunakan : [],
      bahan_pembungkus: Array.isArray(bahan_pembungkus) ? bahan_pembungkus : [],
      bahan_pengawet: Array.isArray(bahan_pengawet) ? bahan_pengawet : [],
      petugas_konservasi,
      pendataan
    };

    const result = await PerawatanRepository.createFormPerawatan(payload);
    return responseHandler.sendSuccess(res, 201, 'Form Perawatan berhasil dibuat.', result);
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
