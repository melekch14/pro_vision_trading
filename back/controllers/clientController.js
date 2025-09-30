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
        const result = await clientService.createClient(req.body);
        res.status(201).json({ 
            id: result.insertId, 
            codee: result.codee,
            message: 'Client created successfully' 
        });
    } catch (error) {
        if (error.message === 'Unable to generate unique client code after maximum attempts') {
            res.status(500).json({ message: 'Unable to generate unique client code. Please try again.' });
        } else {
            res.status(500).json({ message: error.message });
        }
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
        if (error.message === 'Client code already exists') {
            res.status(400).json({ message: 'Client code already exists. Please choose a different code.' });
        } else {
            res.status(500).json({ message: error.message });
        }
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

// Update client status (approve/reject)
const updateClientStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const success = await clientService.updateClient(req.params.id, { status });
        if (!success) {
            return res.status(404).json({ message: 'Client not found or no changes made' });
        }
        res.json({ message: 'Client status updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Import clients from Excel file
const importClientsFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const result = await clientService.importClientsFromExcel(req.file.path);
        res.json({
            success: true,
            message: result.message,
            importedCount: result.importedCount,
            totalRecords: result.totalRecords,
            clientCredentials: result.clientCredentials // Include client credentials
        });
    } catch (error) {
        console.error('Error importing client data:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get client credentials (with password visibility rules)
const getClientCredentials = async (req, res) => {
    try {
        const { id } = req.params;
        const credentials = await clientService.getClientCredentials(id);
        res.json({
            success: true,
            data: credentials
        });
    } catch (error) {
        console.error('Error getting client credentials:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all clients with password status
const getAllClientsWithPasswordStatus = async (req, res) => {
    try {
        const clients = await clientService.getAllClientsWithPasswordStatus();
        res.json({
            success: true,
            data: clients
        });
    } catch (error) {
        console.error('Error getting clients with password status:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Check if client password can be viewed
const canViewClientPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await clientService.canViewClientPassword(id);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error checking password visibility:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get upload middleware
const getUploadMiddleware = () => {
    return clientService.getUploadMiddleware();
};

module.exports = {
    getAllClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
    updateClientStatus,
    importClientsFromExcel,
    getClientCredentials,
    canViewClientPassword,
    getAllClientsWithPasswordStatus,
    getUploadMiddleware
}; 