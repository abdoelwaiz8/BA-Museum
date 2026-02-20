const express             = require('express');
const router              = express.Router();
const koleksiController   = require('../controllers/koleksiController');
const { protect, allowedRoles } = require('../middlewares/authMiddleware');

// Semua route di bawah membutuhkan token yang valid
router.use(protect);

/** @route GET  /api/koleksi  — Semua role bisa melihat */
router.get('/', koleksiController.getAll);

/** @route GET  /api/koleksi/:id */
router.get('/:id', koleksiController.getById);

/** @route POST /api/koleksi  — Hanya admin & petugas */
router.post('/', allowedRoles('admin', 'petugas'), koleksiController.create);

/** @route PUT  /api/koleksi/:id — Hanya admin & petugas */
router.put('/:id', allowedRoles('admin', 'petugas'), koleksiController.update);

/** @route DELETE /api/koleksi/:id — Hanya admin */
router.delete('/:id', allowedRoles('admin'), koleksiController.remove);

module.exports = router;