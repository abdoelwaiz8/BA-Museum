const BaseRepository = require('./BaseRepository');

class StaffRepository extends BaseRepository {
  constructor() {
    super('staff');
  }

  async findByNip(nip) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('nip', nip)
      .single();

    if (error) return null;
    return data;
  }

  async findAllWithFilters(queryParams) {
    const { jabatan, q, page = 1, limit = 50 } = queryParams;

    const filters = {};
    if (jabatan) filters.jabatan = jabatan;

    return this.findAll(filters, {
      searchColumn: q ? 'nama' : null,
      searchValue:  q || null,
      page,
      limit,
    });
  }
}

module.exports = new StaffRepository();