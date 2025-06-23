const db = require('../models/db');

class StatisticsService {
  // Calculate total revenue from orders
  async getTotalRevenue() {
    try {
      const [rows] = await db.query(`
        SELECT COALESCE(SUM(price), 0) as total_revenue
        FROM orders
        WHERE status != 'cancelled'
      `);
      return rows[0].total_revenue;
    } catch (error) {
      throw new Error(`Error calculating total revenue: ${error.message}`);
    }
  }

  // Get count of all orders
  async getTotalOrders() {
    try {
      const [rows] = await db.query(`
        SELECT COUNT(*) as total_orders
        FROM orders
      `);
      return rows[0].total_orders;
    } catch (error) {
      throw new Error(`Error counting total orders: ${error.message}`);
    }
  }

  // Get count of pending orders
  async getPendingOrders() {
    try {
      const [rows] = await db.query(`
        SELECT COUNT(*) as pending_orders
        FROM orders
        WHERE status = 'pending'
      `);
      return rows[0].pending_orders;
    } catch (error) {
      throw new Error(`Error counting pending orders: ${error.message}`);
    }
  }

  // Get count of orders grouped by status
  async getOrdersByStatus() {
    try {
      const [rows] = await db.query(`
        SELECT status, COUNT(*) as count
        FROM orders
        GROUP BY status
        ORDER BY count DESC
      `);
      return rows;
    } catch (error) {
      throw new Error(`Error getting orders by status: ${error.message}`);
    }
  }

  // Get last 5 orders
  async getLastFiveOrders() {
    try {
      const [rows] = await db.query(`
        SELECT o.*, 
               c.raison_social as client_name, 
               c.tel as client_tel, 
               c.adresse as client_details,
               a.libelle as article_libelle,
               a2.libelle as article2_libelle,
               CASE 
                 WHEN o.produit2 IS NOT NULL AND o.produit2 != 0 THEN 
                   CONCAT(COALESCE(a.libelle, ''), ' + ', COALESCE(a2.libelle, ''))
                 ELSE 
                   COALESCE(a.libelle, '')
               END as products_display,
               COALESCE(o.total_price, o.price) as total_price
        FROM orders o
        LEFT JOIN client c ON o.client_id = c.id
        LEFT JOIN stock s ON o.produit = s.id
        LEFT JOIN stock s2 ON o.produit2 = s2.id
        LEFT JOIN article a ON s.article_id = a.id
        LEFT JOIN article a2 ON s2.article_id = a2.id
        ORDER BY o.order_datetime DESC
        LIMIT 5
      `);
      return rows;
    } catch (error) {
      throw new Error(`Error getting last 5 orders: ${error.message}`);
    }
  }

  // Get dashboard statistics (all in one call)
  async getDashboardStatistics() {
    try {
      const [
        totalRevenue,
        totalOrders,
        pendingOrders,
        ordersByStatus,
        lastFiveOrders
      ] = await Promise.all([
        this.getTotalRevenue(),
        this.getTotalOrders(),
        this.getPendingOrders(),
        this.getOrdersByStatus(),
        this.getLastFiveOrders()
      ]);

      return {
        totalRevenue,
        totalOrders,
        pendingOrders,
        ordersByStatus,
        lastFiveOrders
      };
    } catch (error) {
      throw new Error(`Error getting dashboard statistics: ${error.message}`);
    }
  }
}

module.exports = new StatisticsService(); 