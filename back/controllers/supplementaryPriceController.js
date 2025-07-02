const supplementaryPriceService = require('../services/supplementaryPriceService');

// Create supplementary price entry
exports.createSupplementaryPrice = async (req, res) => {
    try {
        const id = await supplementaryPriceService.createSupplementaryPrice(req.body);
        res.status(201).json({ id, message: 'Supplementary price created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get supplementary prices for an article
exports.getSupplementaryPricesByArticleId = async (req, res) => {
    try {
        const prices = await supplementaryPriceService.getSupplementaryPricesByArticleId(req.params.articleId);
        res.json(prices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update supplementary price entry
exports.updateSupplementaryPrice = async (req, res) => {
    try {
        await supplementaryPriceService.updateSupplementaryPrice(req.params.id, req.body);
        res.json({ message: 'Supplementary price updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete supplementary price entry
exports.deleteSupplementaryPrice = async (req, res) => {
    try {
        await supplementaryPriceService.deleteSupplementaryPrice(req.params.id);
        res.json({ message: 'Supplementary price deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get supplementary price entry by ID
exports.getSupplementaryPriceById = async (req, res) => {
    try {
        const price = await supplementaryPriceService.getSupplementaryPriceById(req.params.id);
        if (!price) {
            return res.status(404).json({ error: 'Supplementary price not found' });
        }
        res.json(price);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all supplementary prices with article information
exports.getAllSupplementaryPricesWithArticles = async (req, res) => {
    try {
        const prices = await supplementaryPriceService.getAllSupplementaryPricesWithArticles();
        res.json(prices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get stock entries with supplementary prices for an article
exports.getStockWithSupplementaryPrices = async (req, res) => {
    try {
        const stockWithPrices = await supplementaryPriceService.getStockWithSupplementaryPrices(req.params.articleId);
        res.json(stockWithPrices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}; 