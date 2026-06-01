const express = require('express');
const router = express.Router();

const transactionController = require('../controllers/transaction.controller');
const upload = require('../middlewares/upload');
const { verifyToken } = require('../middlewares/auth');

// publik - customer bayar
router.post('/', upload.none(), transactionController.createTransaction);

// protected - hanya admin
router.get('/', verifyToken, transactionController.getTransaction);
router.get('/:id', verifyToken, transactionController.showTransaction);

module.exports = router;
