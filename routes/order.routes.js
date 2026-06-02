const express = require('express');
const router = express.Router();

const orderController = require('../controllers/order.controller');
const upload = require('../middlewares/upload');
const { verifyToken } = require('../middlewares/auth');

// publik - customer buat pesanan (status: unpaid)
router.post('/', upload.none(), orderController.createOrder);

// publik - customer lihat status order mereka
router.get('/:id', orderController.showOrder);

// publik - customer konfirmasi pembayaran setelah scan QRIS
router.post('/:id/confirm-payment', orderController.confirmPayment);

// protected - hanya admin
router.get('/', verifyToken, orderController.getOrder);
router.put('/:id', verifyToken, orderController.updateOrder);
router.delete('/:id', verifyToken, orderController.deleteOrder);

module.exports = router;
