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
    const { article_id, sphere, cylindre, addition, quantite, type_stock } = stockData;
    await db.query(
        'UPDATE stock SET article_id = ?, sphere = ?, cylindre = ?, addition = ?, quantite = ? WHERE id = ?',
        [
            article_id,
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
            a.libelle as article_libelle,
            a.code as article_code,
            sf.name as subfamily_name,
            sf.code as subfamily_code,
            f.code as family_code
        FROM stock s
        JOIN article a ON s.article_id = a.id
        JOIN article_subfamilies sf ON a.article_subfamily_id = sf.id
        JOIN article_families f ON sf.family_id = f.id
        ORDER BY a.libelle
    `);
    return rows;
};

// Get matching products based on sphere and cylinder
const getMatchingProducts = async (sphere, cylinder) => {
    try {
        console.log('Searching for products with sphere:', sphere, 'and cylinder:', cylinder);
        
        const [rows] = await db.query(`
            SELECT 
                s.id,
                a.libelle as article_libelle,
                s.sphere,
                s.cylindre as cylinder,
                a.code as article_code,
                a.type_stock,
                a.origineArticle,
                sf.name as subfamily_name,
                sf.code as subfamily_code,
                f.code as family_code,
                s.addition
            FROM stock s
            JOIN article a ON s.article_id = a.id
            JOIN article_subfamilies sf ON a.article_subfamily_id = sf.id
            JOIN article_families f ON sf.family_id = f.id
            WHERE s.sphere = ? AND s.cylindre = ?
            ORDER BY a.libelle
        `, [sphere, cylinder]);

        console.log('Query results:', rows);
        
        if (rows.length === 0) {
            console.log('No products found matching the criteria');
        }
        
        return rows;
    } catch (error) {
        console.error('Error in getMatchingProducts:', error);
        throw new Error(`Error fetching matching products: ${error.message}`);
    }
};

// Get matching products based on sphere and addition
const getMatchingProductsBySphereAndAddition = async (sphere, addition) => {
    try {
        console.log('Searching for products with sphere:', sphere, 'and addition:', addition);
        
        const [rows] = await db.query(`
            SELECT 
                s.id,
                a.libelle as article_libelle,
                s.sphere,
                s.cylindre as cylinder,
                a.code as article_code,
                a.type_stock,
                a.origineArticle,
                sf.name as subfamily_name,
                sf.code as subfamily_code,
                f.code as family_code,
                s.addition
            FROM stock s
            JOIN article a ON s.article_id = a.id
            JOIN article_subfamilies sf ON a.article_subfamily_id = sf.id
            JOIN article_families f ON sf.family_id = f.id
            WHERE s.sphere = ? AND s.addition = ?
            ORDER BY a.libelle
        `, [sphere, addition]);

        console.log('Query results:', rows);
        
        if (rows.length === 0) {
            console.log('No products found matching the criteria');
        }
        
        return rows;
    } catch (error) {
        console.error('Error in getMatchingProductsBySphereAndAddition:', error);
        throw new Error(`Error fetching matching products: ${error.message}`);
    }
};

// Get all fabrication products
const getFabricationProducts = async () => {
    try {
        console.log('Fetching all fabrication products');
        
        const [rows] = await db.query(`
            SELECT 
                id,
                libelle as article_libelle,
                code as article_code,
                type_stock,
                origineArticle
            FROM article
            WHERE origineArticle = 'fabrication'
            ORDER BY libelle
        `);

        console.log('Fabrication products found:', rows.length);
        return rows;
    } catch (error) {
        console.error('Error in getFabricationProducts:', error);
        throw new Error(`Error fetching fabrication products: ${error.message}`);
    }
};

// Decrement stock quantity by 1
const decrementStock = async (id) => {
    await db.query('UPDATE stock SET quantite = quantite - 1 WHERE id = ? AND quantite > 0', [id]);
};

module.exports = {
    createStock,
    getStockByArticleId,
    updateStock,
    deleteStock,
    getStockById,
    getAllStockWithArticles,
    getMatchingProducts,
    getMatchingProductsBySphereAndAddition,
    getFabricationProducts,
    decrementStock
}; 