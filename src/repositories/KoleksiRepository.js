const BaseRepository = require('./BaseRepository');

class KoleksiRepository extends BaseRepository {
  constructor() {
    super('koleksi');
  }

  async findAllWithFilters(queryParams) {
    const {
      jenis_koleksi,
      kondisi_terkini,
      lokasi_terkini,
      q,
      page       = 1,
      limit      = 20,
      sort_by    = 'no_inventaris',
      sort_order = 'asc',
    } = queryParams;

    let query = this.db
      .from(this.tableName)
      .select('*', { count: 'exact' });

    if (jenis_koleksi)   query = query.eq('jenis_koleksi', jenis_koleksi);
    if (kondisi_terkini) query = query.eq('kondisi_terkini', kondisi_terkini);
    if (lokasi_terkini)  query = query.ilike('lokasi_terkini', `%${lokasi_terkini}%`);

    // FIXED: OR search — nama_koleksi ATAU no_inventaris
    if (q && q.trim()) {
      const keyword = q.trim();
      query = query.or(
        `nama_koleksi.ilike.%${keyword}%,no_inventaris.ilike.%${keyword}%`
      );
    }

    const validSortCols = [
      'no_inventaris', 'nama_koleksi', 'jenis_koleksi',
      'kondisi_terkini', 'lokasi_terkini', 'created_at',
    ];
    const sortCol = validSortCols.includes(sort_by) ? sort_by : 'no_inventaris';
    query = query.order(sortCol, { ascending: sort_order !== 'desc' });

    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const limitNum = Math.min(1000, Math.max(1, parseInt(limit) || 20));
    const from     = (pageNum - 1) * limitNum;
    const to       = from + limitNum - 1;
    query          = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data,
      meta: {
        total:      count,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    };
  }

  async isNoInventarisTaken(noInventaris, excludeId = null) {
    let query = this.db
      .from(this.tableName)
      .select('id')
      .eq('no_inventaris', noInventaris);

    if (excludeId) query = query.neq('id', excludeId);

    const { data } = await query.single();
    return !!data;
  }

  async searchForModal(q = '', limit = 50000) {
      let query = this.db
        .from(this.tableName)
        .select('id, no_inventaris, nama_koleksi, jenis_koleksi, kondisi_terkini, lokasi_terkini');

      if (q && q.trim()) {
        const keyword = q.trim();
        query = query.or(
          `nama_koleksi.ilike.%${keyword}%,no_inventaris.ilike.%${keyword}%`
        );
      }

      const limitNum = Math.max(1, parseInt(limit) || 50000);
      query = query
        .order('no_inventaris', { ascending: true })
        .limit(limitNum);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
      

  async getStats() {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('jenis_koleksi, kondisi_terkini')
      .limit(99999);

    if (error) throw error;

    const jenisMap   = {};
    const kondisiMap = { Baik: 0, 'Rusak Ringan': 0, 'Rusak Berat': 0 };

    (data || []).forEach((item) => {
      // Jenis
      const jenis = item.jenis_koleksi || 'Tidak Diketahui';
      jenisMap[jenis] = (jenisMap[jenis] || 0) + 1;

      const kondisi = item.kondisi_terkini || 'Baik';
      if (kondisi in kondisiMap) {
        kondisiMap[kondisi]++;
      } else {
        kondisiMap['Baik']++;
      }
    });

    const byJenis = Object.entries(jenisMap)
      .sort(([, a], [, b]) => b - a)
      .map(([jenis_koleksi, total]) => ({ jenis_koleksi, total }));

    return {
      total: data.length,
      byJenis,
      byKondisi:    kondisiMap,
      jenisOptions: byJenis
        .filter((j) => j.jenis_koleksi !== 'Tidak Diketahui')
        .map((j) => j.jenis_koleksi),
    };
  }
}

module.exports = new KoleksiRepository();