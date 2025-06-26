const express = require('express');
const router = express.Router();
const profileUpdateRequestController = require('../controllers/profileUpdateRequestController');

// Create a new profile update request (client)
router.post('/', profileUpdateRequestController.createProfileUpdateRequest);

// Get all profile update requests (admin)
router.get('/', profileUpdateRequestController.getAllProfileUpdateRequests);

// Get profile update requests by status (admin)
router.get('/status/:status', profileUpdateRequestController.getProfileUpdateRequestsByStatus);

// Get profile update request by ID
router.get('/:id', profileUpdateRequestController.getProfileUpdateRequestById);

// Get pending requests for a specific client
router.get('/client/:clientId/pending', profileUpdateRequestController.getPendingRequestsByClientId);

// Approve a profile update request (admin)
router.patch('/:requestId/approve', profileUpdateRequestController.approveProfileUpdateRequest);

// Reject a profile update request (admin)
router.patch('/:requestId/reject', profileUpdateRequestController.rejectProfileUpdateRequest);

// Delete a profile update request
router.delete('/:id', profileUpdateRequestController.deleteProfileUpdateRequest);

module.exports = router; 