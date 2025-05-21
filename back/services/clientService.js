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
        `INSERT INTO client (codee, raison_social, email, password, responsable, tel, status, adresse) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            clientData.codeee,
            clientData.raison_social,
            clientData.email,
            hashedPassword,
            clientData.responsable,
            clientData.tel,
            clientData.status || 'active', // Default status if not provided
            clientData.adresse
        ]
    );
    return result.insertId;
};

// Update client
const updateClient = async (id, clientData) => {
    const updateFields = [];
    const values = [];

    // Build dynamic update query based on provided fields
    if (clientData.codee) {
        updateFields.push('codee = ?');
        values.push(clientData.codee);
    }
    if (clientData.raison_social) {
        updateFields.push('raison_social = ?');
        values.push(clientData.raison_social);
    }
    if (clientData.email) {
        updateFields.push('email = ?');
        values.push(clientData.email);
    }
    if (clientData.password) {
        const hashedPassword = await bcrypt.hash(clientData.password, 10);
        updateFields.push('password = ?');
        values.push(hashedPassword);
    }
    if (clientData.responsable) {
        updateFields.push('responsable = ?');
        values.push(clientData.responsable);
    }
    if (clientData.tel) {
        updateFields.push('tel = ?');
        values.push(clientData.tel);
    }
    if (clientData.status) {
        updateFields.push('status = ?');
        values.push(clientData.status);
    }
    if (clientData.adresse) {
        updateFields.push('adresse = ?');
        values.push(clientData.adresse);
    }

    if (updateFields.length === 0) {
        return null;
    }

    values.push(id);
    const [result] = await db.query(
        `UPDATE client SET ${updateFields.join(', ')} WHERE id = ?`,
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