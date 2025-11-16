const blService = require('../services/blService');

// Get all BL records
const getAllBl = async (req, res) => {
    try {
        const blRecords = await blService.getAllBl();
        res.json(blRecords);
    } catch (error) {
        console.error('Error fetching BL records:', error);
        res.status(500).json({ error: 'Failed to fetch BL records' });
    }
};

// Get BL by ID
const getBlById = async (req, res) => {
    try {
        const blRecord = await blService.getBlById(req.params.id);
        if (!blRecord) {
            return res.status(404).json({ error: 'BL record not found' });
        }
        res.json(blRecord);
    } catch (error) {
        console.error('Error fetching BL record:', error);
        res.status(500).json({ error: 'Failed to fetch BL record' });
    }
};

// Get BL by numero
const getBlByNumero = async (req, res) => {
    try {
        const blRecord = await blService.getBlByNumero(req.params.numero);
        if (!blRecord) {
            return res.status(404).json({ error: 'BL record not found' });
        }
        res.json(blRecord);
    } catch (error) {
        console.error('Error fetching BL record by numero:', error);
        res.status(500).json({ error: 'Failed to fetch BL record' });
    }
};

// Create a new BL record
const createBl = async (req, res) => {
    try {
        const blRecord = await blService.createBl(req.body);
        res.status(201).json({
            success: true,
            data: blRecord,
            message: 'BL record created successfully'
        });
    } catch (error) {
        console.error('Error creating BL record:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update BL record
const updateBl = async (req, res) => {
    try {
        const result = await blService.updateBl(req.params.id, req.body);
        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Error updating BL record:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete BL record
const deleteBl = async (req, res) => {
    try {
        const result = await blService.deleteBl(req.params.id);
        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Error deleting BL record:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Import BL data from Excel file
const importBlFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const result = await blService.importBlFromExcel(req.file.path);
        res.json({
            success: true,
            message: result.message,
            importedCount: result.importedCount,
            totalRecords: result.totalRecords
        });
    } catch (error) {
        console.error('Error importing BL data:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Search BL records
const searchBl = async (req, res) => {
    try {
        const { searchTerm } = req.query;
        if (!searchTerm) {
            return res.status(400).json({
                success: false,
                message: 'Search term is required'
            });
        }

        const blRecords = await blService.searchBl(searchTerm);
        res.json({
            success: true,
            data: blRecords,
            count: blRecords.length
        });
    } catch (error) {
        console.error('Error searching BL records:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get BL statistics
const getBlStatistics = async (req, res) => {
    try {
        const statistics = await blService.getBlStatistics();
        res.json({
            success: true,
            data: statistics
        });
    } catch (error) {
        console.error('Error fetching BL statistics:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get upload middleware
const getUploadMiddleware = () => {
    return blService.getUploadMiddleware();
};

module.exports = {
    getAllBl,
    getBlById,
    getBlByNumero,
    createBl,
    updateBl,
    deleteBl,
    importBlFromExcel,
    searchBl,
    getBlStatistics,
    getUploadMiddleware
};

