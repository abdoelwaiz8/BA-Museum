const { supabaseAdmin } = require('../config/supabase');

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = supabaseAdmin;
  }

  async findById(id) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }

  async findAll(filters = {}) {
    let query = this.db.from(this.tableName).select('*');
    // Implementasi filter sederhana
    Object.keys(filters).forEach(key => {
      query = query.eq(key, filters[key]);
    });
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async create(data) {
    const { data: result, error } = await this.db
      .from(this.tableName)
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return result;
  }

  async update(id, data) {
    const { data: result, error } = await this.db
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result;
  }

  async delete(id) {
    const { error } = await this.db
      .from(this.tableName)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
}

module.exports = BaseRepository;