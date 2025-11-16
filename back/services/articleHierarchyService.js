const db = require('../models/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

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
    cb(null, `article_hierarchy_import_${timestamp}${extension}`);
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

// Article Groups CRUD
const createGroup = async (group) => {
    const [result] = await db.query(
        'INSERT INTO article_groups (code, name) VALUES (?, ?)',
        [group.code, group.name]
    );
    return result.insertId;
};

const getGroups = async () => {
    const [groups] = await db.query('SELECT * FROM article_groups');
    return groups;
};

const getGroupById = async (id) => {
    const [groups] = await db.query('SELECT * FROM article_groups WHERE id = ?', [id]);
    return groups[0];
};

const updateGroup = async (id, group) => {
    await db.query(
        'UPDATE article_groups SET code = ?, name = ? WHERE id = ?',
        [group.code, group.name, id]
    );
};

const deleteGroup = async (id) => {
    await db.query('DELETE FROM article_groups WHERE id = ?', [id]);
};

// Article Families CRUD
const createFamily = async (family) => {
    const [result] = await db.query(
        'INSERT INTO article_families (code, name, group_id) VALUES (?, ?, ?)',
        [family.code, family.name, family.group_id]
    );
    return result.insertId;
};

const getFamilies = async () => {
    const [families] = await db.query(`
        SELECT f.*, g.name as group_name 
        FROM article_families f 
        JOIN article_groups g ON f.group_id = g.id
    `);
    return families;
};

const getFamilyById = async (id) => {
    const [families] = await db.query(`
        SELECT f.*, g.name as group_name 
        FROM article_families f 
        JOIN article_groups g ON f.group_id = g.id 
        WHERE f.id = ?
    `, [id]);
    return families[0];
};

const updateFamily = async (id, family) => {
    await db.query(
        'UPDATE article_families SET code = ?, name = ?, group_id = ? WHERE id = ?',
        [family.code, family.name, family.group_id, id]
    );
};

const deleteFamily = async (id) => {
    await db.query('DELETE FROM article_families WHERE id = ?', [id]);
};

// Article Subfamilies CRUD
const createSubfamily = async (subfamily) => {
    const [result] = await db.query(
        'INSERT INTO article_subfamilies (code, name, family_id) VALUES (?, ?, ?)',
        [subfamily.code, subfamily.name, subfamily.family_id]
    );
    return result.insertId;
};

const getSubfamilies = async () => {
    const [subfamilies] = await db.query(`
        SELECT s.*, f.name as family_name, g.name as group_name 
        FROM article_subfamilies s 
        JOIN article_families f ON s.family_id = f.id 
        JOIN article_groups g ON f.group_id = g.id
    `);
    return subfamilies;
};

const getSubfamilyById = async (id) => {
    const [subfamilies] = await db.query(`
        SELECT s.*, f.name as family_name, g.name as group_name 
        FROM article_subfamilies s 
        JOIN article_families f ON s.family_id = f.id 
        JOIN article_groups g ON f.group_id = g.id 
        WHERE s.id = ?
    `, [id]);
    return subfamilies[0];
};

const updateSubfamily = async (id, subfamily) => {
    await db.query(
        'UPDATE article_subfamilies SET code = ?, name = ?, family_id = ? WHERE id = ?',
        [subfamily.code, subfamily.name, subfamily.family_id, id]
    );
};

const deleteSubfamily = async (id) => {
    await db.query('DELETE FROM article_subfamilies WHERE id = ?', [id]);
};

// Import from Excel
const importFromExcel = async (filePath) => {
    try {
        // Read the Excel file
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Expected headers: Code Groupe, Nom Groupe, Code famille, Nom famille, Code sous famille, Nom sous famille
        if (jsonData.length < 2) {
            throw new Error('Le fichier Excel doit contenir au moins une ligne d\'en-tête et une ligne de données');
        }
        
        // Skip header row and process data
        const records = [];
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            
            // Skip empty rows
            if (!row[0] && !row[1] && !row[2] && !row[3] && !row[4] && !row[5]) continue;
            
            const groupCode = row[0] ? row[0].toString().trim() : '';
            const groupName = row[1] ? row[1].toString().trim() : '';
            const familyCode = row[2] ? row[2].toString().trim() : '';
            const familyName = row[3] ? row[3].toString().trim() : '';
            const subfamilyCode = row[4] ? row[4].toString().trim() : '';
            const subfamilyName = row[5] ? row[5].toString().trim() : '';
            
            // Validate required fields
            if (!groupCode || !groupName || !familyCode || !familyName || !subfamilyCode || !subfamilyName) {
                continue; // Skip incomplete rows
            }
            
            records.push({
                groupCode,
                groupName,
                familyCode,
                familyName,
                subfamilyCode,
                subfamilyName
            });
        }
        
        let importedCount = 0;
        let ignoredCount = 0;
        const errors = [];
        
        // Process each record
        for (const record of records) {
            try {
                // Check if the complete row already exists
                // A row exists if: group code exists, family code exists for that group, and subfamily code exists for that family
                let [existingGroups] = await db.query('SELECT id FROM article_groups WHERE code = ?', [record.groupCode]);
                
                if (existingGroups.length > 0) {
                    const groupId = existingGroups[0].id;
                    let [existingFamilies] = await db.query(
                        'SELECT id FROM article_families WHERE code = ? AND group_id = ?',
                        [record.familyCode, groupId]
                    );
                    
                    if (existingFamilies.length > 0) {
                        const familyId = existingFamilies[0].id;
                        let [existingSubfamilies] = await db.query(
                            'SELECT id FROM article_subfamilies WHERE code = ? AND family_id = ?',
                            [record.subfamilyCode, familyId]
                        );
                        
                        // If subfamily already exists, this row already exists - ignore it
                        if (existingSubfamilies.length > 0) {
                            ignoredCount++;
                            continue; // Skip this record
                        }
                    }
                }
                
                // Row doesn't exist, proceed with import
                // Find or create group
                let [groups] = await db.query('SELECT id FROM article_groups WHERE code = ?', [record.groupCode]);
                let groupId;
                
                if (groups.length === 0) {
                    // Create new group
                    const [result] = await db.query(
                        'INSERT INTO article_groups (code, name) VALUES (?, ?)',
                        [record.groupCode, record.groupName]
                    );
                    groupId = result.insertId;
                } else {
                    groupId = groups[0].id;
                    // Update group name if different
                    await db.query('UPDATE article_groups SET name = ? WHERE id = ?', [record.groupName, groupId]);
                }
                
                // Find or create family
                let [families] = await db.query(
                    'SELECT id FROM article_families WHERE code = ? AND group_id = ?',
                    [record.familyCode, groupId]
                );
                let familyId;
                
                if (families.length === 0) {
                    // Create new family
                    const [result] = await db.query(
                        'INSERT INTO article_families (code, name, group_id) VALUES (?, ?, ?)',
                        [record.familyCode, record.familyName, groupId]
                    );
                    familyId = result.insertId;
                } else {
                    familyId = families[0].id;
                    // Update family name if different
                    await db.query('UPDATE article_families SET name = ? WHERE id = ?', [record.familyName, familyId]);
                }
                
                // Create subfamily (we already checked it doesn't exist)
                await db.query(
                    'INSERT INTO article_subfamilies (code, name, family_id) VALUES (?, ?, ?)',
                    [record.subfamilyCode, record.subfamilyName, familyId]
                );
                
                importedCount++;
            } catch (error) {
                errors.push(`Erreur pour ${record.groupCode}/${record.familyCode}/${record.subfamilyCode}: ${error.message}`);
            }
        }
        
        // Clean up the uploaded file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        // Build message
        let message = `${importedCount} enregistrement(s) importé(s)`;
        if (ignoredCount > 0) {
            message += `, ${ignoredCount} ligne(s) ignorée(s) (ligne déjà existante)`;
        }
        if (errors.length > 0) {
            message += `, ${errors.length} erreur(s)`;
        }
        if (importedCount > 0 && ignoredCount === 0 && errors.length === 0) {
            message += ' avec succès';
        }
        
        return {
            importedCount,
            ignoredCount,
            totalRecords: records.length,
            message: message,
            errors: errors.length > 0 ? errors : undefined
        };
    } catch (error) {
        // Clean up the uploaded file on error
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        throw new Error(`Erreur lors de l'importation: ${error.message}`);
    }
};

// Get upload middleware
const getUploadMiddleware = () => {
    return upload.single('file');
};

module.exports = {
    // Groups
    createGroup,
    getGroups,
    getGroupById,
    updateGroup,
    deleteGroup,
    
    // Families
    createFamily,
    getFamilies,
    getFamilyById,
    updateFamily,
    deleteFamily,
    
    // Subfamilies
    createSubfamily,
    getSubfamilies,
    getSubfamilyById,
    updateSubfamily,
    deleteSubfamily,
    
    // Import
    importFromExcel,
    getUploadMiddleware
}; 