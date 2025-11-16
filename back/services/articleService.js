const db = require('../models/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

// Article CRUD
const createArticle = async (article) => {
    const [result] = await db.query(
        `INSERT INTO article (
            code, libelle, diametre, foyer_id, indice_id, design_id, 
            couleur_photo_id, traitement_id, prix_achat, tva, prix_vente, 
            code_a_barre, expiration, fournisseur_id, typeArticle_id, 
            article_subfamily_id, type_stock, origineArticle,
            min_sphere, max_sphere, min_cylindre, max_cylindre, min_addition, max_addition
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            article.code, article.libelle, article.diametre, article.foyer_id, article.indice_id,
            article.design_id, article.couleur_photo_id, article.traitement_id,
            article.prix_achat, article.tva, article.prix_vente, article.code_a_barre, 
            article.expiration, article.fournisseur_id, article.typeArticle_id, 
            article.article_subfamily_id, article.type_stock, article.origineArticle,
            article.min_sphere, article.max_sphere, article.min_cylindre, article.max_cylindre, article.min_addition, article.max_addition
        ]
    );
    return result.insertId;
};

const getArticles = async () => {
    const [articles] = await db.query(`
        SELECT a.*, 
            f.name as foyer_name,
            i.name as indice_name,
            d.name as design_name,
            cp.name as couleur_photo_name,
            t.name as traitement_name,
            fo.responsable as fournisseur_name,
            ta.name as type_article_name
        FROM article a
        LEFT JOIN foyer f ON a.foyer_id = f.id
        LEFT JOIN indice i ON a.indice_id = i.id
        LEFT JOIN design d ON a.design_id = d.id
        LEFT JOIN couleur_photo cp ON a.couleur_photo_id = cp.id
        LEFT JOIN traitement t ON a.traitement_id = t.id
        LEFT JOIN fournisseur fo ON a.fournisseur_id = fo.code
        LEFT JOIN typeArticle ta ON a.typeArticle_id = ta.id
    `);
    return articles;
};

const getArticleById = async (id) => {
    const [articles] = await db.query(`
        SELECT a.*, 
            f.name as foyer_name,
            i.name as indice_name,
            d.name as design_name,
            cp.name as couleur_photo_name,
            t.name as traitement_name,
            fo.responsable as fournisseur_name,
            ta.name as type_article_name
        FROM article a
        LEFT JOIN foyer f ON a.foyer_id = f.id
        LEFT JOIN indice i ON a.indice_id = i.id
        LEFT JOIN design d ON a.design_id = d.id
        LEFT JOIN couleur_photo cp ON a.couleur_photo_id = cp.id
        LEFT JOIN traitement t ON a.traitement_id = t.id
        LEFT JOIN fournisseur fo ON a.fournisseur_id = fo.code
        LEFT JOIN typeArticle ta ON a.typeArticle_id = ta.id
        WHERE a.id = ?
    `, [id]);
    return articles[0];
};

const updateArticle = async (id, article) => {
    await db.query(
        `UPDATE article SET 
            code = ?, libelle = ?, diametre = ?, foyer_id = ?, indice_id = ?, 
            design_id = ?, couleur_photo_id = ?, traitement_id = ?, 
            prix_achat = ?, tva = ?, prix_vente = ?, code_a_barre = ?, 
            expiration = ?, fournisseur_id = ?, typeArticle_id = ?, 
            article_subfamily_id = ?, type_stock = ?, origineArticle = ?,
            min_sphere = ?, max_sphere = ?, min_cylindre = ?, max_cylindre = ?, min_addition = ?, max_addition = ?
        WHERE id = ?`,
        [
            article.code, article.libelle, article.diametre, article.foyer_id, article.indice_id,
            article.design_id, article.couleur_photo_id, article.traitement_id,
            article.prix_achat, article.tva, article.prix_vente, article.code_a_barre, 
            article.expiration, article.fournisseur_id, article.typeArticle_id, 
            article.article_subfamily_id, article.type_stock, article.origineArticle,
            article.min_sphere, article.max_sphere, article.min_cylindre, article.max_cylindre, article.min_addition, article.max_addition, id
        ]
    );
};

const deleteArticle = async (id) => {
    await db.query('DELETE FROM article WHERE id = ?', [id]);
};

// Get all data with hierarchy information
const getAllData = async () => {
    const [articles] = await db.query(`
        SELECT a.*, 
            f.name as foyer_name,
            i.name as indice_name,
            d.name as design_name,
            cp.name as couleur_photo_name,
            t.name as traitement_name,
            fo.responsable as fournisseur_name,
            ta.name as type_article_name,
            sf.code as subfamily_code,
            sf.name as subfamily_name,
            fam.code as family_code,
            fam.name as family_name,
            g.code as group_code,
            g.name as group_name
        FROM article a
        LEFT JOIN foyer f ON a.foyer_id = f.id
        LEFT JOIN indice i ON a.indice_id = i.id
        LEFT JOIN design d ON a.design_id = d.id
        LEFT JOIN couleur_photo cp ON a.couleur_photo_id = cp.id
        LEFT JOIN traitement t ON a.traitement_id = t.id
        LEFT JOIN fournisseur fo ON a.fournisseur_id = fo.code
        LEFT JOIN typeArticle ta ON a.typeArticle_id = ta.id
        LEFT JOIN article_subfamilies sf ON a.article_subfamily_id = sf.id
        LEFT JOIN article_families fam ON sf.family_id = fam.id
        LEFT JOIN article_groups g ON fam.group_id = g.id
    `);
    return articles;
};

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = path.extname(file.originalname);
        cb(null, `article_import_${timestamp}${extension}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Get upload middleware
const getUploadMiddleware = () => {
    return upload.single('file');
};

// Helper function to find ID by name (case insensitive)
const findIdByName = (options, name) => {
    if (!name) return null;
    const found = options.find(opt => opt.name && opt.name.toLowerCase().trim() === name.toLowerCase().trim());
    return found ? found.id : null;
};

// Import articles from Excel
const importArticlesFromExcel = async (filePath) => {
    try {
        // Read the Excel file
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with header row
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
            throw new Error('Le fichier Excel doit contenir au moins une ligne d\'en-tête et une ligne de données');
        }

        // Get header row (first row)
        const headers = jsonData[0].map(h => h ? String(h).trim() : '');
        
        // Get all options for foreign keys
        const [foyers] = await db.query('SELECT id, name FROM foyer');
        const [indices] = await db.query('SELECT id, name FROM indice');
        const [designs] = await db.query('SELECT id, name FROM design');
        const [couleurPhotos] = await db.query('SELECT id, name FROM couleur_photo');
        const [traitements] = await db.query('SELECT id, name FROM traitement');
        const [typeArticles] = await db.query('SELECT id, name FROM typeArticle');
        const [subfamilies] = await db.query(`
            SELECT s.id, s.code, s.name, f.id as family_id, f.code as family_code, f.name as family_name,
                   g.id as group_id, g.code as group_code, g.name as group_name
            FROM article_subfamilies s
            LEFT JOIN article_families f ON s.family_id = f.id
            LEFT JOIN article_groups g ON f.group_id = g.id
        `);

        const articleRecords = [];
        const errors = [];

        // Process data rows (skip header row)
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;

            try {
                // Map Excel columns to values
                const getValue = (columnName) => {
                    const index = headers.findIndex(h => h && h.toLowerCase().includes(columnName.toLowerCase()));
                    if (index >= 0 && index < row.length) {
                        const value = row[index];
                        return value !== undefined && value !== null ? String(value).trim() : '';
                    }
                    return '';
                };

                const codeArticle = getValue('Code ARTICLE') || getValue('code article');
                const libelle = getValue('Libelle') || getValue('libelle');
                
                if (!codeArticle || !libelle) {
                    errors.push(`Ligne ${i + 1}: Code ARTICLE et Libelle sont requis`);
                    continue;
                }

                // Diametre - extract first number if format is "65/70"
                let diametre = null;
                const diametreStr = getValue('Diamètre') || getValue('diametre') || getValue('Diamètre');
                if (diametreStr) {
                    const match = diametreStr.match(/^(\d+)/);
                    if (match) {
                        diametre = parseFloat(match[1]);
                    }
                }

                // Origine Article - case insensitive
                let origineArticle = 'stock';
                const origineStr = getValue('Origine') || getValue('origine') || getValue('Origine (stock / fabrication)');
                if (origineStr) {
                    const origineLower = origineStr.toLowerCase().trim();
                    if (origineLower === 'fabrication') {
                        origineArticle = 'fabrication';
                    } else {
                        origineArticle = 'stock';
                    }
                }

                // Find foreign key IDs by name
                const typeArticleName = getValue('Type d\'article') || getValue('type d\'article') || getValue('Type d\'article');
                const typeArticleId = findIdByName(typeArticles, typeArticleName);

                const indiceName = getValue('Indice') || getValue('indice');
                const indiceId = findIdByName(indices, indiceName);

                const foyerName = getValue('Foyer') || getValue('foyer');
                const foyerId = findIdByName(foyers, foyerName);

                const designName = getValue('Design') || getValue('design');
                const designId = findIdByName(designs, designName);

                const couleurPhotoName = getValue('Couleur photo') || getValue('couleur photo') || getValue('Couleur photo');
                const couleurPhotoId = findIdByName(couleurPhotos, couleurPhotoName);

                const traitementName = getValue('Traitement') || getValue('traitement');
                const traitementId = findIdByName(traitements, traitementName);

                // Find subfamily by code or name
                let articleSubfamilyId = null;
                const subfamilyCode = getValue('Code sous famille') || getValue('code sous famille');
                const subfamilyName = getValue('Nom sous famille') || getValue('nom sous famille');
                if (subfamilyCode || subfamilyName) {
                    const found = subfamilies.find(sf => 
                        (subfamilyCode && sf.code && sf.code.toLowerCase().trim() === subfamilyCode.toLowerCase().trim()) ||
                        (subfamilyName && sf.name && sf.name.toLowerCase().trim() === subfamilyName.toLowerCase().trim())
                    );
                    if (found) {
                        articleSubfamilyId = found.id;
                    }
                }

                // Type de stock - map "cyl" to "cylindre", "add" or "addition" to "addition"
                let typeStock = null;
                const typeStockStr = getValue('Type de stock') || getValue('type de stock') || getValue('Type de stock (addition / cyl)');
                if (typeStockStr) {
                    const typeStockLower = typeStockStr.toLowerCase().trim();
                    if (typeStockLower === 'cyl' || typeStockLower === 'cylindre') {
                        typeStock = 'cylindre';
                    } else if (typeStockLower === 'add' || typeStockLower === 'addition') {
                        typeStock = 'addition';
                    }
                }

                // Prices
                const prixAchatHt = getValue('Prix d\'achat ht') || getValue('prix d\'achat ht');
                const prixAchatTtc = getValue('Prix d\'achat ttc') || getValue('prix d\'achat ttc');
                const prixVenteHt = getValue('Prix de vente ht') || getValue('prix de vente ht');
                const prixVenteTtc = getValue('Prix de vente ttc') || getValue('prix de vente ttc');

                // Use HT if available, otherwise calculate from TTC (assuming 18% TVA)
                let prixAchat = null;
                if (prixAchatHt) {
                    prixAchat = parseFloat(prixAchatHt.toString().replace(',', '.'));
                } else if (prixAchatTtc) {
                    const ttc = parseFloat(prixAchatTtc.toString().replace(',', '.'));
                    prixAchat = ttc / 1.18;
                }

                let prixVente = null;
                if (prixVenteHt) {
                    prixVente = parseFloat(prixVenteHt.toString().replace(',', '.'));
                } else if (prixVenteTtc) {
                    const ttc = parseFloat(prixVenteTtc.toString().replace(',', '.'));
                    prixVente = ttc / 1.18;
                }

                const codeABarre = getValue('Code a barre') || getValue('code a barre') || getValue('Code a barre') || '';

                const articleRecord = {
                    code: codeArticle,
                    libelle: libelle,
                    diametre: diametre,
                    foyer_id: foyerId,
                    indice_id: indiceId,
                    design_id: designId,
                    couleur_photo_id: couleurPhotoId,
                    traitement_id: traitementId,
                    prix_achat: prixAchat,
                    tva: 18,
                    prix_vente: prixVente,
                    code_a_barre: codeABarre || null,
                    expiration: null,
                    fournisseur_id: null, // Always empty as per requirement
                    typeArticle_id: typeArticleId,
                    article_subfamily_id: articleSubfamilyId,
                    type_stock: typeStock,
                    origineArticle: origineArticle,
                    min_sphere: null,
                    max_sphere: null,
                    min_cylindre: null,
                    max_cylindre: null,
                    min_addition: null,
                    max_addition: null
                };

                articleRecords.push(articleRecord);
            } catch (error) {
                errors.push(`Ligne ${i + 1}: ${error.message}`);
            }
        }

        // Insert records into database
        const insertedRecords = [];
        for (const record of articleRecords) {
            try {
                const result = await createArticle(record);
                insertedRecords.push(result);
            } catch (error) {
                errors.push(`Erreur lors de l'insertion de l'article ${record.code}: ${error.message}`);
            }
        }

        // Clean up the uploaded file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return {
            message: `Successfully imported ${insertedRecords.length} articles`,
            importedCount: insertedRecords.length,
            totalRecords: articleRecords.length,
            errors: errors
        };
    } catch (error) {
        // Clean up file if it exists
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        throw new Error(`Error importing articles: ${error.message}`);
    }
};

module.exports = {
    createArticle,
    getArticles,
    getArticleById,
    updateArticle,
    deleteArticle,
    getAllData,
    importArticlesFromExcel,
    getUploadMiddleware
}; 