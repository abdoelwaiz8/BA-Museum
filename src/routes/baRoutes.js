const express = require('express');
const router = express.Router();
const baController = require('../controllers/baController');
// Asumsi kamu punya middleware auth, jika belum ada bisa di-skip dulu
// const { protect } = require('../middlewares/authMiddleware');

// router.use(protect); // Protect semua route di bawah ini

router.post('/', (req, res) => baController.create(req, res));
router.get('/', (req, res) => baController.getAll(req, res));
router.get('/:id', (req, res) => baController.getDetail(req, res));

module.exports = router;