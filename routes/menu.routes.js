const express = require('express');
const router = express.Router();

const menuController = require('../controllers/menu.controller');
const upload = require('../middlewares/upload');
const { verifyToken } = require('../middlewares/auth');

// publik - tidak perlu login
router.get('/', menuController.getMenu);
router.get('/:id', menuController.showMenu);

// protected - perlu login (admin)
router.post('/', verifyToken, upload.single('image'), menuController.createMenu);
router.put('/:id', verifyToken, upload.single('image'), menuController.updateMenu);
router.delete('/:id', verifyToken, menuController.deleteMenu);

module.exports = router;