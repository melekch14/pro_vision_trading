const db = require('../models/db');

// Create a new profile update request
const createProfileUpdateRequest = async (clientId, requestedData) => {
    // Get current client data for comparison
    const currentClient = await getClientById(clientId);
    if (!currentClient) {
        throw new Error('Client not found');
    }

    // Helper function to normalize values for comparison
    const normalizeValue = (value) => {
        if (value === null || value === undefined) {
            return '';
        }
        return String(value).trim();
    };

    // Filter out unchanged fields and system fields
    const passwordFields = ['password', 'mot_de_passe', 'pwd', 'pass', 'id', 'created_at', 'updated_at'];
    // Fields that clients are allowed to edit (from the profile form)
    const editableFields = ['raison_social', 'responsable', 'email', 'tel', 'adresse', 'rccm', 'ninea', 'code_douane'];
    
    const changedData = {};
    const currentDataForChangedFields = {};

    // Only include fields that actually changed
    for (const key in requestedData) {
        // Skip password fields and system fields
        if (passwordFields.some(pwdField => key.toLowerCase().includes(pwdField))) {
            continue;
        }

        // Skip fields that clients are not allowed to edit (like codee, status, etc.)
        // Only process editable fields
        if (!editableFields.includes(key)) {
            continue;
        }

        // Get current value from the client object
        const currentValue = normalizeValue(currentClient[key]);
        const requestedValue = normalizeValue(requestedData[key]);

        // Only include if the value actually changed
        if (currentValue !== requestedValue) {
            changedData[key] = requestedData[key];
            // Store the current value for this changed field
            currentDataForChangedFields[key] = currentClient[key];
        }
    }

    // If no fields changed, throw an error
    if (Object.keys(changedData).length === 0) {
        throw new Error('No changes detected in the profile update request');
    }

    // Create request data with both current and requested data (only changed fields)
    const requestData = {
        current_data: currentDataForChangedFields,
        requested_data: changedData
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