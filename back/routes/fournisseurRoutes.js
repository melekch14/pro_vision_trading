const express = require('express');
const router = express.Router();
const fournisseurController = require('../controllers/fournisseurController');

router.post('/', fournisseurController.createFournisseur);
router.get('/', fournisseurController.getFournisseurs);
router.get('/:code', fournisseurController.getFournisseurByCode);
router.put('/:code', fournisseurController.updateFournisseur);
router.delete('/:code', fournisseurController.deleteFournisseur);

module.exports = router; 