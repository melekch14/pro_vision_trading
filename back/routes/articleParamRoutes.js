const express = require('express');
const router = express.Router();
const articleParamController = require('../controllers/articleParamController');

// Foyer Routes
router.post('/foyers', articleParamController.createFoyer);
router.get('/foyers', articleParamController.getFoyers);
router.get('/foyers/:id', articleParamController.getFoyerById);
router.put('/foyers/:id', articleParamController.updateFoyer);
router.delete('/foyers/:id', articleParamController.deleteFoyer);

// Indice Routes
router.post('/indices', articleParamController.createIndice);
router.get('/indices', articleParamController.getIndices);
router.get('/indices/:id', articleParamController.getIndiceById);
router.put('/indices/:id', articleParamController.updateIndice);
router.delete('/indices/:id', articleParamController.deleteIndice);

// Design Routes
router.post('/designs', articleParamController.createDesign);
router.get('/designs', articleParamController.getDesigns);
router.get('/designs/:id', articleParamController.getDesignById);
router.put('/designs/:id', articleParamController.updateDesign);
router.delete('/designs/:id', articleParamController.deleteDesign);

// Couleur Photo Routes
router.post('/couleur-photos', articleParamController.createCouleurPhoto);
router.get('/couleur-photos', articleParamController.getCouleurPhotos);
router.get('/couleur-photos/:id', articleParamController.getCouleurPhotoById);
router.put('/couleur-photos/:id', articleParamController.updateCouleurPhoto);
router.delete('/couleur-photos/:id', articleParamController.deleteCouleurPhoto);

// Traitement Routes
router.post('/traitements', articleParamController.createTraitement);
router.get('/traitements', articleParamController.getTraitements);
router.get('/traitements/:id', articleParamController.getTraitementById);
router.put('/traitements/:id', articleParamController.updateTraitement);
router.delete('/traitements/:id', articleParamController.deleteTraitement);

// Type Article Routes
router.post('/type-articles', articleParamController.createTypeArticle);
router.get('/type-articles', articleParamController.getTypeArticles);
router.get('/type-articles/:id', articleParamController.getTypeArticleById);
router.put('/type-articles/:id', articleParamController.updateTypeArticle);
router.delete('/type-articles/:id', articleParamController.deleteTypeArticle);

module.exports = router; 