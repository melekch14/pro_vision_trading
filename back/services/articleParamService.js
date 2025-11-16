const db = require('../models/db');

// Foyer CRUD
const createFoyer = async (foyer) => {
    const [result] = await db.query(
        'INSERT INTO foyer (name, description) VALUES (?, ?)',
        [foyer.name, foyer.description]
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
        'UPDATE foyer SET name = ?, description = ? WHERE id = ?',
        [foyer.name, foyer.description, id]
    );
};

const deleteFoyer = async (id) => {
    await db.query('DELETE FROM foyer WHERE id = ?', [id]);
};

// Indice CRUD
const createIndice = async (indice) => {
    const [result] = await db.query(
        'INSERT INTO indice (name, description) VALUES (?, ?)',
        [indice.name, indice.description]
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
        'UPDATE indice SET name = ?, description = ? WHERE id = ?',
        [indice.name, indice.description, id]
    );
};

const deleteIndice = async (id) => {
    await db.query('DELETE FROM indice WHERE id = ?', [id]);
};

// Design CRUD
const createDesign = async (design) => {
    const [result] = await db.query(
        'INSERT INTO design (name, description) VALUES (?, ?)',
        [design.name, design.description]
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
        'UPDATE design SET name = ?, description = ? WHERE id = ?',
        [design.name, design.description, id]
    );
};

const deleteDesign = async (id) => {
    await db.query('DELETE FROM design WHERE id = ?', [id]);
};

// Couleur Photo CRUD
const createCouleurPhoto = async (couleurPhoto) => {
    const [result] = await db.query(
        'INSERT INTO couleur_photo (name, description) VALUES (?, ?)',
        [couleurPhoto.name, couleurPhoto.description]
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
        'UPDATE couleur_photo SET name = ?, description = ? WHERE id = ?',
        [couleurPhoto.name, couleurPhoto.description, id]
    );
};

const deleteCouleurPhoto = async (id) => {
    await db.query('DELETE FROM couleur_photo WHERE id = ?', [id]);
};

// Traitement CRUD
const createTraitement = async (traitement) => {
    const [result] = await db.query(
        'INSERT INTO traitement (name, description) VALUES (?, ?)',
        [traitement.name, traitement.description]
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
        'UPDATE traitement SET name = ?, description = ? WHERE id = ?',
        [traitement.name, traitement.description, id]
    );
};

const deleteTraitement = async (id) => {
    await db.query('DELETE FROM traitement WHERE id = ?', [id]);
};

// Type Article CRUD
const createTypeArticle = async (typeArticle) => {
    const [result] = await db.query(
        'INSERT INTO typeArticle (name, description) VALUES (?, ?)',
        [typeArticle.name, typeArticle.description]
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
        'UPDATE typeArticle SET name = ?, description = ? WHERE id = ?',
        [typeArticle.name, typeArticle.description, id]
    );
};

const deleteTypeArticle = async (id) => {
    await db.query('DELETE FROM typeArticle WHERE id = ?', [id]);
};

// Bulk Import with duplicate checking
const importBulk = async (importData) => {
    let totalCreated = 0;
    let totalSkipped = 0;

    // Helper function to check if name exists and create if not
    const processType = async (type, names, createFunc, getFunc) => {
        let created = 0;
        let skipped = 0;

        if (!names || names.length === 0) {
            return { created, skipped };
        }

        // Get existing items
        const existing = await getFunc();
        const existingNames = new Set(existing.map(item => item.name.toLowerCase().trim()));

        for (const name of names) {
            const trimmedName = name.trim();
            if (!trimmedName) continue;

            // Check for duplicates (case-insensitive)
            if (existingNames.has(trimmedName.toLowerCase())) {
                skipped++;
                continue;
            }

            try {
                // Create new item with name in both name and description fields
                await createFunc({ name: trimmedName, description: trimmedName });
                existingNames.add(trimmedName.toLowerCase());
                created++;
            } catch (error) {
                // If error is due to duplicate (race condition), skip it
                if (error.message && error.message.includes('Duplicate')) {
                    skipped++;
                } else {
                    throw error;
                }
            }
        }

        return { created, skipped };
    };

    // Process each type
    if (importData['foyers']) {
        const result = await processType('foyers', importData['foyers'], createFoyer, getFoyers);
        totalCreated += result.created;
        totalSkipped += result.skipped;
    }

    if (importData['indices']) {
        const result = await processType('indices', importData['indices'], createIndice, getIndices);
        totalCreated += result.created;
        totalSkipped += result.skipped;
    }

    if (importData['designs']) {
        const result = await processType('designs', importData['designs'], createDesign, getDesigns);
        totalCreated += result.created;
        totalSkipped += result.skipped;
    }

    if (importData['couleur-photos']) {
        const result = await processType('couleur-photos', importData['couleur-photos'], createCouleurPhoto, getCouleurPhotos);
        totalCreated += result.created;
        totalSkipped += result.skipped;
    }

    if (importData['traitements']) {
        const result = await processType('traitements', importData['traitements'], createTraitement, getTraitements);
        totalCreated += result.created;
        totalSkipped += result.skipped;
    }

    if (importData['type-articles']) {
        const result = await processType('type-articles', importData['type-articles'], createTypeArticle, getTypeArticles);
        totalCreated += result.created;
        totalSkipped += result.skipped;
    }

    return { created: totalCreated, skipped: totalSkipped };
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
    deleteTypeArticle,
    
    // Bulk Import
    importBulk
}; 