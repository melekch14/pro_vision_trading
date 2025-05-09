const articleService = require('../services/articleService');

// Create a new article
const createArticle = async (req, res) => {
    try {
        const articleId = await articleService.createArticle(req.body);
        res.status(201).json({ id: articleId, message: 'Article created successfully' });
    } catch (error) {
        console.error('Error creating article:', error);
        res.status(500).json({ error: 'Failed to create article' });
    }
};

// Get all articles
const getArticles = async (req, res) => {
    try {
        const articles = await articleService.getArticles();
        res.json(articles);
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({ error: 'Failed to fetch articles' });
    }
};

// Get article by ID
const getArticleById = async (req, res) => {
    try {
        const article = await articleService.getArticleById(req.params.id);
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }
        res.json(article);
    } catch (error) {
        console.error('Error fetching article:', error);
        res.status(500).json({ error: 'Failed to fetch article' });
    }
};

// Update article
const updateArticle = async (req, res) => {
    try {
        await articleService.updateArticle(req.params.id, req.body);
        res.json({ message: 'Article updated successfully' });
    } catch (error) {
        console.error('Error updating article:', error);
        res.status(500).json({ error: 'Failed to update article' });
    }
};

// Delete article
const deleteArticle = async (req, res) => {
    try {
        await articleService.deleteArticle(req.params.id);
        res.json({ message: 'Article deleted successfully' });
    } catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({ error: 'Failed to delete article' });
    }
};

module.exports = {
    createArticle,
    getArticles,
    getArticleById,
    updateArticle,
    deleteArticle
}; 