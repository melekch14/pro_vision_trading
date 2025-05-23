const db = require('../models/db');

// Create stock entry
const createStock = async (stockData) => {
    const { article_id, sphere, cylindre, addition, quantite, type_stock } = stockData;
    console.log('Creating stock with data:', stockData);
    const [result] = await db.query(
        'INSERT INTO stock (article_id, sphere, cylindre, addition, quantite) VALUES (?, ?, ?, ?, ?)',
        [
            article_id, 
            sphere, 
            type_stock === 'cylindre' ? cylindre : null, 
            type_stock === 'addition' ? addition : null, 
            quantite
        ]
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
    const { sphere, cylindre, addition, quantite, type_stock } = stockData;
    console.log('Updating stock with data:', stockData);
    await db.query(
        'UPDATE stock SET sphere = ?, cylindre = ?, addition = ?, quantite = ? WHERE id = ?',
        [
            sphere, 
            type_stock === 'cylindre' ? cylindre : null, 
            type_stock === 'addition' ? addition : null, 
            quantite, 
            id
        ]
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

// Get all stock entries with article information
const getAllStockWithArticles = async () => {
    const [rows] = await db.query(`
        SELECT 
            s.*,
            a.code as article_code,
            a.libelle as article_libelle,
            a.type_stock,
            sf.name as subfamily_name,
            sf.code as subfamily_code,
            f.code as family_code,
            s.addition
        FROM stock s
        JOIN article a ON s.article_id = a.id
        JOIN article_subfamilies sf ON a.article_subfamily_id = sf.id
        JOIN article_families f ON sf.family_id = f.id
        ORDER BY a.code, s.cylindre, s.sphere
    `);
    return rows;
};

module.exports = {
    createStock,
    getStockByArticleId,
    updateStock,
    deleteStock,
    getStockById,
    getAllStockWithArticles
}; 