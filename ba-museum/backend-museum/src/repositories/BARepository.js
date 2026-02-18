const BaseRepository = require('./BaseRepository');
const { supabaseAdmin } = require('../config/supabase');

class BARepository extends BaseRepository {
  constructor() {
    super('berita_acara');
  }

  // Override: Transactional Create
  async createBATransaction(headerData, itemsData) {
    // 1. Insert Header Berita Acara
    const { data: baHeader, error: headerError } = await this.db
      .from('berita_acara')
      .insert(headerData)
      .select()
      .single();

    if (headerError) throw new Error(`Gagal membuat header BA: ${headerError.message}`);

    try {
      // 2. Prepare Items Data
      const itemsToInsert = itemsData.map(item => ({
        ba_id: baHeader.id,
        koleksi_id: item.koleksi_id,
        kondisi_saat_transaksi: item.kondisi,
        lokasi_tujuan: item.lokasi_tujuan,
        keterangan_item: item.keterangan || ''
      }));

      // 3. Insert Items ke ba_items
      const { error: itemsError } = await this.db
        .from('ba_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // 4. CRITICAL: Update Lokasi & Kondisi di Table Master Koleksi
      // Kita lakukan loop update (karena Supabase JS belum support bulk update dengan value beda-beda secara native tanpa RPC)
      for (const item of itemsData) {
        await this.db
          .from('koleksi')
          .update({
            lokasi_terkini: item.lokasi_tujuan,
            kondisi_terkini: item.kondisi
          })
          .eq('id', item.koleksi_id);
      }

      return baHeader;

    } catch (error) {
      // Manual Rollback jika items gagal (Hapus header yang sudah terbuat)
      await this.db.from('berita_acara').delete().eq('id', baHeader.id);
      throw new Error(`Transaksi Gagal: ${error.message}`);
    }
  }

  // Get Full Detail untuk View/PDF
  async getFullDetail(id) {
    const { data, error } = await this.db
      .from('berita_acara')
      .select(`
        *,
        pihak1:pihak_pertama_id(nama, nip, jabatan, pangkat_golongan),
        pihak2:pihak_kedua_id(nama, nip, jabatan, pangkat_golongan),
        saksi:mengetahui_id(nama, nip, jabatan, pangkat_golongan),
        items:ba_items(
          *,
          koleksi:koleksi_id(nama_koleksi, no_inventaris)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = new BARepository();