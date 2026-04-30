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
        items,
        ba_id,
        tanggal_perawatan,
        klasifikasi_koleksi,
        material_bahan,
        kondisi,
        faktor_kerusakan,
        metode_konservasi = {},
        teknis_penanganan,
        alat_bahan,
        pengamanan,
        nama_pendataan,
        catatan
    } = payload;

    // Ekstrak sub-field dari metode_konservasi dan alat_bahan / pengamanan
    const kode_perawatan = metode_konservasi.kode_perawatan || null;
    const asal_koleksi   = metode_konservasi.asal_koleksi   || null;
    // jenis_organik adalah boolean: Organik=true, Anorganik=false, null jika tidak dipilih
    const jenisStr = metode_konservasi.jenis_koleksi || null;
    const jenis_organik = jenisStr === 'Organik' ? true : jenisStr === 'Anorganik' ? false : null;
    // Kolom bercheck constraint: kirim null jika kosong (bukan '-')
    const validMetodePRawatan  = ['Preventif','Kuratif'];
    const validTeknisP         = ['Basah','Kering'];
    const validMetodeBahan     = ['Kimia','Alami'];
    const metode_perawatan = validMetodePRawatan.includes(metode_konservasi.metode_perawatan) ? metode_konservasi.metode_perawatan : null;
    const metode_bahan     = validMetodeBahan.includes(metode_konservasi.metode_bahan) ? metode_konservasi.metode_bahan : null;
    const teknis_valid     = validTeknisP.includes(teknis_penanganan) ? teknis_penanganan : null;

    // Parsing alat/bahan dari string "Alat: x\nBahan: y"
    let alat = '-', bahan = '-';
    if (alat_bahan) {
      const parts = alat_bahan.split(/\n|\\n/);
      alat  = (parts[0] || '').replace(/^Alat:\s*/i, '').trim() || '-';
      bahan = (parts[1] || '').replace(/^Bahan:\s*/i, '').trim() || '-';
    }

    // Parsing pembungkus/pengawet dari string "Pembungkus: x\nPengawet: y"
    let pembungkus = '-', pengawet = '-';
    if (pengamanan) {
      const parts = pengamanan.split(/\n|\\n/);
      pembungkus = (parts[0] || '').replace(/^Pembungkus:\s*/i, '').trim() || '-';
      pengawet   = (parts[1] || '').replace(/^Pengawet:\s*/i, '').trim() || '-';
    }

    // Konversikan array ke string untuk kolom text
    const kondisiTxt      = Array.isArray(kondisi)        ? kondisi.join(', ')        : (kondisi || '-');
    const faktorTxt       = Array.isArray(faktor_kerusakan) ? faktor_kerusakan.join(', ') : (faktor_kerusakan || '-');
    const materialTxt     = Array.isArray(material_bahan)  ? material_bahan.join(', ')  : (material_bahan || '-');
    const klasifikasiTxt  = Array.isArray(klasifikasi_koleksi) ? klasifikasi_koleksi.join(', ') : (klasifikasi_koleksi || '-');

    const baseRow = {
        kode_perawatan,
        tanggal: tanggal_perawatan,
        asal_koleksi,
        jenis_organik,
        kondisi:            kondisiTxt,
        faktor_kerusakan:   faktorTxt,
        teknis_penanganan:  teknis_valid,
        metode_perawatan,
        metode_bahan,
        alat,
        bahan,
        pembungkus,
        pengawet,
        material:           materialTxt,
        catatan:            catatan || null,
        petugas_id:         petugasId,
    };

    // Jika mode lampiran
    if (mode === 'lampiran') {
      const insertData = { ...baseRow, ba_id, nama_pendataan: nama_pendataan || null };
      const { data: result, error } = await this.db.from('perawatan_koleksi').insert([insertData]).select().single();
      if (error) throw new Error(`Gagal membuat Form Perawatan (Lampiran): ${error.message}`);
      return result;
    }

    // Jika mode individu: insert satu row per koleksi dalam items
    const rowsToInsert = items.map(item => ({
        ...baseRow,
        koleksi_id: item.koleksi_id,
    }));

    const { data: resultList, error } = await this.db.from('perawatan_koleksi').insert(rowsToInsert).select();
    if (error) throw new Error(`Gagal membuat Form Perawatan (Individu): ${error.message}`);

    return resultList && resultList.length > 0 ? resultList[0] : null;
  }

  /**
   * Mengambil semua Form Perawatan
   */
  async findAllForms() {
    const { data, error } = await this.db
      .from('perawatan_koleksi')
      .select(`
        id,
        kode_perawatan,
        ba_id,
        tanggal,
        asal_koleksi,
        kondisi,
        petugas_id,
        created_at,
        petugas:petugas_id(nama, jabatan),
        koleksi:koleksi_id(no_inventaris, nama_koleksi, jenis_koleksi)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Mengambil detail Form Perawatan lengkap (mode individu) beserta koleksi
   */
  async getFullDetail(id) {
    const { data, error } = await this.db
      .from('perawatan_koleksi')
      .select(`
        *,
        petugas:petugas_id(id, nama, jabatan),
        koleksi:koleksi_id(no_inventaris, nama_koleksi, jenis_koleksi, kondisi_terkini)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Mengambil detail Form Perawatan beserta info BA (mode Lampiran)
   */
  async getFullDetailLampiran(id) {
    const { data, error } = await this.db
      .from('perawatan_koleksi')
      .select(`
        *,
        petugas:petugas_id(id, nama, jabatan),
        ba:ba_id(
          id,
          nomor_surat,
          jenis_ba,
          tanggal_serah_terima,
          items:ba_items(id)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Hitung jumlah koleksi dari BA items
    if (data.ba && data.ba.items) {
      data.ba.jumlah_koleksi = data.ba.items.length;
    }

    return data;
  }

  /**
   * Mengambil semua BA yang memiliki koleksi, sebagai pilihan form lampiran
   */
  async getAvailableBA() {
    const { data, error } = await this.db
      .from('berita_acara')
      .select(`
        id,
        nomor_surat,
        jenis_ba,
        tanggal_serah_terima,
        items:ba_items(id, koleksi:koleksi_id(nama_koleksi, no_inventaris))
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Harus ada items
    return (data || [])
      .filter(ba => ba.items && ba.items.length > 0)
      .map(ba => ({
        ...ba,
        total_item_koleksi: ba.items.length,
      }));
  }
}

module.exports = new PerawatanRepository();
