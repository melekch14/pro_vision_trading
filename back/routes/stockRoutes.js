const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

// Debug middleware to log all requests
router.use((req, res, next) => {
    console.log('Stock route hit:', req.method, req.originalUrl);
    next();
});

// Get matching products based on sphere and cylinder - MUST BE BEFORE /:id route
router.get('/matching', (req, res, next) => {
    console.log('Matching route hit with query:', req.query);
    next();
}, stockController.getMatchingProducts);

// Get matching products based on sphere and addition
router.get('/matching-by-addition', (req, res, next) => {
    console.log('Matching by addition route hit with query:', req.query);
    next();
}, stockController.getMatchingProductsBySphereAndAddition);

// Get all fabrication products
router.get('/fabrication', (req, res, next) => {
    console.log('Fabrication products route hit');
    next();
}, stockController.getFabricationProducts);

// Stock Routes
router.get('/all', stockController.getAllStockWithArticles);
router.post('/', stockController.createStock);
router.get('/article/:articleId', stockController.getStockByArticleId);
router.get('/:id', stockController.getStockById);
router.put('/:id', stockController.updateStock);
router.delete('/:id', stockController.deleteStock);
router.patch('/:id/decrement', stockController.decrementStock);

module.exports = router; 