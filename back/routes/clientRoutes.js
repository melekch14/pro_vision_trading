const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// Get all clients
router.get('/', clientController.getAllClients);

// Get client by ID
router.get('/:id', clientController.getClientById);

// Create new client
router.post('/', clientController.createClient);

// Import clients from Excel file
router.post('/import', clientController.getUploadMiddleware(), clientController.importClientsFromExcel);

// Update client
router.put('/:id', clientController.updateClient);

// Delete client
router.delete('/:id', clientController.deleteClient);

// Update client status
router.patch('/:id/status', clientController.updateClientStatus);

// Get client credentials (with password visibility rules)
router.get('/:id/credentials', clientController.getClientCredentials);

// Check if client password can be viewed
router.get('/:id/can-view-password', clientController.canViewClientPassword);

// Get all clients with password status
router.get('/password-status/all', clientController.getAllClientsWithPasswordStatus);

module.exports = router; 