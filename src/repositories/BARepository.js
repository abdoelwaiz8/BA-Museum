const BaseRepository = require('./BaseRepository');

class BARepository extends BaseRepository {
  constructor() {
    super('berita_acara');
  }

  /**
   * Transaksi pembuatan Berita Acara:
   * 1. Insert header ke 'berita_acara'
   * 2. Insert banyak item ke 'ba_items'
   * 3. Update lokasi_terkini & kondisi_terkini di tabel master 'koleksi'
   *
   * Jika salah satu step gagal → manual rollback (hapus header yang terbuat).
   *
   * @param {Object} headerData - Data header BA (termasuk jenis_ba, saksi1_id, saksi2_id)
   * @param {Array}  itemsData  - Array item koleksi
   */
  async createBATransaction(headerData, itemsData) {
    // ── Step 1: Insert Header ────────────────────────────────────────────────
    const { data: baHeader, error: headerError } = await this.db
      .from('berita_acara')
      .insert(headerData)
      .select()
      .single();

    if (headerError) {
      throw new Error(`Gagal membuat header Berita Acara: ${headerError.message}`);
    }

    try {
      // ── Step 2: Siapkan & Insert Items ──────────────────────────────────────
      const itemsToInsert = itemsData.map((item) => ({
        ba_id:                  baHeader.id,
        koleksi_id:             item.koleksi_id,
        kondisi_saat_transaksi: item.kondisi,
        lokasi_tujuan:          item.lokasi_tujuan || null,
        keterangan_item:        item.keterangan   || '',
      }));

      const { error: itemsError } = await this.db
        .from('ba_items')
        .insert(itemsToInsert);

      if (itemsError) throw new Error(`Gagal insert item BA: ${itemsError.message}`);

      // ── Step 3: Update Master Koleksi ────────────────────────────────────────
      const updatePromises = itemsData.map((item) =>
        this.db
          .from('koleksi')
          .update({
            kondisi_terkini: item.kondisi,
            ...(item.lokasi_tujuan && { lokasi_terkini: item.lokasi_tujuan }),
          })
          .eq('id', item.koleksi_id)
      );

      const updateResults = await Promise.all(updatePromises);
      const failedUpdate  = updateResults.find((r) => r.error);
      if (failedUpdate) {
        throw new Error(`Gagal update koleksi: ${failedUpdate.error.message}`);
      }

      return baHeader;

    } catch (error) {
      // ── Manual Rollback ──────────────────────────────────────────────────────
      await this.db.from('berita_acara').delete().eq('id', baHeader.id);
      throw new Error(`Transaksi Gagal & Di-rollback: ${error.message}`);
    }
  }

  /**
   * Ambil semua BA dengan info dasar (untuk list/dashboard).
   */
  async findAllWithStaff() {
    const { data, error } = await this.db
      .from('berita_acara')
      .select(`
        id,
        nomor_surat,
        jenis_ba,
        tanggal_serah_terima,
        created_at,
        pihak1:pihak_pertama_id(nama, jabatan),
        pihak2:pihak_kedua_id(nama, jabatan)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Ambil detail LENGKAP satu BA untuk preview/cetak dokumen.
   * Mencakup: 2 pihak, 2 saksi, dan daftar koleksi (sesuai lampiran PDF).
   *
   * @param {string} id - UUID Berita Acara
   */
  async getFullDetail(id) {
    const { data, error } = await this.db
      .from('berita_acara')
      .select(`
        *,
        pihak1:pihak_pertama_id(nama, nip, jabatan, alamat),
        pihak2:pihak_kedua_id(nama, nip, jabatan, alamat),
        saksi1:saksi1_id(nama, nip, jabatan),
        saksi2:saksi2_id(nama, nip, jabatan),
        items:ba_items(
          id,
          kondisi_saat_transaksi,
          lokasi_tujuan,
          keterangan_item,
          koleksi:koleksi_id(
            no_inventaris,
            nama_koleksi,
            jenis_koleksi,
            kondisi_terkini
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = new BARepository();