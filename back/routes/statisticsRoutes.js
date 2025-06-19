const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');

// Get total revenue
router.get('/revenue', statisticsController.getTotalRevenue);

// Get total orders count
router.get('/orders/total', statisticsController.getTotalOrders);

// Get pending orders count
router.get('/orders/pending', statisticsController.getPendingOrders);

// Get orders grouped by status
router.get('/orders/by-status', statisticsController.getOrdersByStatus);

// Get last 5 orders
router.get('/orders/last-five', statisticsController.getLastFiveOrders);

// Get all dashboard statistics (main endpoint)
router.get('/dashboard', statisticsController.getDashboardStatistics);

module.exports = router; 