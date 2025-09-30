const db = require('../models/db');
const bcrypt = require('bcryptjs');
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
    cb(null, `client_import_${timestamp}${extension}`);
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

// Generate unique client code
const generateUniqueClientCode = async () => {
    let code;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loop
    
    while (!isUnique && attempts < maxAttempts) {
        // Generate a random 4-digit number
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        code = `C${randomNum}`;
        
        // Check if code already exists
        const [existingClients] = await db.query('SELECT id FROM client WHERE codee = ?', [code]);
        if (existingClients.length === 0) {
            isUnique = true;
        }
        attempts++;
    }
    
    if (!isUnique) {
        throw new Error('Unable to generate unique client code after maximum attempts');
    }
    
    return code;
};

// Get all clients
const getAllClients = async () => {
    const [clients] = await db.query('SELECT * FROM client');
    return clients;
};

// Get client by ID
const getClientById = async (id) => {
    const [clients] = await db.query('SELECT * FROM client WHERE id = ?', [id]);
    return clients[0];
};

// Create new client
const createClient = async (clientData) => {
    const hashedPassword = await bcrypt.hash(clientData.password, 10);
    
    // Generate unique client code if not provided
    let clientCode = clientData.codee;
    if (!clientCode) {
        clientCode = await generateUniqueClientCode();
    }
    
    const [result] = await db.query(
        `INSERT INTO client (codee, raison_social, email, password, responsable, tel, fax, ville, status, adresse, risque, rccm, ninea, code_douane, password_updated, email_updated, imported_from_excel) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            clientCode,
            clientData.raison_social,
            clientData.email,
            hashedPassword,
            clientData.responsable,
            clientData.tel,
            clientData.fax || null,
            clientData.ville || null,
            clientData.status || 'pending',
            clientData.adresse,
            clientData.risque || null,
            clientData.rccm,
            clientData.ninea,
            clientData.code_douane,
            clientData.password_updated || false,
            clientData.email_updated || false,
            clientData.imported_from_excel || false
        ]
    );
    return { insertId: result.insertId, codee: clientCode };
};

// Update client
const updateClient = async (id, clientData) => {
    const updates = [];
    const values = [];

    // Get current client data
    const currentClient = await getClientById(id);

    // Handle client code update with uniqueness check
    if (clientData.codee) {
        const incomingCode = clientData.codee.trim();
        const currentCode = (currentClient.codee || '').trim();
        if (incomingCode !== currentCode) {
            // Check if the new code already exists for another client
            const [existingClients] = await db.query('SELECT id FROM client WHERE codee = ? AND id != ?', [clientData.codee, id]);
            if (existingClients.length > 0) {
                throw new Error('Client code already exists');
            }
        }
        updates.push('codee = ?');
        values.push(clientData.codee);
    }

    if (clientData.raison_social) {
        updates.push('raison_social = ?');
        values.push(clientData.raison_social);
    }
    if (clientData.email) {
        const incomingEmail = clientData.email.trim().toLowerCase();
        const currentEmail = (currentClient.email || '').trim().toLowerCase();
        if (incomingEmail !== currentEmail) {
            // Check if the new email already exists for another client
            const [existingClients] = await db.query('SELECT id FROM client WHERE email = ? AND id != ?', [clientData.email, id]);
            if (existingClients.length > 0) {
                throw new Error('Email already exists');
            }
        }
        updates.push('email = ?');
        values.push(clientData.email);
    }
    if (clientData.password) {
        // Check if client meets conditions for password update
        const canUpdatePassword = currentClient.status === 'active' && 
                                 (currentClient.imported_from_excel === 1 || currentClient.imported_from_excel === true) && 
                                 (currentClient.password_updated === 0 || currentClient.password_updated === false);
        
        if (!canUpdatePassword) {
            throw new Error('Password can only be updated for active, imported clients who haven\'t updated their password yet.');
        }
        
        const hashedPassword = await bcrypt.hash(clientData.password, 10);
        updates.push('password = ?');
        values.push(hashedPassword);
        // Mark password as updated when admin sets it
        updates.push('password_updated = ?');
        values.push(true);
    }
    if (clientData.responsable) {
        updates.push('responsable = ?');
        values.push(clientData.responsable);
    }
    if (clientData.tel) {
        updates.push('tel = ?');
        values.push(clientData.tel);
    }
    if (clientData.fax !== undefined) {
        updates.push('fax = ?');
        values.push(clientData.fax);
    }
    if (clientData.ville) {
        updates.push('ville = ?');
        values.push(clientData.ville);
    }
    if (clientData.status) {
        updates.push('status = ?');
        values.push(clientData.status);
    }
    if (clientData.adresse) {
        updates.push('adresse = ?');
        values.push(clientData.adresse);
    }
    if (clientData.risque !== undefined) {
        updates.push('risque = ?');
        values.push(clientData.risque);
    }
    if (clientData.rccm) {
        updates.push('rccm = ?');
        values.push(clientData.rccm);
    }
    if (clientData.ninea) {
        updates.push('ninea = ?');
        values.push(clientData.ninea);
    }
    if (clientData.code_douane) {
        updates.push('code_douane = ?');
        values.push(clientData.code_douane);
    }

    if (updates.length === 0) {
        return false;
    }

    values.push(id);
    const [result] = await db.query(
        `UPDATE client SET ${updates.join(', ')} WHERE id = ?`,
        values
    );
    
    return result.affectedRows > 0;
};

// Delete client
const deleteClient = async (id) => {
    const [result] = await db.query('DELETE FROM client WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

// Generate random email and password for imported clients
const generateRandomEmail = (name) => {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${cleanName}${randomNum}@temp.com`;
};

const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

// Import clients from Excel file
const importClientsFromExcel = async (filePath) => {
    try {
        // Read the Excel file
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Skip header row and process data
        const clientRecords = [];
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            
            // Skip empty rows
            if (!row[0]) continue;
            
            const name = row[1] ? row[1].toString().trim() : '';
            if (!name) continue; // Skip if no name provided
            
            const clientRecord = {
                codee: row[0] ? row[0].toString().trim() : '',
                raison_social: name,
                responsable: name, // Fill with nom & prenom
                tel: row[4] ? row[4].toString().trim() : '',
                fax: row[5] ? row[5].toString().trim() : '',
                adresse: row[2] ? row[2].toString().trim() : '',
                ville: row[3] ? row[3].toString().trim() : '',
                risque: row[6] ? row[6].toString().trim() : '',
                email: generateRandomEmail(name),
                password: generateRandomPassword(),
                status: 'pending',
                rccm: '',
                ninea: '',
                code_douane: '',
                imported_from_excel: true // Mark as imported from Excel
            };
            
            clientRecords.push(clientRecord);
        }
        
        // Insert records into database
        const insertedRecords = [];
        const clientCredentials = []; // Store credentials for return
        
        for (const record of clientRecords) {
            try {
                const result = await createClient(record);
                insertedRecords.push(result);
                
                // Store the original password before hashing for display
                // Only show password for imported clients (they start with password_updated = false)
                clientCredentials.push({
                    codee: record.codee,
                    raison_social: record.raison_social,
                    email: record.email,
                    password: record.password, // Original unhashed password
                    passwordUpdated: false, // New imported clients haven't updated password yet
                    importedFromExcel: true
                });
            } catch (error) {
                console.error(`Error inserting client ${record.codee}:`, error.message);
                // Continue with other records even if one fails
            }
        }
        
        // Clean up the uploaded file
        fs.unlinkSync(filePath);
        
        return {
            message: `Successfully imported ${insertedRecords.length} clients`,
            importedCount: insertedRecords.length,
            totalRecords: clientRecords.length,
            clientCredentials: clientCredentials // Include credentials in response
        };
    } catch (error) {
        // Clean up file if it exists
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        throw new Error(`Error importing clients: ${error.message}`);
    }
};

