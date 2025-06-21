const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

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
        console.log('Code:', user.codee);
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

// Send password by email (for demonstration, send a placeholder since passwords are hashed)
const sendPasswordByEmail = async (email) => {
    const result = await findUserByEmail(email);
    if (!result) throw new Error('User not found');
    const { user } = result;

    // In a real app, you would generate a reset token and send a reset link
    // Here, we just send a placeholder password message
    const transporter = nodemailer.createTransport({
        service: 'gmail', // or your email provider
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Password Reset Request',
        text: `Hello,\n\nYou requested your password. For security, we cannot send your current password. Please use the password reset feature to set a new password.\n\nIf you did not request this, please ignore this email.`
    };

    await transporter.sendMail(mailOptions);
    return true;
};

// Request password reset: generate token, store in DB, send email
const requestPasswordReset = async (email) => {
    const result = await findUserByEmail(email);
    if (!result || result.role !== 'client') throw new Error('User not found');
    const { user } = result;

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store token and expiry in DB
    await db.query(
        'UPDATE client SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
        [token, expires, user.id]
    );

    // Send email with reset link
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "provisiontrading38@gmail.com",
            pass: "bxoiuulfoyfsrcrl"
        }
    });
    const resetUrl = `http://localhost:4200/reset-password?token=${token}`;
    const mailOptions = {
        from: "provisiontrading38@gmail.com",
        to: user.email,
        subject: 'Password Reset Request',
        text: `Hello,\n\nYou requested a password reset. Please click the link below to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\nIf you did not request this, please ignore this email.`
    };
    await transporter.sendMail(mailOptions);
    return true;
};

// Reset password using token
const resetPassword = async (token, newPassword) => {
    // Find user by token and check expiry
    console.log(token);
    const [rows] = await db.query(
        'SELECT * FROM client WHERE password_reset_token = ? AND password_reset_expires > NOW()',
        [token]
    );
    if (!rows[0]) throw new Error('Invalid or expired token');
    const user = rows[0];
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Update password and clear token
    await db.query(
        'UPDATE client SET password = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
        [hashedPassword, user.id]
    );
    return true;
};

module.exports = { registerUser, authenticateDynamicUser, decodeClientToken, sendPasswordByEmail, requestPasswordReset, resetPassword };
