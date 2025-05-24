const express = require('express');
const router = express.Router();
const opticienController = require('../controllers/opticienController');

// Get all opticiens
router.get('/', opticienController.getAllOpticiens);

// Get opticien by ID
router.get('/:id', opticienController.getOpticienById);

// Create new opticien
router.post('/', opticienController.createOpticien);

// Update opticien
router.put('/:id', opticienController.updateOpticien);

// Delete opticien
router.delete('/:id', opticienController.deleteOpticien);

// Permission routes
router.get('/:id/permissions', opticienController.getOpticienPermissions);
router.put('/:id/permissions', opticienController.updateOpticienPermissions);
router.get('/:id/access/:componentId', opticienController.checkOpticienAccess);

module.exports = router; 