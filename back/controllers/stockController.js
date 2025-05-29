const stockService = require('../services/stockService');

// Create stock entry
exports.createStock = async (req, res) => {
    try {
        const id = await stockService.createStock(req.body);
        res.status(201).json({ id, message: 'Stock entry created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get stock entries for an article
exports.getStockByArticleId = async (req, res) => {
    try {
        const stockEntries = await stockService.getStockByArticleId(req.params.articleId);
        res.json(stockEntries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update stock entry
exports.updateStock = async (req, res) => {
    try {
        await stockService.updateStock(req.params.id, req.body);
        res.json({ message: 'Stock entry updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete stock entry
exports.deleteStock = async (req, res) => {
    try {
        await stockService.deleteStock(req.params.id);
        res.json({ message: 'Stock entry deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get stock entry by ID
exports.getStockById = async (req, res) => {
    try {
        const stockEntry = await stockService.getStockById(req.params.id);
        if (!stockEntry) {
            return res.status(404).json({ error: 'Stock entry not found' });
        }
        res.json(stockEntry);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all stock entries with article information
exports.getAllStockWithArticles = async (req, res) => {
    try {
        const stockEntries = await stockService.getAllStockWithArticles();
        res.json(stockEntries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get matching products based on sphere and cylinder
exports.getMatchingProducts = async (req, res) => {
    try {
        console.log('Full request query:', req.query);
        console.log('Request parameters:', {
            sphere: req.query.sphere,
            cylinder: req.query.cylinder,
            rawQuery: req.originalUrl
        });

        const { sphere, cylinder } = req.query;
        
        if (!sphere || !cylinder) {
            return res.status(400).json({ 
                message: 'Both sphere and cylinder parameters are required' 
            });
        }

        const products = await stockService.getMatchingProducts(sphere, cylinder);
        
        // Return empty array if no products found, instead of error
        res.json(products || []);
    } catch (error) {
        console.error('Error in getMatchingProducts controller:', error);
        res.status(500).json({ message: error.message });
    }
}; 