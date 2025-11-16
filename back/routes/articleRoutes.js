const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');

// Article Routes
router.post('/', articleController.createArticle);
router.get('/', articleController.getArticles);
router.get('/all-data', articleController.getAllData);
router.get('/:id', articleController.getArticleById);
router.put('/:id', articleController.updateArticle);
router.delete('/:id', articleController.deleteArticle);
router.post('/import', articleController.getUploadMiddleware(), articleController.importArticlesFromExcel);

module.exports = router; 