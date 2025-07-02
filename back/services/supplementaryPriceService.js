const db = require('../models/db');

// Create supplementary price entry
const createSupplementaryPrice = async (priceData) => {
    const { stock_id, sphere, cylindre, addition, prix_supplement } = priceData;
    console.log('Creating supplementary price with data:', priceData);
    const [result] = await db.query(
        'INSERT INTO supplementary_prices (stock_id, sphere, cylindre, addition, prix_supplement) VALUES (?, ?, ?, ?, ?)',
        [stock_id, sphere, cylindre, addition, prix_supplement]
    );
    return result.insertId;
};

// Get supplementary prices for an article
const getSupplementaryPricesByArticleId = async (articleId) => {
    const [rows] = await db.query(`
        SELECT sp.*, s.article_id, s.quantite, s.type_stock
        FROM supplementary_prices sp
        JOIN stock s ON sp.stock_id = s.id
        WHERE s.article_id = ?
        ORDER BY sp.sphere, sp.cylindre, sp.addition
    `, [articleId]);
    return rows;
};

// Update supplementary price entry
const updateSupplementaryPrice = async (id, priceData) => {
    const { stock_id, sphere, cylindre, addition, prix_supplement } = priceData;
    await db.query(
        'UPDATE supplementary_prices SET stock_id = ?, sphere = ?, cylindre = ?, addition = ?, prix_supplement = ? WHERE id = ?',
        [stock_id, sphere, cylindre, addition, prix_supplement, id]
    );
};

// Delete supplementary price entry
const deleteSupplementaryPrice = async (id) => {
    await db.query('DELETE FROM supplementary_prices WHERE id = ?', [id]);
};

// Get supplementary price entry by ID
const getSupplementaryPriceById = async (id) => {
    const [rows] = await db.query('SELECT * FROM supplementary_prices WHERE id = ?', [id]);
    return rows[0];
};

// Get supplementary prices with article information
const getAllSupplementaryPricesWithArticles = async () => {
    const [rows] = await db.query(`
        SELECT 
            sp.*,
            s.article_id,
            s.quantite,
            s.type_stock,
            a.libelle as article_libelle,
            a.code as article_code,
            sf.name as subfamily_name,
            sf.code as subfamily_code,
            f.code as family_code
        FROM supplementary_prices sp
        JOIN stock s ON sp.stock_id = s.id
        JOIN article a ON s.article_id = a.id
        JOIN article_subfamilies sf ON a.article_subfamily_id = sf.id
        JOIN article_families f ON sf.family_id = f.id
        ORDER BY a.libelle, sp.sphere, sp.cylindre, sp.addition
    `);
    return rows;
};

// Get stock entries that have supplementary prices
const getStockWithSupplementaryPrices = async (articleId) => {
    const [rows] = await db.query(`
        SELECT 
            s.*,
            sp.prix_supplement,
            sp.id as supplementary_price_id
        FROM stock s
        LEFT JOIN supplementary_prices sp ON s.id = sp.stock_id
        WHERE s.article_id = ?
        ORDER BY s.sphere, s.cylindre, s.addition
    `, [articleId]);
    return rows;
};

module.exports = {
    createSupplementaryPrice,
    getSupplementaryPricesByArticleId,
    updateSupplementaryPrice,
    deleteSupplementaryPrice,
    getSupplementaryPriceById,
    getAllSupplementaryPricesWithArticles,
    getStockWithSupplementaryPrices
}; 