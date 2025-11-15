const activityHistoryService = require('../services/activityHistoryService');
const jwt = require('jsonwebtoken');

// Helper function to get user info from token
const getUserFromToken = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Get all activities with filters and pagination
const getActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const filters = {
      action: req.query.action || null,
      userId: req.query.userId ? parseInt(req.query.userId) : null,
      userRole: req.query.userRole || null,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null
    };

    const result = await activityHistoryService.getActivities(page, limit, filters);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get activity statistics
const getActivityStatistics = async (req, res) => {
  try {
    const statistics = await activityHistoryService.getActivityStatistics();
    res.json({
      success: true,
      ...statistics
    });
  } catch (error) {
    console.error('Error fetching activity statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get users for filter dropdown
const getUsers = async (req, res) => {
  try {
    const users = await activityHistoryService.getUsers();
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get actions for filter dropdown
const getActions = async (req, res) => {
  try {
    const actions = await activityHistoryService.getActions();
    res.json({
      success: true,
      actions
    });
  } catch (error) {
    console.error('Error fetching actions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getActivities,
  getActivityStatistics,
  getUsers,
  getActions
};

