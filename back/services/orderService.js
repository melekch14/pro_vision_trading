const db = require('../models/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = path.extname(file.originalname);
    cb(null, `temp_${timestamp}${extension}`);
  }
});

const upload = multer({ storage: storage });

// Create order
const createOrder = async (orderData) => {
  const {
    client_id, first_name, last_name, phone, email,
    od_sphere, od_cylinder, od_axe, od_addition,
    og_sphere, og_cylinder, og_axe, og_addition,
    typeCommande, origineArticle, produit, typeCorrection,
    price, shipping_type, delivery_time, selected_file
  } = orderData;

  const [result] = await db.query(
    `INSERT INTO orders (
            client_id, first_name, last_name, phone, email,
            od_sphere, od_cylinder, od_axe, od_addition,
            og_sphere, og_cylinder, og_axe, og_addition,
            typeCommande, origineArticle, produit, typeCorrection
            price, shipping_type, delivery_time, selected_file
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      client_id, first_name, last_name, phone, email,
      od_sphere, od_cylinder, od_axe, od_addition,
      og_sphere, og_cylinder, og_axe, og_addition,
      typeCommande, origineArticle, produit, typeCorrection,
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


class OrderService {
  async createOrder(orderData) {
    try {
      const {
        client_id, od, og, lastName, firstName, phone, email,
        typeCommande, origineArticle, produit, produit2, fabrication1, fabrication2, price, price2, totalPrice, typeCorrection,
        shippingType, deliveryTime, needsSecondProduct
      } = orderData;
      
      // Determine which fields to use based on origineArticle
      let _produit = null, _produit2 = null, _fabrication1 = null, _fabrication2 = null;
      if (origineArticle === 'fabrication') {
        _fabrication1 = fabrication1 || null;
        _fabrication2 = needsSecondProduct ? (fabrication2 || null) : null;
      } else {
        _produit = produit || null;
        _produit2 = needsSecondProduct ? (produit2 || null) : null;
      }
      
      const [result] = await db.query(
        `INSERT INTO orders (
          client_id, od_sphere, od_cylinder, od_axe, od_addition,
          og_sphere, og_cylinder, og_axe, og_addition,
          last_name, first_name, phone, email,
          typeCommande, origineArticle, produit, produit2, fabrication1, fabrication2, price, price2, total_price, typeCorrection,
          shipping_type, delivery_time, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          client_id, od.sphere, od.cylinder, od.axe, od.addition,
          og.sphere, og.cylinder, og.axe, og.addition,
          lastName, firstName, phone, email,
          typeCommande, origineArticle, _produit, _produit2, _fabrication1, _fabrication2, price, price2 || 0, totalPrice || price, typeCorrection,
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
      // Rename the file with the order ID
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const extension = path.extname(file.originalname);
      const newFilename = `order_${orderId}_${timestamp}${extension}`;
      const newPath = path.join('uploads', newFilename);

      // Rename the file
      fs.renameSync(file.path, newPath);

      // Update order with file information
      await db.query(
        'UPDATE orders SET selected_file = ? WHERE id = ?',
        [newFilename, orderId]
      );

      return { message: 'File uploaded successfully', filePath: newPath };
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

  async getOrdersByClientId(clientId) {
    const [rows] = await db.query(`
        SELECT o.*,
               s.article_id as stock_article_id,
               s2.article_id as stock2_article_id,
               a.libelle as article_libelle,
               a2.libelle as article2_libelle
        FROM orders o
        LEFT JOIN stock s ON o.produit = s.id
        LEFT JOIN stock s2 ON o.produit2 = s2.id
        LEFT JOIN article a ON s.article_id = a.id
        LEFT JOIN article a2 ON s2.article_id = a2.id
        WHERE o.client_id = ?
        ORDER BY o.order_datetime DESC
    `, [clientId]);
    return rows;
  }

  async getAllOrders() {
    const [rows] = await db.query(`
          SELECT o.*, o.id as order_id, 
                 s.article_id as stock_article_id, 
                 s2.article_id as stock2_article_id,
                 c.raison_social, s.*, s2.*, 
                 a.libelle as article_libelle,
                 a2.libelle as article2_libelle
FROM orders o 
LEFT JOIN stock s ON o.produit = s.id 
LEFT JOIN stock s2 ON o.produit2 = s2.id
LEFT JOIN article a ON s.article_id = a.id
LEFT JOIN article a2 ON s2.article_id = a2.id
LEFT JOIN client c on c.id = o.client_id 
ORDER BY o.order_datetime DESC
      `);
    return rows;
  }

  async downloadFile(orderId) {
    try {
      // Get the file information from the order
      const [rows] = await db.query(
        'SELECT selected_file FROM orders WHERE id = ?',
        [orderId]
      );

      if (!rows[0] || !rows[0].selected_file) {
        throw new Error('File not found');
      }

      const filePath = path.join(__dirname, '..', 'uploads', rows[0].selected_file);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found on server');
      }

      return {
        filePath,
        fileName: rows[0].selected_file
      };
    } catch (error) {
      throw new Error(`Error downloading file: ${error.message}`);
    }
  }

  async updateOrderStatusAndFournisseur(orderId, fournisseurCode, status) {
    try {
      const [result] = await db.query(
        'UPDATE orders SET fournisseur_code = ?, status = ? WHERE id = ?',
        [fournisseurCode, status, orderId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Order not found');
      }

      return { message: 'Order updated successfully' };
    } catch (error) {
      throw new Error(`Error updating order: ${error.message}`);
    }
  }

  // Get order by ID
    async getOrderById(id){
    const [rows] = await db.query(`
          SELECT o.*,
                s.article_id as stock_article_id,
                s2.article_id as stock2_article_id,
                a.libelle as article_libelle,
                a2.libelle as article2_libelle
          FROM orders o
          LEFT JOIN stock s ON o.produit = s.id
          LEFT JOIN stock s2 ON o.produit2 = s2.id
          LEFT JOIN article a ON s.article_id = a.id
          LEFT JOIN article a2 ON s2.article_id = a2.id
          WHERE o.id = ?
      `, [id]);
    return rows[0];
  }
}

module.exports = new OrderService(); 