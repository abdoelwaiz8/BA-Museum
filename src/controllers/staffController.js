const StaffRepository = require('../repositories/staffRepository');
const responseHandler = require('../utils/responseHandler');

// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/staff */
exports.getAll = async (req, res) => {
  try {
    const result = await StaffRepository.findAllWithFilters(req.query);
    return responseHandler.sendSuccess(res, 200, 'Daftar data staff.', result);
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/staff/:id */
exports.getById = async (req, res) => {
  try {
    const staff = await StaffRepository.findById(req.params.id);
    if (!staff) return responseHandler.sendError(res, 404, 'Staff tidak ditemukan.');
    return responseHandler.sendSuccess(res, 200, 'Detail staff.', staff);
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/staff */
exports.create = async (req, res) => {
  try {
    const { nama, nip, jabatan, alamat } = req.body;

    if (!nama || !nip || !jabatan) {
      return responseHandler.sendError(res, 400, 'Field nama, nip, dan jabatan wajib diisi.');
    }

    // Cek duplikat NIP
    const existing = await StaffRepository.findByNip(nip);
    if (existing) {
      return responseHandler.sendError(res, 409, `NIP '${nip}' sudah terdaftar.`);
    }

    const staff = await StaffRepository.create({
      nama,
      nip,
      jabatan,
      alamat: alamat || 'Museum Aceh',
    });

    return responseHandler.sendSuccess(res, 201, 'Data staff berhasil ditambahkan.', staff);
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/** PUT /api/staff/:id */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await StaffRepository.findById(id);
    if (!existing) return responseHandler.sendError(res, 404, 'Staff tidak ditemukan.');

    // Cek duplikat NIP jika diubah
    if (req.body.nip && req.body.nip !== existing.nip) {
      const nipTaken = await StaffRepository.findByNip(req.body.nip);
      if (nipTaken) {
        return responseHandler.sendError(res, 409, `NIP '${req.body.nip}' sudah digunakan staff lain.`);
      }
    }

    const allowedFields = ['nama', 'nip', 'jabatan', 'alamat'];
    const payload = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) payload[field] = req.body[field];
    });

    const updated = await StaffRepository.update(id, payload);
    return responseHandler.sendSuccess(res, 200, 'Data staff berhasil diperbarui.', updated);
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/** DELETE /api/staff/:id */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await StaffRepository.findById(id);
    if (!existing) return responseHandler.sendError(res, 404, 'Staff tidak ditemukan.');

    await StaffRepository.delete(id);
    return responseHandler.sendSuccess(res, 200, `Staff '${existing.nama}' berhasil dihapus.`, null);
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};