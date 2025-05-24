const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const findUserByEmail = async (email) => {
    const [clients] = await db.query('SELECT * FROM client WHERE email = ?', [email]);
    if (clients.length > 0) {
        return { user: clients[0], role: 'client' };
    }

    const [opticiens] = await db.query('SELECT * FROM opticien WHERE email = ?', [email]);
    if (opticiens.length > 0) {
        return { user: opticiens[0], role: 'opticien' };
    }

    return null;
};

const registerUser = async (user, table) => {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    if (table === 'opticien') {
        await db.query(
            `INSERT INTO opticien (codee, nom, prenom, email, password, role) VALUES (?, ?, ?, ?, ?, ?)`,
            [user.codee, user.nom, user.prenom, user.email, hashedPassword, user.role]
        );
    } else {
        await db.query(
            `INSERT INTO client (codee, raison_social, email, password, responsable, tel, adresse, rccm, ninea, code_douane) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user.codee, user.raison_social, user.email, hashedPassword, user.responsable, user.tel, user.adresse, user.rccm, user.ninea, user.code_douane]
        );
    }
};

const authenticateDynamicUser = async (email, password) => {
    const result = await findUserByEmail(email);
    if (!result) return null;

    const { user, role } = result;
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;
    const token = jwt.sign(
        {
            code: user.code,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );
    return { token };
};

module.exports = { registerUser, authenticateDynamicUser };
