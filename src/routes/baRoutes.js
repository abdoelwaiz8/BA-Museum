const express      = require('express');
const router       = express.Router();
const baController = require('../controllers/baController');
const { protect, allowedRoles } = require('../middlewares/authMiddleware');

router.use(protect);

/** @route POST /api/berita-acara        — Buat BA baru */
router.post('/', allowedRoles('admin', 'petugas'), baController.create);

/** @route GET  /api/berita-acara        — List semua BA */
router.get('/', baController.getAll);

/** @route GET  /api/berita-acara/:id    — Detail BA */
router.get('/:id', baController.getDetail);

/** @route GET  /api/berita-acara/:id/pdf — Generate & download PDF */
router.get('/:id/pdf', baController.generatePdf);

module.exports = router;