const db = require('../models/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const orderId = req.body.orderId;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = path.extname(file.originalname);
    cb(null, `order_${orderId}_${timestamp}${extension}`);
  }
});

const upload = multer({ storage: storage });

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

class OrderService {
  async createOrder(orderData) {
    try {
      const {
        od, og, lastName, firstName, phone, email,
        supplement, traitement, produit, price,
        shippingType, deliveryTime
      } = orderData;

      const [result] = await db.query(
        `INSERT INTO orders (
          od_sphere, od_cylinder, od_axe, od_addition,
          og_sphere, og_cylinder, og_axe, og_addition,
          last_name, first_name, phone, email,
          supplement, traitement, produit, price,
          shipping_type, delivery_time, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          od.sphere, od.cylinder, od.axe, od.addition,
          og.sphere, og.cylinder, og.axe, og.addition,
          lastName, firstName, phone, email,
          supplement, traitement, produit, price,
          shippingType, deliveryTime
        ]
      );

      return { id: result.insertId, ...orderData };
    } catch (error) {
      throw new Error(`Error creating order: ${error.message}`);
    }
  }

  async uploadFile(file, orderId) {
    try {
      // Update order with file information
      await db.query(
        'UPDATE orders SET file_path = ?, file_name = ? WHERE id = ?',
        [file.path, file.filename, orderId]
      );

      return { message: 'File uploaded successfully', filePath: file.path };
    } catch (error) {
      // If there's an error, delete the uploaded file
      if (file && file.path) {
        fs.unlinkSync(file.path);
      }
      throw new Error(`Error uploading file: ${error.message}`);
    }
  }

  getUploadMiddleware() {
    return upload.single('file');
  }
}

module.exports = new OrderService(); 