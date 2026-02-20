const jwt = require('jsonwebtoken');
const responseHandler = require('../utils/responseHandler');

/**
 * Middleware: Verifikasi JWT Token dari header Authorization.
 * Token harus dikirim dalam format: "Bearer <token>"
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return responseHandler.sendError(res, 401, 'Akses ditolak. Token tidak ditemukan.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError'
        ? 'Sesi telah berakhir. Silakan login kembali.'
        : 'Token tidak valid.';
    return responseHandler.sendError(res, 401, message);
  }
};

/**
 * Middleware Factory: Batasi akses berdasarkan role.
 * Contoh penggunaan: allowedRoles('admin', 'kepala_museum')
 *
 * @param  {...string} roles - Role yang diizinkan
 */
const allowedRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return responseHandler.sendError(res, 401, 'Tidak terautentikasi.');
    }
    if (!roles.includes(req.user.role)) {
      return responseHandler.sendError(
        res,
        403,
        `Akses ditolak. Role '${req.user.role}' tidak memiliki izin untuk aksi ini.`
      );
    }
    next();
  };
};

module.exports = { protect, allowedRoles };