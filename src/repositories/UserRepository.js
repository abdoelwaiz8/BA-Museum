const BaseRepository = require('./BaseRepository');
const bcrypt = require('bcryptjs');

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByUsername(username) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('username', username)
      .single();
    if (error) return null;
    return data;
  }

  async createUser(userData) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    return super.create({
      nama: userData.nama,
      username: userData.username,
      password: hashedPassword,
      role: userData.role || 'user'
    });
  }

  async verifyPassword(username, password) {
    const user = await this.findByUsername(username);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return user;
  }
}

module.exports = new UserRepository();