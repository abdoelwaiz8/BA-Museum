const express          = require('express');
const router           = express.Router();
const staffController  = require('../controllers/staffController');
const { protect, allowedRoles } = require('../middlewares/authMiddleware');

router.use(protect);

/** @route GET    /api/staff        — Semua role */
router.get('/',    staffController.getAll);

/** @route GET    /api/staff/:id */
router.get('/:id', staffController.getById);

/** @route POST   /api/staff        — Admin & Petugas */
router.post('/',   allowedRoles('admin', 'petugas'), staffController.create);

/** @route PUT    /api/staff/:id */
router.put('/:id', allowedRoles('admin', 'petugas'), staffController.update);

/** @route DELETE /api/staff/:id    — Admin only */
router.delete('/:id', allowedRoles('admin'), staffController.remove);

module.exports = router;