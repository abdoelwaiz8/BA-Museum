const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
console.log("Cek URL:", process.env.SUPABASE_URL);

// Validasi Env
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase credentials in environment variables');
}

// Client Public (untuk operasi dengan RLS jika ada)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Client Admin (Service Role - Bypass RLS)
// Digunakan oleh Repository untuk operasi backend
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY, 
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const testConnection = async () => {
  try {
    // Mencoba melakukan request simpel
    const { data, error } = await supabaseAdmin.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Supabase API Error:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (err) {
    // Ini akan menangkap error jaringan seperti 'fetch failed'
    console.error('❌ Network Error (Gagal menjangkau Supabase):', err.message);
    if (err.cause) console.error('Cause:', err.cause); // Ini akan menunjukkan detail teknis fetch
    return false;
  }
};

module.exports = { supabase, supabaseAdmin, testConnection };