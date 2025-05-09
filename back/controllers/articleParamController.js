const articleParamService = require('../services/articleParamService');

// Foyer Controllers
exports.createFoyer = async (req, res) => {
    try {
        const id = await articleParamService.createFoyer(req.body);
        res.status(201).json({ id, message: 'Foyer created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getFoyers = async (req, res) => {
    try {
        const foyers = await articleParamService.getFoyers();
        res.json(foyers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getFoyerById = async (req, res) => {
    try {
        const foyer = await articleParamService.getFoyerById(req.params.id);
        if (!foyer) {
            return res.status(404).json({ error: 'Foyer not found' });
        }
        res.json(foyer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateFoyer = async (req, res) => {
    try {
        await articleParamService.updateFoyer(req.params.id, req.body);
        res.json({ message: 'Foyer updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteFoyer = async (req, res) => {
    try {
        await articleParamService.deleteFoyer(req.params.id);
        res.json({ message: 'Foyer deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Indice Controllers
exports.createIndice = async (req, res) => {
    try {
        const id = await articleParamService.createIndice(req.body);
        res.status(201).json({ id, message: 'Indice created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getIndices = async (req, res) => {
    try {
        const indices = await articleParamService.getIndices();
        res.json(indices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getIndiceById = async (req, res) => {
    try {
        const indice = await articleParamService.getIndiceById(req.params.id);
        if (!indice) {
            return res.status(404).json({ error: 'Indice not found' });
        }
        res.json(indice);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateIndice = async (req, res) => {
    try {
        await articleParamService.updateIndice(req.params.id, req.body);
        res.json({ message: 'Indice updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteIndice = async (req, res) => {
    try {
        await articleParamService.deleteIndice(req.params.id);
        res.json({ message: 'Indice deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Design Controllers
exports.createDesign = async (req, res) => {
    try {
        const id = await articleParamService.createDesign(req.body);
        res.status(201).json({ id, message: 'Design created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getDesigns = async (req, res) => {
    try {
        const designs = await articleParamService.getDesigns();
        res.json(designs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getDesignById = async (req, res) => {
    try {
        const design = await articleParamService.getDesignById(req.params.id);
        if (!design) {
            return res.status(404).json({ error: 'Design not found' });
        }
        res.json(design);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateDesign = async (req, res) => {
    try {
        await articleParamService.updateDesign(req.params.id, req.body);
        res.json({ message: 'Design updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteDesign = async (req, res) => {
    try {
        await articleParamService.deleteDesign(req.params.id);
        res.json({ message: 'Design deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Couleur Photo Controllers
exports.createCouleurPhoto = async (req, res) => {
    try {
        const id = await articleParamService.createCouleurPhoto(req.body);
        res.status(201).json({ id, message: 'Couleur photo created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCouleurPhotos = async (req, res) => {
    try {
        const couleurPhotos = await articleParamService.getCouleurPhotos();
        res.json(couleurPhotos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCouleurPhotoById = async (req, res) => {
    try {
        const couleurPhoto = await articleParamService.getCouleurPhotoById(req.params.id);
        if (!couleurPhoto) {
            return res.status(404).json({ error: 'Couleur photo not found' });
        }
        res.json(couleurPhoto);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateCouleurPhoto = async (req, res) => {
    try {
        await articleParamService.updateCouleurPhoto(req.params.id, req.body);
        res.json({ message: 'Couleur photo updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteCouleurPhoto = async (req, res) => {
    try {
        await articleParamService.deleteCouleurPhoto(req.params.id);
        res.json({ message: 'Couleur photo deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Traitement Controllers
exports.createTraitement = async (req, res) => {
    try {
        const id = await articleParamService.createTraitement(req.body);
        res.status(201).json({ id, message: 'Traitement created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTraitements = async (req, res) => {
    try {
        const traitements = await articleParamService.getTraitements();
        res.json(traitements);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTraitementById = async (req, res) => {
    try {
        const traitement = await articleParamService.getTraitementById(req.params.id);
        if (!traitement) {
            return res.status(404).json({ error: 'Traitement not found' });
        }
        res.json(traitement);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateTraitement = async (req, res) => {
    try {
        await articleParamService.updateTraitement(req.params.id, req.body);
        res.json({ message: 'Traitement updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteTraitement = async (req, res) => {
    try {
        await articleParamService.deleteTraitement(req.params.id);
        res.json({ message: 'Traitement deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Type Article Controllers
exports.createTypeArticle = async (req, res) => {
    try {
        const id = await articleParamService.createTypeArticle(req.body);
        res.status(201).json({ id, message: 'Type article created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTypeArticles = async (req, res) => {
    try {
        const typeArticles = await articleParamService.getTypeArticles();
        res.json(typeArticles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTypeArticleById = async (req, res) => {
    try {
        const typeArticle = await articleParamService.getTypeArticleById(req.params.id);
        if (!typeArticle) {
            return res.status(404).json({ error: 'Type article not found' });
        }
        res.json(typeArticle);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateTypeArticle = async (req, res) => {
    try {
        await articleParamService.updateTypeArticle(req.params.id, req.body);
        res.json({ message: 'Type article updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteTypeArticle = async (req, res) => {
    try {
        await articleParamService.deleteTypeArticle(req.params.id);
        res.json({ message: 'Type article deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}; 