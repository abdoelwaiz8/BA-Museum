const KoleksiRepository = require('../repositories/KoleksiRepository');
const responseHandler   = require('../utils/responseHandler');

// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/koleksi
 *  Query: ?jenis_koleksi=Etnografika&kondisi_terkini=Baik&q=baju&page=1&limit=20
 */
exports.getAll = async (req, res) => {
  try {
    const result = await KoleksiRepository.findAllWithFilters(req.query);
    return responseHandler.sendSuccess(res, 200, 'Daftar koleksi museum.', result);
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/koleksi/:id */
exports.getById = async (req, res) => {
  try {
    const koleksi = await KoleksiRepository.findById(req.params.id);
    if (!koleksi) return responseHandler.sendError(res, 404, 'Koleksi tidak ditemukan.');
    return responseHandler.sendSuccess(res, 200, 'Detail koleksi.', koleksi);
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/koleksi
 *
 *  Atribut sesuai Lampiran Data Koleksi pada dokumen BA:
 *  no_inventaris | nama_koleksi | jenis_koleksi | kondisi_terkini | lokasi_terkini (opsional)
 */
exports.create = async (req, res) => {
  try {
    const {
      no_inventaris,
      nama_koleksi,
      jenis_koleksi,
      kondisi_terkini,
      lokasi_terkini,
    } = req.body;

    if (!no_inventaris || !nama_koleksi) {
      return responseHandler.sendError(
        res, 400,
        'Field no_inventaris dan nama_koleksi wajib diisi.'
      );
    }

    const isDuplicate = await KoleksiRepository.isNoInventarisTaken(no_inventaris);
    if (isDuplicate) {
      return responseHandler.sendError(
        res, 409,
        `No. inventaris '${no_inventaris}' sudah digunakan.`
      );
    }

    const koleksi = await KoleksiRepository.create({
      no_inventaris,
      nama_koleksi,
      jenis_koleksi:   jenis_koleksi   || null,
      kondisi_terkini: kondisi_terkini || 'Baik',
      lokasi_terkini:  lokasi_terkini  || null,
    });

    return responseHandler.sendSuccess(res, 201, 'Koleksi berhasil ditambahkan.', koleksi);
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/** PUT /api/koleksi/:id */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await KoleksiRepository.findById(id);
    if (!existing) return responseHandler.sendError(res, 404, 'Koleksi tidak ditemukan.');

    if (req.body.no_inventaris) {
      const isDuplicate = await KoleksiRepository.isNoInventarisTaken(req.body.no_inventaris, id);
      if (isDuplicate) {
        return responseHandler.sendError(
          res, 409,
          `No. inventaris '${req.body.no_inventaris}' sudah digunakan koleksi lain.`
        );
      }
    }

    // Field yang boleh diupdate
    const allowedFields = [
      'no_inventaris',
      'nama_koleksi',
      'jenis_koleksi',
      'kondisi_terkini',
      'lokasi_terkini',
    ];
    const payload = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) payload[field] = req.body[field];
    });

    const updated = await KoleksiRepository.update(id, payload);
    return responseHandler.sendSuccess(res, 200, 'Koleksi berhasil diperbarui.', updated);
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/** DELETE /api/koleksi/:id */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await KoleksiRepository.findById(id);
    if (!existing) return responseHandler.sendError(res, 404, 'Koleksi tidak ditemukan.');

    await KoleksiRepository.delete(id);
    return responseHandler.sendSuccess(
      res, 200,
      `Koleksi '${existing.nama_koleksi}' berhasil dihapus.`,
      null
    );
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};