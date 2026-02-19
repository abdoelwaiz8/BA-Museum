const BARepository = require('../repositories/BARepository');
const responseHandler = require('../utils/responseHandler');

class BAController {
  
  // Membuat Berita Acara Baru
  async create(req, res) {
    try {
      const { 
        nomor_surat,
        tanggal_serah_terima, 
        pihak_pertama_id, 
        pihak_kedua_id, 
        mengetahui_id, 
        items 
      } = req.body;

      // Validasi Basic
      if (!items || items.length === 0) {
        return responseHandler.sendError(res, 400, 'Minimal harus ada 1 barang koleksi');
      }

      const headerData = {
        nomor_surat,
        tanggal_serah_terima,
        pihak_pertama_id,
        pihak_kedua_id,
        mengetahui_id
      };

      const result = await BARepository.createBATransaction(headerData, items);
      
      return responseHandler.sendSuccess(res, 201, 'Berita Acara berhasil dibuat', result);
    } catch (error) {
      console.error('Create BA Error:', error);
      return responseHandler.sendError(res, 500, error.message);
    }
  }

  // Mengambil Semua BA (Untuk List di Dashboard)
  async getAll(req, res) {
    try {
      const data = await BARepository.findAll({}, { order: [['created_at', 'DESC']] });
      return responseHandler.sendSuccess(res, 200, 'Data Berita Acara', data);
    } catch (error) {
      return responseHandler.sendError(res, 500, error.message);
    }
  }

  // Mengambil Detail BA (Untuk Preview PDF)
  async getDetail(req, res) {
    try {
      const { id } = req.params;
      const data = await BARepository.getFullDetail(id);
      
      if (!data) return responseHandler.sendError(res, 404, 'Berita Acara tidak ditemukan');
      
      return responseHandler.sendSuccess(res, 200, 'Detail Berita Acara', data);
    } catch (error) {
      return responseHandler.sendError(res, 500, error.message);
    }
  }
}

module.exports = new BAController();