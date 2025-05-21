const clientService = require('../services/clientService');

// Get all clients
const getAllClients = async (req, res) => {
    try {
        const clients = await clientService.getAllClients();
        res.json(clients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get client by ID
const getClientById = async (req, res) => {
    try {
        const client = await clientService.getClientById(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        res.json(client);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create new client
const createClient = async (req, res) => {
    try {
        const clientId = await clientService.createClient(req.body);
        res.status(201).json({ id: clientId, message: 'Client created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update client
const updateClient = async (req, res) => {
    try {
        const success = await clientService.updateClient(req.params.id, req.body);
        if (!success) {
            return res.status(404).json({ message: 'Client not found or no changes made' });
        }
        res.json({ message: 'Client updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete client
const deleteClient = async (req, res) => {
    try {
        const success = await clientService.deleteClient(req.params.id);
        if (!success) {
            return res.status(404).json({ message: 'Client not found' });
        }
        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient
}; 