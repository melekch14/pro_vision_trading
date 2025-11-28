const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const clientService = require('./clientService');

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
    if (table === 'opticien') {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await db.query(
            `INSERT INTO opticien (codee, nom, prenom, email, password, role) VALUES (?, ?, ?, ?, ?, ?)`,
            [user.codee, user.nom, user.prenom, user.email, hashedPassword, user.role]
        );
        return null;
    } else {
        // Use clientService for client registration to ensure unique code generation
        return await clientService.createClient(user);
    }
};

const authenticateDynamicUser = async (email, password) => {
    const result = await findUserByEmail(email);
    if (!result) return null;

    const { user, role } = result;
    if (role === 'client' && user.status === 'pending') {
        // Prevent login if client is pending approval
        throw new Error('Votre compte est en attente de validation par l\'administrateur.');
    }
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
    } else if (role === 'administrateur' || role === 'assistant') {
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
    const { user, role } = result;

    // Generate token for reset link
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store token and expiry in DB - use appropriate table based on role
    const tableName = role === 'client' ? 'client' : 'opticien';
    await db.query(
        `UPDATE ${tableName} SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?`,
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
    const resetUrl = `http://57.131.29.135:4200/reset-password?token=${token}`;

    const mailOptions = {
        from: '"Pro Vision Trading" <provisiontrading38@gmail.com>',
        to: user.email,
        subject: 'Password Reset Request',
        html: `
        <div style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <div style="background-color: #d9534f; color: white; padding: 30px 20px; text-align: center;">
                    <img src="https://i.imgur.com/S5p6g2v.png" alt="Lock Icon" style="width: 60px; height: auto; margin-bottom: 15px; border-radius: 50%;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Reset Your Password</h1>
                    <p style="margin: 10px 0 0; font-size: 16px;">Secure your account with a new password</p>
                </div>
                <div style="padding: 30px 25px; color: #555; line-height: 1.6;">
                    <p style="font-size: 16px;">Hello,</p>
                    <p style="font-size: 16px;">We received a request to reset the password for your account. If you made this request, click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #d9534f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">Reset Password</a>
                    </div>
                    <div style="background-color: #fcf8e3; border-left: 5px solid #f0ad4e; padding: 15px 20px; margin-bottom: 20px; border-radius: 0 5px 5px 0;">
                        <p style="margin: 0; font-size: 16px;"><strong>Security Notice</strong></p>
                        <p style="margin: 5px 0 0; font-size: 14px;">This link will expire in 1 hour for security reasons. If you didn't request this password reset, please ignore this email or contact our support team.</p>
                    </div>
                    <div style="background-color: #d9edf7; border-left: 5px solid #5bc0de; padding: 15px 20px; margin-bottom: 20px; border-radius: 0 5px 5px 0;">
                        <p style="margin: 0; font-size: 16px;"><strong>Security Tips:</strong></p>
                        <ul style="margin: 10px 0 0; padding-left: 20px; font-size: 14px;">
                            <li>Use a strong, unique password</li>
                            <li>Include a mix of letters, numbers, and symbols</li>
                            <li>Avoid using personal information</li>
                            <li>Consider using a password manager</li>
                        </ul>
                    </div>
                    <p style="font-size: 14px;">If the button above doesn't work, copy and paste this link into your browser:<br>
                    <a href="${resetUrl}" style="color: #d9534f; text-decoration: none;">${resetUrl}</a></p>
                </div>
                <div style="background-color: #343a40; color: #ccc; padding: 20px; text-align: center; font-size: 12px;">
                    <p style="margin: 0;">This is an automated message, please do not reply to this email.</p>
                    <p style="margin: 10px 0 0;">Need help? Contact us at <a href="mailto:security@company.com" style="color: #fff; text-decoration: none;">security@company.com</a></p>
                    <p style="margin: 10px 0 0;">&copy; 2024 Your Company. All rights reserved.</p>
                </div>
            </div>
        </div>
        `
    };

    await transporter.sendMail(mailOptions);
    return true;
};

// Request password reset: generate token, store in DB, send email
const requestPasswordReset = async (email) => {
    const result = await findUserByEmail(email);
    if (!result) throw new Error('User not found');
    const { user, role } = result;

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store token and expiry in DB - use appropriate table based on role
    const tableName = role === 'client' ? 'client' : 'opticien';
    await db.query(
        `UPDATE ${tableName} SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?`,
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
    const resetUrl = `http://57.131.29.135:4200/reset-password?token=${token}`;

    const mailOptions = {
        from: '"Pro Vision Trading" <provisiontrading38@gmail.com>',
        to: user.email,
        subject: 'Password Reset Request',
        html: `
        <div style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <div style="background-color: #d9534f; color: white; padding: 30px 20px; text-align: center;">
                    <img src="https://i.imgur.com/S5p6g2v.png" alt="Lock Icon" style="width: 60px; height: auto; margin-bottom: 15px; border-radius: 50%;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Reset Your Password</h1>
                    <p style="margin: 10px 0 0; font-size: 16px;">Secure your account with a new password</p>
                </div>
                <div style="padding: 30px 25px; color: #555; line-height: 1.6;">
                    <p style="font-size: 16px;">Hello,</p>
                    <p style="font-size: 16px;">We received a request to reset the password for your account. If you made this request, click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #d9534f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">Reset Password</a>
                    </div>
                    <div style="background-color: #fcf8e3; border-left: 5px solid #f0ad4e; padding: 15px 20px; margin-bottom: 20px; border-radius: 0 5px 5px 0;">
                        <p style="margin: 0; font-size: 16px;"><strong>Security Notice</strong></p>
                        <p style="margin: 5px 0 0; font-size: 14px;">This link will expire in 1 hour for security reasons. If you didn't request this password reset, please ignore this email or contact our support team.</p>
                    </div>
                    <div style="background-color: #d9edf7; border-left: 5px solid #5bc0de; padding: 15px 20px; margin-bottom: 20px; border-radius: 0 5px 5px 0;">
                        <p style="margin: 0; font-size: 16px;"><strong>Security Tips:</strong></p>
                        <ul style="margin: 10px 0 0; padding-left: 20px; font-size: 14px;">
                            <li>Use a strong, unique password</li>
                            <li>Include a mix of letters, numbers, and symbols</li>
                            <li>Avoid using personal information</li>
                            <li>Consider using a password manager</li>
                        </ul>
                    </div>
                    <p style="font-size: 14px;">If the button above doesn't work, copy and paste this link into your browser:<br>
                    <a href="${resetUrl}" style="color: #d9534f; text-decoration: none;">${resetUrl}</a></p>
                </div>
                <div style="background-color: #343a40; color: #ccc; padding: 20px; text-align: center; font-size: 12px;">
                    <p style="margin: 0;">This is an automated message, please do not reply to this email.</p>
                    <p style="margin: 10px 0 0;">Need help? Contact us at <a href="mailto:security@company.com" style="color: #fff; text-decoration: none;">security@company.com</a></p>
                    <p style="margin: 10px 0 0;">&copy; 2024 Your Company. All rights reserved.</p>
                </div>
            </div>
        </div>
        `
    };

    await transporter.sendMail(mailOptions);
    return true;
};

// Reset password using token
const resetPassword = async (token, newPassword) => {
    // Find user by token and check expiry - check both client and opticien tables
    console.log(token);
    let user = null;
    let tableName = null;
    
    // First check client table
    const [clientRows] = await db.query(
        'SELECT * FROM client WHERE password_reset_token = ? AND password_reset_expires > NOW()',
        [token]
    );
    
    if (clientRows[0]) {
        user = clientRows[0];
        tableName = 'client';
    } else {
        // Check opticien table
        const [opticienRows] = await db.query(
            'SELECT * FROM opticien WHERE password_reset_token = ? AND password_reset_expires > NOW()',
            [token]
        );
        if (opticienRows[0]) {
            user = opticienRows[0];
            tableName = 'opticien';
        }
    }
    
    if (!user) throw new Error('Invalid or expired token');
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Update password and clear token
    await db.query(
        `UPDATE ${tableName} SET password = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?`,
        [hashedPassword, user.id]
    );
    return true;
};

module.exports = { registerUser, authenticateDynamicUser, decodeClientToken, sendPasswordByEmail, requestPasswordReset, resetPassword };
