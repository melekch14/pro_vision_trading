const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

// Stock Routes
router.post('/', stockController.createStock);
router.get('/article/:articleId', stockController.getStockByArticleId);
router.get('/:id', stockController.getStockById);
router.put('/:id', stockController.updateStock);
router.delete('/:id', stockController.deleteStock);

module.exports = router; 