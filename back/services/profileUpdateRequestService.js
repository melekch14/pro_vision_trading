const db = require('../models/db');

// Create a new profile update request
const createProfileUpdateRequest = async (clientId, requestedData) => {
    // Get current client data for comparison
    const currentClient = await getClientById(clientId);
    if (!currentClient) {
        throw new Error('Client not found');
    }

    // Create request data with both current and requested data
    const requestData = {
        current_data: {
            raison_social: currentClient.raison_social,
            responsable: currentClient.responsable,
            email: currentClient.email,
            tel: currentClient.tel,
            adresse: currentClient.adresse,
            rccm: currentClient.rccm,
            ninea: currentClient.ninea,
            code_douane: currentClient.code_douane
        },
        requested_data: requestedData
    };

    const [result] = await db.query(
        'INSERT INTO profile_update_requests (client_id, requested_data) VALUES (?, ?)',
        [clientId, JSON.stringify(requestData)]
    );
    return result.insertId;
};

// Get all profile update requests
const getAllProfileUpdateRequests = async () => {
    const [requests] = await db.query(`
        SELECT pur.*, c.raison_social, c.email, c.responsable 
        FROM profile_update_requests pur
        JOIN client c ON pur.client_id = c.id
        ORDER BY pur.created_at DESC
    `);
    return requests;
};

// Get profile update requests by status
const getProfileUpdateRequestsByStatus = async (status) => {
    const [requests] = await db.query(`
        SELECT pur.*, c.raison_social, c.email, c.responsable 
        FROM profile_update_requests pur
        JOIN client c ON pur.client_id = c.id
        WHERE pur.status = ?
        ORDER BY pur.created_at DESC
    `, [status]);
    return requests;
};

// Get profile update request by ID
const getProfileUpdateRequestById = async (id) => {
    const [requests] = await db.query(`
        SELECT pur.*, c.raison_social, c.email, c.responsable 
        FROM profile_update_requests pur
        JOIN client c ON pur.client_id = c.id
        WHERE pur.id = ?
    `, [id]);
    return requests[0];
};

// Get pending profile update requests for a specific client
const getPendingRequestsByClientId = async (clientId) => {
    const [requests] = await db.query(
        'SELECT * FROM profile_update_requests WHERE client_id = ? AND status = "pending" ORDER BY created_at DESC',
        [clientId]
    );
    return requests;
};

// Approve a profile update request
const approveProfileUpdateRequest = async (requestId, adminId, adminNotes = null) => {
    const request = await getProfileUpdateRequestById(requestId);
    if (!request) {
        throw new Error('Profile update request not found');
    }

    if (request.status !== 'pending') {
        throw new Error('Request is not pending');
    }

    // Debug logging
    console.log('Request ID:', requestId);
    console.log('Requested data type:', typeof request.requested_data);
    console.log('Requested data:', request.requested_data);

    // Parse the requested data with proper error handling
    let requestData;
    try {
        // Check if it's already an object or needs parsing
        if (typeof request.requested_data === 'string') {
            requestData = JSON.parse(request.requested_data);
        } else if (typeof request.requested_data === 'object') {
            requestData = request.requested_data;
        } else {
            throw new Error('Invalid requested_data format');
        }
    } catch (error) {
        console.error('Error parsing requested_data:', error);
        throw new Error('Invalid requested_data format: ' + error.message);
    }

    console.log('Parsed request data:', requestData);

    const requestedData = requestData.requested_data;
    if (!requestedData) {
        throw new Error('No requested data found');
    }

    console.log('Final requested data:', requestedData);

    // Update the client profile with the approved data
    const clientService = require('./clientService');
    await clientService.updateClient(request.client_id, requestedData);

    // Update the request status
    const [result] = await db.query(
        'UPDATE profile_update_requests SET status = "approved", admin_notes = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
        [adminNotes, adminId, requestId]
    );

    return result.affectedRows > 0;
};

// Reject a profile update request
const rejectProfileUpdateRequest = async (requestId, adminId, adminNotes = null) => {
    const request = await getProfileUpdateRequestById(requestId);
    if (!request) {
        throw new Error('Profile update request not found');
    }

    if (request.status !== 'pending') {
        throw new Error('Request is not pending');
    }

    // Update the request status
    const [result] = await db.query(
        'UPDATE profile_update_requests SET status = "rejected", admin_notes = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
        [adminNotes, adminId, requestId]
    );

    return result.affectedRows > 0;
};

// Delete a profile update request
const deleteProfileUpdateRequest = async (id) => {
    const [result] = await db.query('DELETE FROM profile_update_requests WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

// Helper function to get client by ID
const getClientById = async (id) => {
    const [clients] = await db.query('SELECT * FROM client WHERE id = ?', [id]);
    return clients[0];
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