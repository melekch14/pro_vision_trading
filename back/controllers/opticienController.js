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
        if (error.message === 'Email already exists for a client') {
            return res.status(400).json({ message: error.message });
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
        if (error.message === 'Email already exists for a client') {
            return res.status(400).json({ message: error.message });
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

// Get opticien permissions
const getOpticienPermissions = async (req, res) => {
    try {
        const permissions = await opticienService.getOpticienPermissions(req.params.id);
        res.json(permissions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update opticien permissions
const updateOpticienPermissions = async (req, res) => {
    try {
        // Get the target opticien
        const targetOpticien = await opticienService.getOpticienById(req.params.id);
        if (!targetOpticien) {
            return res.status(404).json({ error: 'Opticien not found' });
        }
        
        // Check if the target user is an assistant
        if (targetOpticien.role !== 'assistant') {
            return res.status(400).json({ error: 'Permissions can only be managed for assistants' });
        }

        const permissions = await opticienService.updateOpticienPermissions(req.params.id, req.body);
        res.json(permissions);
    } catch (err) {
        console.error('Error updating permissions:', err);
        res.status(500).json({ error: err.message });
    }
};

// Check opticien access to a component
const checkOpticienAccess = async (req, res) => {
    try {
        const hasAccess = await opticienService.checkOpticienAccess(
            req.params.id,
            req.params.componentId
        );
        res.json({ hasAccess });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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
