const db = require('../models/db');

// Foyer CRUD
const createFoyer = async (foyer) => {
    const [result] = await db.query(
        'INSERT INTO foyer (name) VALUES (?)',
        [foyer.name]
    );
    return result.insertId;
};

const getFoyers = async () => {
    const [foyers] = await db.query('SELECT * FROM foyer');
    return foyers;
};

const getFoyerById = async (id) => {
    const [foyers] = await db.query('SELECT * FROM foyer WHERE id = ?', [id]);
    return foyers[0];
};

const updateFoyer = async (id, foyer) => {
    await db.query(
        'UPDATE foyer SET name = ? WHERE id = ?',
        [foyer.name, id]
    );
};

const deleteFoyer = async (id) => {
    await db.query('DELETE FROM foyer WHERE id = ?', [id]);
};

// Indice CRUD
const createIndice = async (indice) => {
    const [result] = await db.query(
        'INSERT INTO indice (name) VALUES (?)',
        [indice.name]
    );
    return result.insertId;
};

const getIndices = async () => {
    const [indices] = await db.query('SELECT * FROM indice');
    return indices;
};

const getIndiceById = async (id) => {
    const [indices] = await db.query('SELECT * FROM indice WHERE id = ?', [id]);
    return indices[0];
};

const updateIndice = async (id, indice) => {
    await db.query(
        'UPDATE indice SET name = ? WHERE id = ?',
        [indice.name, id]
    );
};

const deleteIndice = async (id) => {
    await db.query('DELETE FROM indice WHERE id = ?', [id]);
};

// Design CRUD
const createDesign = async (design) => {
    const [result] = await db.query(
        'INSERT INTO design (name) VALUES (?)',
        [design.name]
    );
    return result.insertId;
};

const getDesigns = async () => {
    const [designs] = await db.query('SELECT * FROM design');
    return designs;
};

const getDesignById = async (id) => {
    const [designs] = await db.query('SELECT * FROM design WHERE id = ?', [id]);
    return designs[0];
};

const updateDesign = async (id, design) => {
    await db.query(
        'UPDATE design SET name = ? WHERE id = ?',
        [design.name, id]
    );
};

const deleteDesign = async (id) => {
    await db.query('DELETE FROM design WHERE id = ?', [id]);
};

// Couleur Photo CRUD
const createCouleurPhoto = async (couleurPhoto) => {
    const [result] = await db.query(
        'INSERT INTO couleur_photo (name) VALUES (?)',
        [couleurPhoto.name]
    );
    return result.insertId;
};

const getCouleurPhotos = async () => {
    const [couleurPhotos] = await db.query('SELECT * FROM couleur_photo');
    return couleurPhotos;
};

const getCouleurPhotoById = async (id) => {
    const [couleurPhotos] = await db.query('SELECT * FROM couleur_photo WHERE id = ?', [id]);
    return couleurPhotos[0];
};

const updateCouleurPhoto = async (id, couleurPhoto) => {
    await db.query(
        'UPDATE couleur_photo SET name = ? WHERE id = ?',
        [couleurPhoto.name, id]
    );
};

const deleteCouleurPhoto = async (id) => {
    await db.query('DELETE FROM couleur_photo WHERE id = ?', [id]);
};

// Traitement CRUD
const createTraitement = async (traitement) => {
    const [result] = await db.query(
        'INSERT INTO traitement (name) VALUES (?)',
        [traitement.name]
    );
    return result.insertId;
};

const getTraitements = async () => {
    const [traitements] = await db.query('SELECT * FROM traitement');
    return traitements;
};

const getTraitementById = async (id) => {
    const [traitements] = await db.query('SELECT * FROM traitement WHERE id = ?', [id]);
    return traitements[0];
};

const updateTraitement = async (id, traitement) => {
    await db.query(
        'UPDATE traitement SET name = ? WHERE id = ?',
        [traitement.name, id]
    );
};

const deleteTraitement = async (id) => {
    await db.query('DELETE FROM traitement WHERE id = ?', [id]);
};

// Type Article CRUD
const createTypeArticle = async (typeArticle) => {
    const [result] = await db.query(
        'INSERT INTO typeArticle (name) VALUES (?)',
        [typeArticle.name]
    );
    return result.insertId;
};

const getTypeArticles = async () => {
    const [typeArticles] = await db.query('SELECT * FROM typeArticle');
    return typeArticles;
};

const getTypeArticleById = async (id) => {
    const [typeArticles] = await db.query('SELECT * FROM typeArticle WHERE id = ?', [id]);
    return typeArticles[0];
};

const updateTypeArticle = async (id, typeArticle) => {
    await db.query(
        'UPDATE typeArticle SET name = ? WHERE id = ?',
        [typeArticle.name, id]
    );
};

const deleteTypeArticle = async (id) => {
    await db.query('DELETE FROM typeArticle WHERE id = ?', [id]);
};

module.exports = {
    // Foyer
    createFoyer,
    getFoyers,
    getFoyerById,
    updateFoyer,
    deleteFoyer,
    
    // Indice
    createIndice,
    getIndices,
    getIndiceById,
    updateIndice,
    deleteIndice,
    
    // Design
    createDesign,
    getDesigns,
    getDesignById,
    updateDesign,
    deleteDesign,
    
    // Couleur Photo
    createCouleurPhoto,
    getCouleurPhotos,
    getCouleurPhotoById,
    updateCouleurPhoto,
    deleteCouleurPhoto,
    
    // Traitement
    createTraitement,
    getTraitements,
    getTraitementById,
    updateTraitement,
    deleteTraitement,
    
    // Type Article
    createTypeArticle,
    getTypeArticles,
    getTypeArticleById,
    updateTypeArticle,
    deleteTypeArticle
}; 