const db = require('../models/db');
const bcrypt = require('bcryptjs');

const getAllOpticiens = async () => {
    const [opticiens] = await db.query('SELECT id, codee, nom, prenom, email, role FROM opticien');
    return opticiens;
};

const getOpticienById = async (id) => {
    const [opticiens] = await db.query('SELECT id, codee, nom, prenom, email, role FROM opticien WHERE id = ?', [id]);
    return opticiens[0];
};

const createOpticien = async (opticien) => {
    const hashedPassword = await bcrypt.hash(opticien.password, 10);
    const [result] = await db.query(
        `INSERT INTO opticien (codee, nom, prenom, email, password, role) VALUES (?, ?, ?, ?, ?, ?)`,
        [opticien.codee, opticien.nom, opticien.prenom, opticien.email, hashedPassword, opticien.role]
    );
    return result.insertId;
};

const updateOpticien = async (id, opticien) => {
    let query = 'UPDATE opticien SET codee = ?, nom = ?, prenom = ?, email = ?, role = ?';
    let params = [opticien.codee, opticien.nom, opticien.prenom, opticien.email, opticien.role];

    if (opticien.password) {
        const hashedPassword = await bcrypt.hash(opticien.password, 10);
        query += ', password = ?';
        params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(id);

    const [result] = await db.query(query, params);
    return result.affectedRows > 0;
};

const deleteOpticien = async (id) => {
    const [result] = await db.query('DELETE FROM opticien WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

module.exports = {
    getAllOpticiens,
    getOpticienById,
    createOpticien,
    updateOpticien,
    deleteOpticien
}; 