// Get client credentials (only for imported clients who haven't updated their password)
const getClientCredentials = async (clientId) => {
    const [clients] = await db.query(
        'SELECT id, codee, raison_social, email, password_updated, imported_from_excel FROM client WHERE id = ?',
        [clientId]
    );
    
    if (clients.length === 0) {
        throw new Error('Client not found');
    }
    
    const client = clients[0];
    
    // Only show credentials for clients imported from Excel
    if (!client.imported_from_excel) {
        return {
            codee: client.codee,
            raison_social: client.raison_social,
            email: client.email,
            password: null,
            passwordUpdated: null,
            importedFromExcel: false,
            message: 'This client was not imported from Excel. Password visibility is not available.'
        };
    }
    
    // Check if password has been updated
    if (client.password_updated) {
        return {
            codee: client.codee,
            raison_social: client.raison_social,
            email: client.email,
            password: null,
            passwordUpdated: true,
            importedFromExcel: true,
            message: 'Password has been updated by client and is no longer visible.'
        };
    }
    
    // For imported clients who haven't updated their password
    // Note: We cannot retrieve the original password from database as it's hashed
    return {
        codee: client.codee,
        raison_social: client.raison_social,
        email: client.email,
        password: null, // Original password is not retrievable from database
        passwordUpdated: false,
        importedFromExcel: true,
        message: 'This client was imported from Excel and hasn\'t updated their password, but the original password is not retrievable from the database.'
    };
};

