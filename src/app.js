const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const path       = require('path');
const YAML       = require('yamljs');
const swaggerUi  = require('swagger-ui-express');
require('dotenv').config();

const { testConnection }         = require('./config/supabase');
const { notFound, errorHandler } = require('./utils/errorHandler');

// Routes
const authRoutes    = require('./routes/authRoutes');
const staffRoutes   = require('./routes/staffRoutes');
const koleksiRoutes = require('./routes/koleksiRoutes');
const baRoutes         = require('./routes/baRoutes');
const perawatanRoutes  = require('./routes/perawatanRoutes');

const app = express();

// ── Security & Parsing ────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Swagger Docs ──────────────────────────────────────────────────────────────
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'Museum Aceh API Docs',
}));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Museum Aceh - Inventory & Berita Acara API 🏛️',
    version: '2.1.0',
    docs:    '/docs',
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/staff',        staffRoutes);
app.use('/api/koleksi',      koleksiRoutes);
app.use('/api/berita-acara', baRoutes);
app.use('/api/perawatan',    perawatanRoutes);

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Koneksi Supabase gagal. Server dihentikan.');
      process.exit(1);
    }
    app.listen(PORT, () => {
      console.log(`🚀 Museum API  → http://localhost:${PORT}`);
      console.log(`📄 Swagger     → http://localhost:${PORT}/docs`);
    });
  } catch (err) {
    console.error('❌ Gagal menjalankan server:', err);
  }
};

startServer();
module.exports = app;