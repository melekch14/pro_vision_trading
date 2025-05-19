const db = require('../models/db');

// Create stock entry
const createStock = async (stockData) => {
    const { article_id, sphere, cylindre, quantite } = stockData;
    const [result] = await db.query(
        'INSERT INTO stock (article_id, sphere, cylindre, quantite) VALUES (?, ?, ?, ?)',
        [article_id, sphere, cylindre, quantite]
    );
    return result.insertId;
};

// Get stock entries for an article
const getStockByArticleId = async (articleId) => {
    const [rows] = await db.query(
        'SELECT * FROM stock WHERE article_id = ?',
        [articleId]
    );
    return rows;
};

// Update stock entry
const updateStock = async (id, stockData) => {
    const { sphere, cylindre, quantite } = stockData;
    await db.query(
        'UPDATE stock SET sphere = ?, cylindre = ?, quantite = ? WHERE id = ?',
        [sphere, cylindre, quantite, id]
    );
};

// Delete stock entry
const deleteStock = async (id) => {
    await db.query('DELETE FROM stock WHERE id = ?', [id]);
};

// Get stock entry by ID
const getStockById = async (id) => {
    const [rows] = await db.query('SELECT * FROM stock WHERE id = ?', [id]);
    return rows[0];
};

module.exports = {
    createStock,
    getStockByArticleId,
    updateStock,
    deleteStock,
    getStockById
}; 