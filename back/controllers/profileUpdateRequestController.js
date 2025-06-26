const profileUpdateRequestService = require('../services/profileUpdateRequestService');
const jwt = require('jsonwebtoken');

// Helper function to get user ID from token
const getUserIdFromToken = (req) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.id;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

// Create a new profile update request
const createProfileUpdateRequest = async (req, res) => {
    try {
        const { clientId, requestedData } = req.body;
        
        if (!clientId || !requestedData) {
            return res.status(400).json({ message: 'Client ID and requested data are required' });
        }

        const requestId = await profileUpdateRequestService.createProfileUpdateRequest(clientId, requestedData);
        res.status(201).json({ 
            id: requestId,
            message: 'Profile update request submitted successfully. Waiting for admin approval.' 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all profile update requests (admin only)
const getAllProfileUpdateRequests = async (req, res) => {
    try {
        const requests = await profileUpdateRequestService.getAllProfileUpdateRequests();
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get profile update requests by status (admin only)
const getProfileUpdateRequestsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const requests = await profileUpdateRequestService.getProfileUpdateRequestsByStatus(status);
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get profile update request by ID
const getProfileUpdateRequestById = async (req, res) => {
    try {
        const request = await profileUpdateRequestService.getProfileUpdateRequestById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Profile update request not found' });
        }
        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get pending requests for a specific client
const getPendingRequestsByClientId = async (req, res) => {
    try {
        const { clientId } = req.params;
        const requests = await profileUpdateRequestService.getPendingRequestsByClientId(clientId);
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Approve a profile update request (admin only)
const approveProfileUpdateRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { adminNotes } = req.body;
        const adminId = getUserIdFromToken(req);

        

        const success = await profileUpdateRequestService.approveProfileUpdateRequest(requestId, adminId, adminNotes);
        if (!success) {
            return res.status(404).json({ message: 'Profile update request not found or could not be approved' });
        }
        res.json({ message: 'Profile update request approved successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reject a profile update request (admin only)
const rejectProfileUpdateRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { adminNotes } = req.body;
        const adminId = getUserIdFromToken(req);

        const success = await profileUpdateRequestService.rejectProfileUpdateRequest(requestId, adminId, adminNotes);
        if (!success) {
            return res.status(404).json({ message: 'Profile update request not found or could not be rejected' });
        }
        res.json({ message: 'Profile update request rejected successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a profile update request
const deleteProfileUpdateRequest = async (req, res) => {
    try {
        const success = await profileUpdateRequestService.deleteProfileUpdateRequest(req.params.id);
        if (!success) {
            return res.status(404).json({ message: 'Profile update request not found' });
        }
        res.json({ message: 'Profile update request deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createProfileUpdateRequest,
    getAllProfileUpdateRequests,
    getProfileUpdateRequestsByStatus,
    getProfileUpdateRequestById,
    getPendingRequestsByClientId,
    approveProfileUpdateRequest,
    rejectProfileUpdateRequest,
    deleteProfileUpdateRequest
}; 