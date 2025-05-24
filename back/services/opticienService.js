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

// Get opticien permissions
const getOpticienPermissions = async (opticienId) => {
  const [permissions] = await db.query(
    'SELECT component_id, has_access FROM opticien_permissions WHERE opticien_id = ?',
    [opticienId]
  );
  return permissions;
};

// Update opticien permissions
const updateOpticienPermissions = async (opticienId, permissions) => {
  // Start a transaction
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Delete existing permissions
    await connection.query(
      'DELETE FROM opticien_permissions WHERE opticien_id = ?',
      [opticienId]
    );

    // Insert new permissions
    for (const permission of permissions) {
      await connection.query(
        'INSERT INTO opticien_permissions (opticien_id, component_id, has_access) VALUES (?, ?, ?)',
        [opticienId, permission.componentId, permission.hasAccess]
      );
    }

    await connection.commit();
    return permissions;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Check if opticien has access to a component
const checkOpticienAccess = async (opticienId, componentId) => {
  const [permissions] = await db.query(
    'SELECT has_access FROM opticien_permissions WHERE opticien_id = ? AND component_id = ?',
    [opticienId, componentId]
  );
  return permissions.length > 0 ? permissions[0].has_access : false;
};

module.exports = {
    getAllOpticiens,
    getOpticienById,
    createOpticien,
    updateOpticien,
    deleteOpticien,
    getOpticienPermissions,
    updateOpticienPermissions,
    checkOpticienAccess
}; 