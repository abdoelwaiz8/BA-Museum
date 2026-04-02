const BaseRepository = require('./BaseRepository');

class BARepository extends BaseRepository {
  constructor() {
    super('berita_acara');
  }

  /**
   * Parse field ext yang disimpan sebagai JSON string atau object
   */
  _parseExt(val) {
    if (!val) return null;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch { return null; }
  }

  /**
   * Normalisasi data BA: gabungkan pihak internal & eksternal
   * sehingga layer atas selalu mendapat { nama, nip, jabatan, alamat }
   */
  _normalizePihak(ba) {
    // Pihak Kedua
    if (!ba.pihak2 && ba.pihak_kedua_ext) {
      const ext = this._parseExt(ba.pihak_kedua_ext);
      if (ext) ba.pihak2 = { nama: ext.nama, nip: '-', jabatan: ext.jabatan || '', alamat: '-' };
    }
    // Saksi 2
    if (!ba.saksi2 && ba.saksi2_ext) {
      const ext = this._parseExt(ba.saksi2_ext);
      if (ext) ba.saksi2 = { nama: ext.nama, nip: '-', jabatan: ext.jabatan || '' };
    }
    return ba;
  }

  /**
   * Transaksi pembuatan Berita Acara
   */
  async createBATransaction(headerData, itemsData) {
    // Step 1: Insert header
    const { data: baHeader, error: headerError } = await this.db
      .from('berita_acara')
      .insert(headerData)
      .select()
      .single();

    if (headerError) {
      throw new Error(`Gagal membuat header Berita Acara: ${headerError.message}`);
    }

    try {
      // Step 2: Insert items (jika ada)
      if (itemsData.length > 0) {
        const itemsToInsert = itemsData.map(item => ({
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

        // Step 3: Update master koleksi
        const updatePromises = itemsData.map(item =>
          this.db
            .from('koleksi')
            .update({
              kondisi_terkini: item.kondisi,
              ...(item.lokasi_tujuan && { lokasi_terkini: item.lokasi_tujuan }),
            })
            .eq('id', item.koleksi_id)
        );
        const updateResults = await Promise.all(updatePromises);
        const failedUpdate  = updateResults.find(r => r.error);
        if (failedUpdate) throw new Error(`Gagal update koleksi: ${failedUpdate.error.message}`);
      }

      return baHeader;
    } catch (error) {
      // Rollback: hapus header
      await this.db.from('berita_acara').delete().eq('id', baHeader.id);
      throw new Error(`Transaksi Gagal & Di-rollback: ${error.message}`);
    }
  }

  /**
   * List BA dengan info ringkas (untuk dashboard & tabel)
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
        pihak_kedua_ext,
        pihak1:pihak_pertama_id(nama, jabatan),
        pihak2:pihak_kedua_id(nama, jabatan)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Normalisasi pihak2 eksternal untuk tampilan list
    return (data || []).map(ba => this._normalizePihak(ba));
  }

  /**
   * Detail lengkap satu BA (untuk preview & cetak PDF)
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
    return this._normalizePihak(data);
  }

  /**
   * Status Peminjaman (mengambil item koleksi yang BA-nya Peminjaman/Pengiriman)
   */
  async findStatusPinjam() {
    const { data, error } = await this.db
      .from('berita_acara')
      .select(`
        id,
        nomor_surat,
        jenis_ba,
        tanggal_serah_terima,
        pihak_kedua_id,
        pihak_kedua_ext,
        pihak2:pihak_kedua_id(nama, jabatan),
        items:ba_items(
          id,
          kondisi_saat_transaksi,
          koleksi:koleksi_id(no_inventaris, nama_koleksi, jenis_koleksi)
        )
      `)
      .in('jenis_ba', ['Peminjaman', 'Pengiriman']);
      
    if (error) throw error;

    let result = [];
    // Reset hours to start of day for accurate comparison
    const tglSekarang = new Date();
    tglSekarang.setHours(0, 0, 0, 0);

    for (const ba of data) {
      const b = this._normalizePihak(ba);
      const isInternal = !!ba.pihak_kedua_id;
      
      const tglPinjam = new Date(b.tanggal_serah_terima);
      tglPinjam.setHours(0, 0, 0, 0);
      const diffTime = tglSekarang - tglPinjam;
      const durasi_hari = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

      for (const item of (b.items || [])) {
        if (!item.koleksi) continue; // safety check
        result.push({
          ba_id: b.id,
          nomor_surat: b.nomor_surat,
          tanggal_serah_terima: b.tanggal_serah_terima,
          peminjam: b.pihak2,
          isInternal,
          durasi_hari,
          item_id: item.id,
          kondisi_saat_transaksi: item.kondisi_saat_transaksi,
          koleksi: item.koleksi
        });
      }
    }
    
    // Urutkan durasi terlama di atas
    result.sort((a, b) => b.durasi_hari - a.durasi_hari);
    return result;
  }

  /**
   * Menghapus Berita Acara beserta items-nya
   */
  async deleteBA(id) {
    const { error: itemsError } = await this.db
      .from('ba_items')
      .delete()
      .eq('ba_id', id);
    if (itemsError) throw new Error(`Gagal menghapus items BA: ${itemsError.message}`);

    const { error: headerError } = await this.db
      .from('berita_acara')
      .delete()
      .eq('id', id);
    if (headerError) throw new Error(`Gagal menghapus header BA: ${headerError.message}`);
    
    return true;
  }
}

module.exports = new BARepository();