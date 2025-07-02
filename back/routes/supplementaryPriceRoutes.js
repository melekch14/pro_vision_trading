const express = require('express');
const router = express.Router();
const supplementaryPriceController = require('../controllers/supplementaryPriceController');

// Create supplementary price
router.post('/', supplementaryPriceController.createSupplementaryPrice);

// Get supplementary prices for an article
router.get('/article/:articleId', supplementaryPriceController.getSupplementaryPricesByArticleId);

// Get stock with supplementary prices for an article
router.get('/stock/:articleId', supplementaryPriceController.getStockWithSupplementaryPrices);

// Update supplementary price
router.put('/:id', supplementaryPriceController.updateSupplementaryPrice);

// Delete supplementary price
router.delete('/:id', supplementaryPriceController.deleteSupplementaryPrice);

// Get supplementary price by ID
router.get('/:id', supplementaryPriceController.getSupplementaryPriceById);

// Get all supplementary prices with articles
router.get('/', supplementaryPriceController.getAllSupplementaryPricesWithArticles);

module.exports = router; 