// Check if client password can be viewed (conditions check)
const canViewClientPassword = async (clientId) => {
    const [clients] = await db.query(
        'SELECT id, codee, raison_social, email, password_updated, imported_from_excel, status FROM client WHERE id = ?',
        [clientId]
    );
    
    if (clients.length === 0) {
        throw new Error('Client not found');
    }
    
    const client = clients[0];
    
    // Check all conditions
    const conditions = {
        isActive: client.status === 'active',
        isImported: client.imported_from_excel === 1 || client.imported_from_excel === true,
        passwordNotUpdated: client.password_updated === 0 || client.password_updated === false
    };
    
    const canView = conditions.isActive && conditions.isImported && conditions.passwordNotUpdated;
    
    return {
        canViewPassword: canView,
        conditions: conditions,
        clientInfo: {
            id: client.id,
            codee: client.codee,
            raison_social: client.raison_social,
            email: client.email,
            status: client.status,
            importedFromExcel: client.imported_from_excel,
            passwordUpdated: client.password_updated
        },
        message: canView 
            ? 'Password can be viewed for this client.' 
            : 'Password cannot be viewed. Check conditions: Active status, Imported from Excel, Password not updated.'
    };
};

// Reset client password (admin only)
const resetClientPassword = async (clientId, newPassword) => {
    const [clients] = await db.query(
        'SELECT id, codee, raison_social, email, status, imported_from_excel, password_updated FROM client WHERE id = ?',
        [clientId]
    );
    
    if (clients.length === 0) {
        throw new Error('Client not found');
    }
    
    const client = clients[0];
    
    // Check if client meets the conditions for password reset
    const canReset = client.status === 'active' && 
                    (client.imported_from_excel === 1 || client.imported_from_excel === true) && 
                    (client.password_updated === 0 || client.password_updated === false);
    
    if (!canReset) {
        throw new Error('Password can only be reset for active, imported clients who haven\'t updated their password yet.');
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the password and mark as updated by admin
    await db.query(
        'UPDATE client SET password = ?, password_updated = true WHERE id = ?',
        [hashedPassword, clientId]
    );
    
    return {
        success: true,
        message: 'Password has been reset successfully',
        clientInfo: {
            id: client.id,
            codee: client.codee,
            raison_social: client.raison_social,
            email: client.email,
            newPassword: newPassword // Return the new password for admin to share
        }
    };
};

// Get all clients with their password visibility status
const getAllClientsWithPasswordStatus = async () => {
    const [clients] = await db.query(
        'SELECT id, codee, raison_social, email, password_updated, imported_from_excel FROM client ORDER BY id DESC'
    );
    
    return clients.map(client => ({
        id: client.id,
        codee: client.codee,
        raison_social: client.raison_social,
        email: client.email,
        passwordUpdated: client.password_updated,
        importedFromExcel: client.imported_from_excel,
        canShowPassword: client.imported_from_excel && !client.password_updated
    }));
};

// Get upload middleware
const getUploadMiddleware = () => {
    return uploadMiddleware.single('file');
};

module.exports = {
    getAllClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
    generateUniqueClientCode,
    importClientsFromExcel,
    getClientCredentials,
    canViewClientPassword,
    resetClientPassword,
    getAllClientsWithPasswordStatus,
    getUploadMiddleware
}; 