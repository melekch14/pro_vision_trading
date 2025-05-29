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
        return { user: opticiens[0], role: opticiens[0].role };
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

    let tokenPayload = {
        id: user.id,
        code: user.codee,
        email: user.email,
        role: role
    };

    if (role === 'client') {
        tokenPayload.raison_social = user.raison_social;
    } else if (role === 'opticien') {
        tokenPayload.nom = user.nom;
        tokenPayload.prenom = user.prenom;
    }

    const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    // Log client information if the user is a client
    if (role === 'client') {
        console.log('Client Login Information:');
        console.log('------------------------');
        console.log('ID:', user.id);
        console.log('Code:', user.code);
        console.log('Email:', user.email);
        console.log('Raison Social:', user.raison_social);
        console.log('Role:', role);
        console.log('------------------------');
    }

    return { token };
};

const decodeClientToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role === 'client') {
            console.log('Client Token Information:');
            console.log('------------------------');
            console.log('ID:', decoded.id);
            console.log('Code:', decoded.code);
            console.log('Email:', decoded.email);
            console.log('Raison Social:', decoded.raison_social);
            console.log('Role:', decoded.role);
            console.log('------------------------');
            return decoded;
        }
        return null;
    } catch (error) {
        console.error('Error decoding token:', error.message);
        return null;
    }
};

module.exports = { registerUser, authenticateDynamicUser, decodeClientToken };
