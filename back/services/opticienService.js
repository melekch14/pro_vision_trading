const db = require('../models/db');
const bcrypt = require('bcryptjs');

const normalizeEmail = (email) => (email || '').trim().toLowerCase();

const getAllOpticiens = async () => {
    const [opticiens] = await db.query('SELECT id, codee, nom, prenom, email, role FROM opticien');
    return opticiens;
};

const getOpticienById = async (id) => {
    const [opticiens] = await db.query('SELECT id, codee, nom, prenom, email, role FROM opticien WHERE id = ?', [id]);
    return opticiens[0];
};

const createOpticien = async (opticien) => {
    const incomingEmail = normalizeEmail(opticien.email);
    if (incomingEmail) {
        const [clients] = await db.query(
            'SELECT id FROM client WHERE LOWER(email) = LOWER(?) LIMIT 1',
            [incomingEmail]
        );
        if (clients.length > 0) {
            throw new Error('Email already exists for a client');
        }
    }
    const hashedPassword = await bcrypt.hash(opticien.password, 10);
    const [result] = await db.query(
        `INSERT INTO opticien (codee, nom, prenom, email, password, role) VALUES (?, ?, ?, ?, ?, ?)`,
        [opticien.codee, opticien.nom, opticien.prenom, opticien.email, hashedPassword, opticien.role]
    );
    
    // If the role is 'assistant', create default permissions with 0 access (has_access = false)
    if (opticien.role === 'assistant') {
        const componentIds = [
            'dashboard',
            'article-manager',
            'article-hierarchy',
            'article-params',
            'tickets',
            'orders',
            'customers',
            'fournisseurs',
            'opticiens',
            'activity-history',
            'profile-update-requests',
            'bl',
            'settings'
        ];
        
        // Insert default permissions with has_access = false for all components
        for (const componentId of componentIds) {
            await db.query(
                `INSERT INTO opticien_permissions (opticien_id, component_id, has_access) VALUES (?, ?, ?)`,
                [result.insertId, componentId, false]
            );
        }
    }
    
    return result.insertId;
};

const updateOpticien = async (id, opticien) => {
    // Get current opticien to check if role is changing to 'assistant'
    const currentOpticien = await getOpticienById(id);
    
    const incomingEmail = normalizeEmail(opticien.email);
    const currentEmail = normalizeEmail(currentOpticien ? currentOpticien.email : '');
    if (incomingEmail && incomingEmail !== currentEmail) {
        const [clients] = await db.query(
            'SELECT id FROM client WHERE LOWER(email) = LOWER(?) LIMIT 1',
            [incomingEmail]
        );
        if (clients.length > 0) {
            throw new Error('Email already exists for a client');
        }
    }

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
    
    // If role is being changed to 'assistant' and it wasn't 'assistant' before, create default permissions
    if (result.affectedRows > 0 && opticien.role === 'assistant' && currentOpticien && currentOpticien.role !== 'assistant') {
        const componentIds = [
            'dashboard',
            'article-manager',
            'article-hierarchy',
            'article-params',
            'tickets',
            'orders',
            'customers',
            'fournisseurs',
            'opticiens',
            'activity-history',
            'profile-update-requests',
            'bl',
            'settings'
        ];
        
        // Check if permissions already exist, if not create them with has_access = false
        for (const componentId of componentIds) {
            const [existing] = await db.query(
                'SELECT id FROM opticien_permissions WHERE opticien_id = ? AND component_id = ?',
                [id, componentId]
            );
            
            if (existing.length === 0) {
                await db.query(
                    `INSERT INTO opticien_permissions (opticien_id, component_id, has_access) VALUES (?, ?, ?)`,
                    [id, componentId, false]
                );
            }
        }
    }
    
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
      if (!permission.component_id) {
        throw new Error('Component ID cannot be null');
      }
      await connection.query(
        'INSERT INTO opticien_permissions (opticien_id, component_id, has_access) VALUES (?, ?, ?)',
        [opticienId, permission.component_id, permission.has_access]
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
