const statisticsService = require('../services/statisticsService');

// Get total revenue
const getTotalRevenue = async (req, res) => {
    try {
        const totalRevenue = await statisticsService.getTotalRevenue();
        res.json({
            success: true,
            totalRevenue
        });
    } catch (error) {
        console.error('Error fetching total revenue:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get total orders count
const getTotalOrders = async (req, res) => {
    try {
        const totalOrders = await statisticsService.getTotalOrders();
        res.json({
            success: true,
            totalOrders
        });
    } catch (error) {
        console.error('Error fetching total orders:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get pending orders count
const getPendingOrders = async (req, res) => {
    try {
        const pendingOrders = await statisticsService.getPendingOrders();
        res.json({
            success: true,
            pendingOrders
        });
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get orders grouped by status
const getOrdersByStatus = async (req, res) => {
    try {
        const ordersByStatus = await statisticsService.getOrdersByStatus();
        res.json({
            success: true,
            ordersByStatus
        });
    } catch (error) {
        console.error('Error fetching orders by status:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get last 5 orders
const getLastFiveOrders = async (req, res) => {
    try {
        const lastFiveOrders = await statisticsService.getLastFiveOrders();
        res.json({
            success: true,
            lastFiveOrders
        });
    } catch (error) {
        console.error('Error fetching last 5 orders:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all dashboard statistics
const getDashboardStatistics = async (req, res) => {
    try {
        const statistics = await statisticsService.getDashboardStatistics();
        res.json({
            success: true,
            ...statistics
        });
    } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getTotalRevenue,
    getTotalOrders,
    getPendingOrders,
    getOrdersByStatus,
    getLastFiveOrders,
    getDashboardStatistics
}; 