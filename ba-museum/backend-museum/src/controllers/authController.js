const UserRepository = require('../repositories/UserRepository');
const jwt = require('jsonwebtoken');
const responseHandler = require('../utils/responseHandler'); // Pakai util dari Signatul

const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

exports.register = async (req, res) => {
  try {
    const { nama, username, password, role } = req.body;

    if (!nama || !username || !password) {
      return responseHandler.sendError(res, 400, 'Data tidak lengkap');
    }

    const existingUser = await UserRepository.findByUsername(username);
    if (existingUser) {
      return responseHandler.sendError(res, 400, 'Username sudah digunakan');
    }

    const newUser = await UserRepository.createUser({ nama, username, password, role });
    const token = signToken(newUser.id, newUser.role);

    return responseHandler.sendSuccess(res, 201, 'Registrasi berhasil', { user: newUser, token });
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await UserRepository.verifyPassword(username, password);
    if (!user) {
      return responseHandler.sendError(res, 401, 'Username atau password salah');
    }

    const token = signToken(user.id, user.role);
    // Hapus password dari response
    delete user.password;

    return responseHandler.sendSuccess(res, 200, 'Login berhasil', { user, token });
  } catch (error) {
    return responseHandler.sendError(res, 500, error.message);
  }
};