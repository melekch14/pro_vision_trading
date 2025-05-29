const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const orderService = require('../services/orderService');

// Create a new order
router.post('/', async (req, res) => {
  try {
    const order = await orderService.createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Upload file for an order
router.post('/upload', orderService.getUploadMiddleware(), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await orderService.uploadFile(req.file, req.body.orderId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

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