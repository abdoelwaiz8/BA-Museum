const BaseRepository = require('./BaseRepository');

class PerawatanRepository extends BaseRepository {
  constructor() {
    super('form_perawatan');
  }

  /**
   * Membuat record Form Perawatan baru dengan dukungan Mode Individu dan BA
   */
  async createPerawatan(payload, petugasId) {
    const {
        mode,
        koleksi_id,
        ba_id,
        tanggal_perawatan,
        klasifikasi_koleksi,
        material_bahan,
        kondisi,
        faktor_kerusakan,
        metode_konservasi,
        teknis_penanganan,
        alat_bahan,
        pengamanan
    } = payload;

    const insertData = {
        koleksi_id: mode === 'individu' ? koleksi_id : null,
        ba_id: mode === 'lampiran' ? ba_id : null,
        tanggal_perawatan,
        klasifikasi_koleksi,
        material_bahan,
        kondisi,
        faktor_kerusakan,
        metode_konservasi,
        teknis_penanganan,
        alat_bahan,
        pengamanan,
        petugas_id: petugasId 
    };

    const { data: result, error } = await this.db
      .from('perawatan_koleksi')
      .insert([insertData])
      .select()
      .single();

    if (error) throw new Error(`Gagal membuat Form Perawatan: ${error.message}`);
    return result;
  }

  /**
   * Mengambil semua Form Perawatan
   */
  async findAllForms() {
    const { data, error } = await this.db
      .from('form_perawatan')
      .select(`
        id,
        kode_perawatan,
        asal_koleksi,
        klasifikasi_koleksi,
        petugas_konservasi,
        pendataan,
        created_at,
        berita_acara(nomor_surat, tanggal_serah_terima)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Mengambil detail Form Perawatan beserta detail BA items
   */
  async getFullDetail(id) {
    const { data, error } = await this.db
      .from('form_perawatan')
      .select(`
        *,
        berita_acara(
          id,
          nomor_surat,
          tanggal_serah_terima,
          items:ba_items(
            id,
            kondisi_saat_transaksi,
            keterangan_item,
            koleksi:koleksi_id(no_inventaris, nama_koleksi, jenis_koleksi)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Mengambil BA Peminjaman / Serah Terima yang belum memiliki form perawatan
   */
  async getAvailableBA() {
    // Ambil BA Peminjaman / Serah Terima yang memilki ba_items
    const { data, error } = await this.db
      .from('berita_acara')
      .select(`
        id,
        nomor_surat,
        jenis_ba,
        tanggal_serah_terima,
        items:ba_items(id)
      `)
      .in('jenis_ba', ['Peminjaman', 'Serah Terima'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Harus ada items
    return data.filter(ba => ba.items && ba.items.length > 0);
  }
}

module.exports = new PerawatanRepository();
