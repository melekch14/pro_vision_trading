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