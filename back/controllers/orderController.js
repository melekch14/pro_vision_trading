const orderService = require('../services/orderService');

// Create a new order
const createOrder = async (req, res) => {
    try {
        const order = await orderService.createOrder(req.body);
        
        // Return the order ID in the response
        res.status(201).json({
            success: true,
            orderId: order.id,
            message: 'Order created successfully'
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all orders
const getAllOrders = async (req, res) => {
    try {
        const orders = await orderService.getAllOrders();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

// Get order by ID
const getOrderById = async (req, res) => {
    try {
        const order = await orderService.getOrderById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
};

// Update order
const updateOrder = async (req, res) => {
    try {
        await orderService.updateOrder(req.params.id, req.body);
        res.json({ message: 'Order updated successfully' });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Failed to update order' });
    }
};

// Delete order
const deleteOrder = async (req, res) => {
    try {
        await orderService.deleteOrder(req.params.id);
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
};

// Get orders by client ID
const getOrdersByClientId = async (req, res) => {
    try {
        const orders = await orderService.getOrdersByClientId(req.params.clientId);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching client orders:', error);
        res.status(500).json({ error: 'Failed to fetch client orders' });
    }
};

module.exports = {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrder,
    deleteOrder,
    getOrdersByClientId
}; 