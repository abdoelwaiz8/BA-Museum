const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');
const responseHandler = require('../utils/responseHandler');

/** Buat JWT Token dengan payload id & role */
const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

/** Helper: hapus field sensitif sebelum dikirim ke client */
const sanitizeUser = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/auth/register */
exports.register = async (req, res) => {
  try {
    const { nama, username, password, role } = req.body;

    if (!nama || !username || !password) {
      return responseHandler.sendError(res, 400, 'Field nama, username, dan password wajib diisi.');
    }

    const userExists = await UserRepository.findByUsername(username);
    if (userExists) {
      return responseHandler.sendError(res, 409, 'Username sudah digunakan. Pilih username lain.');
    }

    const newUser = await UserRepository.createUser({ nama, username, password, role });
    const token   = signToken(newUser.id, newUser.role);

    return responseHandler.sendSuccess(res, 201, 'Registrasi berhasil.', {
      user:  sanitizeUser(newUser),
      token,
    });
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/auth/login */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return responseHandler.sendError(res, 400, 'Username dan password wajib diisi.');
    }

    const user = await UserRepository.verifyPassword(username, password);
    if (!user) {
      return responseHandler.sendError(res, 401, 'Username atau password salah.');
    }

    const token = signToken(user.id, user.role);

    return responseHandler.sendSuccess(res, 200, 'Login berhasil.', {
      user:  sanitizeUser(user),
      token,
    });
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/auth/me  (Membutuhkan token) */
exports.getMe = async (req, res) => {
  try {
    const user = await UserRepository.findById(req.user.id);
    if (!user) {
      return responseHandler.sendError(res, 404, 'User tidak ditemukan.');
    }
    return responseHandler.sendSuccess(res, 200, 'Data pengguna saat ini.', sanitizeUser(user));
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};