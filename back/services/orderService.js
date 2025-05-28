const db = require('../models/db');

// Create order
const createOrder = async (orderData) => {
    const {
        client_id, first_name, last_name, phone, email,
        od_sphere, od_cylinder, od_axe, od_addition,
        og_sphere, og_cylinder, og_axe, og_addition,
        supplement, traitement, produit,
        price, shipping_type, delivery_time, selected_file
    } = orderData;

    const [result] = await db.query(
        `INSERT INTO orders (
            client_id, first_name, last_name, phone, email,
            od_sphere, od_cylinder, od_axe, od_addition,
            og_sphere, og_cylinder, og_axe, og_addition,
            supplement, traitement, produit,
            price, shipping_type, delivery_time, selected_file
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            client_id, first_name, last_name, phone, email,
            od_sphere, od_cylinder, od_axe, od_addition,
            og_sphere, og_cylinder, og_axe, og_addition,
            supplement, traitement, produit,
            price, shipping_type, delivery_time, selected_file
        ]
    );
    return result.insertId;
};

// Get all orders
const getAllOrders = async () => {
    const [rows] = await db.query(`
        SELECT o.*, 
               s.article_id as stock_article_id
        FROM orders o
        LEFT JOIN stock s ON o.produit = s.id
        ORDER BY o.order_datetime DESC
    `);
    return rows;
};

// Get order by ID
const getOrderById = async (id) => {
    const [rows] = await db.query(`
        SELECT o.*,
               s.article_id as stock_article_id
        FROM orders o
        LEFT JOIN stock s ON o.produit = s.id
        WHERE o.id = ?
    `, [id]);
    return rows[0];
};

// Update order
const updateOrder = async (id, orderData) => {
    const {
        first_name, last_name, phone, email,
        od_sphere, od_cylinder, od_axe, od_addition,
        og_sphere, og_cylinder, og_axe, og_addition,
        supplement, traitement, produit,
        price, shipping_type, delivery_time, selected_file,
        status
    } = orderData;

    await db.query(
        `UPDATE orders SET 
            first_name = ?, last_name = ?, phone = ?, email = ?,
            od_sphere = ?, od_cylinder = ?, od_axe = ?, od_addition = ?,
            og_sphere = ?, og_cylinder = ?, og_axe = ?, og_addition = ?,
            supplement = ?, traitement = ?, produit = ?,
            price = ?, shipping_type = ?, delivery_time = ?, selected_file = ?,
            status = ?
        WHERE id = ?`,
        [
            first_name, last_name, phone, email,
            od_sphere, od_cylinder, od_axe, od_addition,
            og_sphere, og_cylinder, og_axe, og_addition,
            supplement, traitement, produit,
            price, shipping_type, delivery_time, selected_file,
            status, id
        ]
    );
};

// Delete order
const deleteOrder = async (id) => {
    await db.query('DELETE FROM orders WHERE id = ?', [id]);
};

// Get orders by client ID
const getOrdersByClientId = async (clientId) => {
    const [rows] = await db.query(`
        SELECT o.*,
               s.article_id as stock_article_id
        FROM orders o
        LEFT JOIN stock s ON o.produit = s.id
        WHERE o.client_id = ?
        ORDER BY o.order_datetime DESC
    `, [clientId]);
    return rows;
};

module.exports = {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrder,
    deleteOrder,
    getOrdersByClientId
}; 