const db = require('../models/db');
const bcrypt = require('bcryptjs');

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
    const [result] = await db.query(
        `INSERT INTO client (codee, raison_social, email, password, responsable, tel, status, adresse, rccm, ninea, code_douane) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            clientData.codee,
            clientData.raison_social,
            clientData.email,
            hashedPassword,
            clientData.responsable,
            clientData.tel,
            clientData.status || 'active',
            clientData.adresse,
            clientData.rccm,
            clientData.ninea,
            clientData.code_douane
        ]
    );
    return result.insertId;
};

// Update client
const updateClient = async (id, clientData) => {
    const updates = [];
    const values = [];
    
    if (clientData.raison_social) {
        updates.push('raison_social = ?');
        values.push(clientData.raison_social);
    }
    if (clientData.email) {
        updates.push('email = ?');
        values.push(clientData.email);
    }
    if (clientData.password) {
        const hashedPassword = await bcrypt.hash(clientData.password, 10);
        updates.push('password = ?');
        values.push(hashedPassword);
    }
    if (clientData.responsable) {
        updates.push('responsable = ?');
        values.push(clientData.responsable);
    }
    if (clientData.tel) {
        updates.push('tel = ?');
        values.push(clientData.tel);
    }
    if (clientData.status) {
        updates.push('status = ?');
        values.push(clientData.status);
    }
    if (clientData.adresse) {
        updates.push('adresse = ?');
        values.push(clientData.adresse);
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

module.exports = {
    getAllClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient
}; 