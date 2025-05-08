const authService = require('../services/authService');

exports.register = async (req, res) => {
    const { type } = req.params;
    try {
        await authService.registerUser(req.body, type);
        res.status(201).json({ message: 'Registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
