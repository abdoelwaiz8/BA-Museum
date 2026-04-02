const express = require('express');
const router = express.Router();
const perawatanController = require('../controllers/perawatanController');
const { protect, allowedRoles } = require('../middlewares/authMiddleware');

router.use(protect);

/** @route GET /api/perawatan/ba-available — Get BA Peminjaman / Serah Terima yang tersedia */
router.get('/ba-available', perawatanController.getAvailableBA);

/** @route POST /api/perawatan */
router.post('/', allowedRoles('admin', 'petugas'), perawatanController.create);

/** @route GET /api/perawatan */
router.get('/', perawatanController.getAll);

/** @route GET /api/perawatan/:id */
router.get('/:id', perawatanController.getDetail);

/** @route DELETE /api/perawatan/:id */
router.delete('/:id', allowedRoles('admin'), perawatanController.remove);

/** @route GET /api/perawatan/:id/pdf */
router.get('/:id/pdf', perawatanController.generatePdf);

module.exports = router;
