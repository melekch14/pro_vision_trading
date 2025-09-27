const express = require('express');
const router = express.Router();
const blController = require('../controllers/blController');

// Get all BL records
router.get('/', blController.getAllBl);

// Get BL statistics
router.get('/statistics', blController.getBlStatistics);

// Search BL records
router.get('/search', blController.searchBl);

// Get BL by ID
router.get('/:id', blController.getBlById);

// Create a new BL record
router.post('/', blController.createBl);

// Import BL data from Excel file
router.post('/import', blController.getUploadMiddleware(), blController.importBlFromExcel);

// Update BL record
router.put('/:id', blController.updateBl);

// Delete BL record
router.delete('/:id', blController.deleteBl);

module.exports = router;
