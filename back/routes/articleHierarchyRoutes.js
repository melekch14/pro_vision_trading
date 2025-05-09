const express = require('express');
const router = express.Router();
const articleHierarchyController = require('../controllers/articleHierarchyController');

// Article Groups Routes
router.post('/groups', articleHierarchyController.createGroup);
router.get('/groups', articleHierarchyController.getGroups);
router.get('/groups/:id', articleHierarchyController.getGroupById);
router.put('/groups/:id', articleHierarchyController.updateGroup);
router.delete('/groups/:id', articleHierarchyController.deleteGroup);

// Article Families Routes
router.post('/families', articleHierarchyController.createFamily);
router.get('/families', articleHierarchyController.getFamilies);
router.get('/families/:id', articleHierarchyController.getFamilyById);
router.put('/families/:id', articleHierarchyController.updateFamily);
router.delete('/families/:id', articleHierarchyController.deleteFamily);

// Article Subfamilies Routes
router.post('/subfamilies', articleHierarchyController.createSubfamily);
router.get('/subfamilies', articleHierarchyController.getSubfamilies);
router.get('/subfamilies/:id', articleHierarchyController.getSubfamilyById);
router.put('/subfamilies/:id', articleHierarchyController.updateSubfamily);
router.delete('/subfamilies/:id', articleHierarchyController.deleteSubfamily);

module.exports = router; 