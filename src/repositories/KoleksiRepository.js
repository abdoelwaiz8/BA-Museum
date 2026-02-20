const BaseRepository = require('./BaseRepository');

class KoleksiRepository extends BaseRepository {
  constructor() {
    super('koleksi');
  }

  /**
   * Ambil semua koleksi dengan filter dinamis dari query params.
   * Sesuai lampiran BA: no_inventaris, nama_koleksi, jenis_koleksi, kondisi_terkini
   *
   * Contoh: ?jenis_koleksi=Etnografika&kondisi_terkini=Baik&q=baju&page=1&limit=20
   * @param {Object} queryParams - req.query dari Express
   */
  async findAllWithFilters(queryParams) {
    const {
      jenis_koleksi,
      kondisi_terkini,
      lokasi_terkini,
      q,
      page      = 1,
      limit     = 20,
      sort_by   = 'no_inventaris',
      sort_order = 'asc',
    } = queryParams;

    const filters = {};
    if (jenis_koleksi)   filters.jenis_koleksi   = jenis_koleksi;
    if (kondisi_terkini) filters.kondisi_terkini = kondisi_terkini;
    if (lokasi_terkini)  filters.lokasi_terkini  = lokasi_terkini;

    return this.findAll(filters, {
      orderBy:       sort_by,
      ascending:     sort_order === 'asc',
      page,
      limit,
      searchColumn:  q ? 'nama_koleksi' : null,
      searchValue:   q || null,
    });
  }

  /**
   * Cek apakah no_inventaris sudah dipakai (validasi unik)
   * @param {string}      noInventaris
   * @param {string|null} excludeId - dikecualikan saat update
   */
  async isNoInventarisTaken(noInventaris, excludeId = null) {
    let query = this.db
      .from(this.tableName)
      .select('id')
      .eq('no_inventaris', noInventaris);

    if (excludeId) query = query.neq('id', excludeId);

    const { data } = await query.single();
    return !!data;
  }
}

module.exports = new KoleksiRepository();