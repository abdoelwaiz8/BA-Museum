const express           = require('express');
const router            = express.Router();
const koleksiController = require('../controllers/koleksiController');
const { protect, allowedRoles } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', koleksiController.getAll);

// !! /stats HARUS sebelum /:id — agar Express tidak baca "stats" sebagai UUID
router.get('/stats', koleksiController.getStats);

router.get('/:id',    koleksiController.getById);
router.post('/',      allowedRoles('admin', 'petugas'), koleksiController.create);
router.put('/:id',    allowedRoles('admin', 'petugas'), koleksiController.update);
router.delete('/:id', allowedRoles('admin'),             koleksiController.remove);

module.exports = router;