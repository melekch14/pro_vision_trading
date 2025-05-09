const db = require('../models/db');

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
    deleteSubfamily
}; 