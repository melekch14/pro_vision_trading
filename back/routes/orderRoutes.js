const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Create a new order
router.post('/', orderController.createOrder);

// Get all orders
router.get('/', orderController.getAllOrders);

// Get order by ID
router.get('/:id', orderController.getOrderById);

// Update order
router.put('/:id', orderController.updateOrder);

// Delete order
router.delete('/:id', orderController.deleteOrder);

// Get orders by client ID
router.get('/client/:clientId', orderController.getOrdersByClientId);

module.exports = router; 