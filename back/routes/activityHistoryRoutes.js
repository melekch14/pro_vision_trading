const express = require('express');
const router = express.Router();
const activityHistoryController = require('../controllers/activityHistoryController');

// Get all activities with filters and pagination
router.get('/', activityHistoryController.getActivities);

// Get activity statistics
router.get('/statistics', activityHistoryController.getActivityStatistics);

// Get users for filter dropdown
router.get('/users', activityHistoryController.getUsers);

// Get actions for filter dropdown
router.get('/actions', activityHistoryController.getActions);

module.exports = router;

