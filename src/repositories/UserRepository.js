const bcrypt = require('bcryptjs');
const BaseRepository = require('./BaseRepository');

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  /**
   * Cari user berdasarkan username
   * @param {string} username
   */
  async findByUsername(username) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('username', username)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Buat user baru dengan password di-hash
   * @param {Object} userData - { nama, username, password, role }
   */
  async createUser(userData) {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    return super.create({
      nama:     userData.nama,
      username: userData.username,
      password: hashedPassword,
      role:     userData.role || 'petugas',
    });
  }

  /**
   * Verifikasi password login. Return user jika cocok, null jika tidak.
   * @param {string} username
   * @param {string} plainPassword
   */
  async verifyPassword(username, plainPassword) {
    const user = await this.findByUsername(username);
    if (!user) return null;

    const isMatch = await bcrypt.compare(plainPassword, user.password);
    if (!isMatch) return null;

    return user;
  }
}

module.exports = new UserRepository();