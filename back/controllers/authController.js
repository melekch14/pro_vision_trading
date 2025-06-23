const authService = require('../services/authService');

exports.register = async (req, res) => {
    const { type } = req.params;
    try {
        if (type === 'client') {
            const result = await authService.registerUser(req.body, type);
            res.status(201).json({ 
                message: 'Registered successfully',
                codee: result.codee 
            });
        } else {
            await authService.registerUser(req.body, type);
            res.status(201).json({ message: 'Registered successfully' });
        }
    } catch (err) {
        if (err.message === 'Unable to generate unique client code after maximum attempts') {
            res.status(500).json({ error: 'Unable to generate unique client code. Please try again.' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await authService.authenticateDynamicUser(email, password);
        if (!result) return res.status(401).json({ error: 'Invalid email or password' });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.resetPasswordByEmail = async (req, res) => {
    const { email } = req.body;
    try {
        await authService.sendPasswordByEmail(email);
        res.status(200).json({ message: 'Password reset email sent.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.requestPasswordReset = async (req, res) => {
    const { email } = req.body;
    try {
        await authService.requestPasswordReset(email);
        res.status(200).json({ message: 'Password reset email sent.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    console.log("resetPassword endpoint called");
    console.log("Request body:", req.body);
    const { token, newPassword } = req.body;
    try {
        console.log("Token and newPassword:", token, newPassword);
        await authService.resetPassword(token, newPassword);
        res.status(200).json({ message: 'Password has been reset.' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
