const fournisseurService = require('../services/fournisseurService');

exports.createFournisseur = async (req, res) => {
    try {
        const id = await fournisseurService.createFournisseur(req.body);
        res.status(201).json({ id, message: 'Fournisseur created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getFournisseurs = async (req, res) => {
    try {
        const fournisseurs = await fournisseurService.getFournisseurs();
        res.json(fournisseurs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getFournisseurByCode = async (req, res) => {
    try {
        const fournisseur = await fournisseurService.getFournisseurByCode(req.params.code);
        if (!fournisseur) {
            return res.status(404).json({ error: 'Fournisseur not found' });
        }
        res.json(fournisseur);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateFournisseur = async (req, res) => {
    try {
        await fournisseurService.updateFournisseur(req.params.code, req.body);
        res.json({ message: 'Fournisseur updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteFournisseur = async (req, res) => {
    try {
        await fournisseurService.deleteFournisseur(req.params.code);
        res.json({ message: 'Fournisseur deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}; 