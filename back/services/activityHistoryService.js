const db = require('../models/db');

class ActivityHistoryService {
  // Log an activity
  async logActivity(userId, userName, userRole, action, target = null, ipAddress = null) {
    try {
      const result = await db.query(
        `INSERT INTO activity_history (user_id, user_name, user_role, action, target, ip_address) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, userName, userRole, action, target, ipAddress]
      );
      console.log(`[ActivityHistoryService] Activity logged successfully: ${action} by ${userName} (ID: ${result[0].insertId})`);
      return result;
    } catch (error) {
      console.error('[ActivityHistoryService] Error logging activity:', error);
      console.error('[ActivityHistoryService] Error details:', {
        userId,
        userName,
        userRole,
        action,
        target,
        ipAddress,
        errorMessage: error.message,
        errorCode: error.code
      });
      // Don't throw error to avoid breaking the main flow
      return null;
    }
  }

  // Get all activities with pagination
  async getActivities(page = 1, limit = 50, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let query = `
        SELECT * FROM activity_history
        WHERE 1=1
      `;
      const params = [];

      // Apply filters
      if (filters.action) {
        query += ` AND action LIKE ?`;
        params.push(`%${filters.action}%`);
      }

      if (filters.userId) {
        query += ` AND user_id = ?`;
        params.push(filters.userId);
      }

      if (filters.userRole) {
        query += ` AND user_role = ?`;
        params.push(filters.userRole);
      }

      if (filters.startDate) {
        query += ` AND created_at >= ?`;
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ` AND created_at <= ?`;
        params.push(filters.endDate);
      }

      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const [activities] = await db.query(query, params);

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total FROM activity_history WHERE 1=1
      `;
      const countParams = [];

      if (filters.action) {
        countQuery += ` AND action LIKE ?`;
        countParams.push(`%${filters.action}%`);
      }

      if (filters.userId) {
        countQuery += ` AND user_id = ?`;
        countParams.push(filters.userId);
      }

      if (filters.userRole) {
        countQuery += ` AND user_role = ?`;
        countParams.push(filters.userRole);
      }

      if (filters.startDate) {
        countQuery += ` AND created_at >= ?`;
        countParams.push(filters.startDate);
      }

      if (filters.endDate) {
        countQuery += ` AND created_at <= ?`;
        countParams.push(filters.endDate);
      }

      const [countResult] = await db.query(countQuery, countParams);
      const total = countResult[0].total;

      return {
        activities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error fetching activities: ${error.message}`);
    }
  }

  // Get activity statistics
  async getActivityStatistics() {
    try {
      // Total activities
      const [totalResult] = await db.query(
        `SELECT COUNT(*) as total FROM activity_history`
      );
      const totalActivities = totalResult[0].total;

      // Activities from last week
      const [lastWeekResult] = await db.query(
        `SELECT COUNT(*) as total FROM activity_history 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
      );
      const lastWeekTotal = lastWeekResult[0].total;

      // Calculate percentage change
      const [twoWeeksAgoResult] = await db.query(
        `SELECT COUNT(*) as total FROM activity_history 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) 
         AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`
      );
      const twoWeeksAgoTotal = twoWeeksAgoResult[0].total;
      const weekChange = twoWeeksAgoTotal > 0 
        ? Math.round(((lastWeekTotal - twoWeeksAgoTotal) / twoWeeksAgoTotal) * 100)
        : 0;

      // Active users (unique users in last 7 days)
      const [activeUsersResult] = await db.query(
        `SELECT COUNT(DISTINCT user_id) as total FROM activity_history 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
      );
      const activeUsers = activeUsersResult[0].total;

      // New users this week
      const [newUsersResult] = await db.query(
        `SELECT COUNT(DISTINCT user_id) as total FROM activity_history 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
         AND user_id NOT IN (
           SELECT DISTINCT user_id FROM activity_history 
           WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
         )`
      );
      const newUsers = newUsersResult[0].total;

      // Critical actions (delete, update sensitive data, etc.)
      const [criticalActionsResult] = await db.query(
        `SELECT COUNT(*) as total FROM activity_history 
         WHERE action LIKE '%Delete%' 
         OR action LIKE '%Supprimer%'
         OR action LIKE '%Remove%'
         OR action LIKE '%Update%'
         OR action LIKE '%Modifier%'
         OR action LIKE '%Change%'
         OR action LIKE '%Modify%'
         OR action LIKE '%Edit%'
         OR action LIKE '%Modifier%'`
      );
      const criticalActions = criticalActionsResult[0].total;

      // This week activities
      const [thisWeekResult] = await db.query(
        `SELECT COUNT(*) as total FROM activity_history 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
      );
      const thisWeekTotal = thisWeekResult[0].total;

      // This week vs last week percentage
      const thisWeekChange = twoWeeksAgoTotal > 0 
        ? Math.round(((thisWeekTotal - twoWeeksAgoTotal) / twoWeeksAgoTotal) * 100)
        : 0;

      return {
        totalActivities,
        lastWeekTotal,
        weekChange,
        activeUsers,
        newUsers,
        criticalActions,
        thisWeekTotal,
        thisWeekChange
      };
    } catch (error) {
      throw new Error(`Error fetching activity statistics: ${error.message}`);
    }
  }

  // Get all unique users for filter dropdown
  async getUsers() {
    try {
      const [users] = await db.query(
        `SELECT DISTINCT user_id, user_name, user_role 
         FROM activity_history 
         ORDER BY user_name ASC`
      );
      return users;
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  // Get all unique actions for filter dropdown
  async getActions() {
    try {
      const [actions] = await db.query(
        `SELECT DISTINCT action 
         FROM activity_history 
         ORDER BY action ASC`
      );
      return actions.map(a => a.action);
    } catch (error) {
      throw new Error(`Error fetching actions: ${error.message}`);
    }
  }
}

module.exports = new ActivityHistoryService();

