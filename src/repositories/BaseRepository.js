const { supabaseAdmin } = require('../config/supabase');

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = supabaseAdmin;
  }

  /**
   * Ambil satu data berdasarkan ID
   * @param {string|number} id
   */
  async findById(id) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Ambil semua data dengan filter dinamis dan opsi ordering/pagination
   * @param {Object} filters      - Key-value filter exact match (e.g. { kondisi_terkini: 'Baik' })
   * @param {Object} options      - Opsi tambahan: { orderBy, ascending, page, limit, searchColumn, searchValue }
   */
  async findAll(filters = {}, options = {}) {
    const {
      orderBy = 'created_at',
      ascending = false,
      page = 1,
      limit = 50,
      searchColumn = null,
      searchValue = null,
    } = options;

    let query = this.db.from(this.tableName).select('*', { count: 'exact' });

    // Terapkan filter exact match
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value);
      }
    });

    // Terapkan pencarian teks parsial (ilike)
    if (searchColumn && searchValue) {
      query = query.ilike(searchColumn, `%${searchValue}%`);
    }

    // Ordering
    query = query.order(orderBy, { ascending });

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data,
      meta: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Buat data baru
   * @param {Object} payload
   */
  async create(payload) {
    const { data, error } = await this.db
      .from(this.tableName)
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update data berdasarkan ID
   * @param {string|number} id
   * @param {Object} payload
   */
  async update(id, payload) {
    const { data, error } = await this.db
      .from(this.tableName)
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Hapus data berdasarkan ID
   * @param {string|number} id
   */
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