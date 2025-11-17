const db = require('../models/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

const createFournisseur = async (fournisseur) => {
    const [result] = await db.query(
        `INSERT INTO fournisseur (
            code, raison_social, adresse, mat_vin, tel, fax, email, 
            responsable, id_fiscale, banque, agence, rib, 
            categorie_prix_vente, status, activite_economique, 
            remise, taux_retenue, rccm, ninea, code_douane
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            fournisseur.code,
            fournisseur.raison_social,
            fournisseur.adresse,
            fournisseur.mat_vin,
            fournisseur.tel,
            fournisseur.fax,
            fournisseur.email,
            fournisseur.responsable,
            fournisseur.id_fiscale,
            fournisseur.banque,
            fournisseur.agence,
            fournisseur.rib,
            fournisseur.categorie_prix_vente,
            fournisseur.status,
            fournisseur.activite_economique,
            fournisseur.remise,
            fournisseur.taux_retenue,
            fournisseur.rccm,
            fournisseur.ninea,
            fournisseur.code_douane
        ]
    );
    return result.insertId;
};

const getFournisseurs = async () => {
    const [fournisseurs] = await db.query('SELECT * FROM fournisseur');
    return fournisseurs;
};

const getFournisseurByCode = async (code) => {
    const [fournisseurs] = await db.query('SELECT * FROM fournisseur WHERE code = ?', [code]);
    return fournisseurs[0];
};

const updateFournisseur = async (code, fournisseur) => {
    await db.query(
        `UPDATE fournisseur SET 
            raison_social = ?,
            adresse = ?,
            mat_vin = ?,
            tel = ?,
            fax = ?,
            email = ?,
            responsable = ?,
            id_fiscale = ?,
            banque = ?,
            agence = ?,
            rib = ?,
            categorie_prix_vente = ?,
            status = ?,
            activite_economique = ?,
            remise = ?,
            taux_retenue = ?,
            rccm = ?,
            ninea = ?,
            code_douane = ?
        WHERE code = ?`,
        [
            fournisseur.raison_social,
            fournisseur.adresse,
            fournisseur.mat_vin,
            fournisseur.tel,
            fournisseur.fax,
            fournisseur.email,
            fournisseur.responsable,
            fournisseur.id_fiscale,
            fournisseur.banque,
            fournisseur.agence,
            fournisseur.rib,
            fournisseur.categorie_prix_vente,
            fournisseur.status,
            fournisseur.activite_economique,
            fournisseur.remise,
            fournisseur.taux_retenue,
            fournisseur.rccm,
            fournisseur.ninea,
            fournisseur.code_douane,
            code
        ]
    );
};

const deleteFournisseur = async (code) => {
    await db.query('DELETE FROM fournisseur WHERE code = ?', [code]);
};

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = path.extname(file.originalname);
        cb(null, `fournisseur_import_${timestamp}${extension}`);
    }
});

const uploadMiddleware = multer({
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

// Import fournisseurs from Excel file
const importFournisseursFromExcel = async (filePath) => {
    try {
        // Read the Excel file
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Skip header row and process data
        const fournisseurRecords = [];
        const errors = [];
        
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            
            // Skip empty rows
            if (!row[0]) continue;
            
            const code = row[0] ? row[0].toString().trim() : '';
            const raison_social = row[1] ? row[1].toString().trim() : '';
            
            if (!code || !raison_social) {
                errors.push(`Ligne ${i + 1}: Code et Raison Sociale sont requis`);
                continue;
            }
            
            // Check if code already exists
            const existing = await getFournisseurByCode(code);
            if (existing) {
                errors.push(`Ligne ${i + 1}: Le code ${code} existe déjà`);
                continue;
            }
            
            const fournisseurRecord = {
                code: code,
                raison_social: raison_social,
                adresse: row[2] ? row[2].toString().trim() : '',
                mat_vin: row[3] ? row[3].toString().trim() : '',
                tel: row[4] ? row[4].toString().trim() : '',
                fax: row[5] ? row[5].toString().trim() : '',
                email: row[6] ? row[6].toString().trim() : '',
                responsable: row[7] ? row[7].toString().trim() : '',
                id_fiscale: row[8] ? row[8].toString().trim() : '',
                banque: row[9] ? row[9].toString().trim() : '',
                agence: row[10] ? row[10].toString().trim() : '',
                rib: row[11] ? row[11].toString().trim() : '',
                categorie_prix_vente: row[12] ? row[12].toString().trim() : '',
                status: row[13] ? row[13].toString().trim() : '',
                activite_economique: row[14] ? row[14].toString().trim() : '',
                remise: row[15] ? parseFloat(row[15]) || 0 : 0,
                taux_retenue: row[16] ? parseFloat(row[16]) || 0 : 0,
                rccm: row[17] ? row[17].toString().trim() : '',
                ninea: row[18] ? row[18].toString().trim() : '',
                code_douane: row[19] ? row[19].toString().trim() : ''
            };
            
            fournisseurRecords.push(fournisseurRecord);
        }
        
        // Insert records into database
        let importedCount = 0;
        for (const record of fournisseurRecords) {
            try {
                await createFournisseur(record);
                importedCount++;
            } catch (err) {
                errors.push(`Erreur lors de l'insertion du code ${record.code}: ${err.message}`);
            }
        }
        
        // Clean up uploaded file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        return {
            importedCount,
            totalRecords: jsonData.length - 1, // Exclude header
            errors
        };
    } catch (error) {
        // Clean up uploaded file on error
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        throw error;
    }
};

// Get upload middleware
const getUploadMiddleware = () => {
    return uploadMiddleware.single('file');
};

module.exports = {
    createFournisseur,
    getFournisseurs,
    getFournisseurByCode,
    updateFournisseur,
    deleteFournisseur,
    importFournisseursFromExcel,
    getUploadMiddleware
}; 