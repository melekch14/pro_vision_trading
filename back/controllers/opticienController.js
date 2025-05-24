const opticienService = require('../services/opticienService');

const getAllOpticiens = async (req, res) => {
    try {
        const opticiens = await opticienService.getAllOpticiens();
        res.json(opticiens);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getOpticienById = async (req, res) => {
    try {
        const opticien = await opticienService.getOpticienById(req.params.id);
        if (!opticien) {
            return res.status(404).json({ message: 'Opticien not found' });
        }
        res.json(opticien);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createOpticien = async (req, res) => {
    try {
        const opticienId = await opticienService.createOpticien(req.body);
        res.status(201).json({ id: opticienId, message: 'Opticien created successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: error.message });
    }
};

const updateOpticien = async (req, res) => {
    try {
        const success = await opticienService.updateOpticien(req.params.id, req.body);
        if (!success) {
            return res.status(404).json({ message: 'Opticien not found' });
        }
        res.json({ message: 'Opticien updated successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: error.message });
    }
};

const deleteOpticien = async (req, res) => {
    try {
        const success = await opticienService.deleteOpticien(req.params.id);
        if (!success) {
            return res.status(404).json({ message: 'Opticien not found' });
        }
        res.json({ message: 'Opticien deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllOpticiens,
    getOpticienById,
    createOpticien,
    updateOpticien,
    deleteOpticien
}; 