const articleHierarchyService = require('../services/articleHierarchyService');

// Article Groups Controllers
exports.createGroup = async (req, res) => {
    try {
        const id = await articleHierarchyService.createGroup(req.body);
        res.status(201).json({ id, message: 'Article group created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getGroups = async (req, res) => {
    try {
        const groups = await articleHierarchyService.getGroups();
        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getGroupById = async (req, res) => {
    try {
        const group = await articleHierarchyService.getGroupById(req.params.id);
        if (!group) {
            return res.status(404).json({ error: 'Article group not found' });
        }
        res.json(group);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateGroup = async (req, res) => {
    try {
        await articleHierarchyService.updateGroup(req.params.id, req.body);
        res.json({ message: 'Article group updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteGroup = async (req, res) => {
    try {
        await articleHierarchyService.deleteGroup(req.params.id);
        res.json({ message: 'Article group deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Article Families Controllers
exports.createFamily = async (req, res) => {
    try {
        const id = await articleHierarchyService.createFamily(req.body);
        res.status(201).json({ id, message: 'Article family created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getFamilies = async (req, res) => {
    try {
        const families = await articleHierarchyService.getFamilies();
        res.json(families);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getFamilyById = async (req, res) => {
    try {
        const family = await articleHierarchyService.getFamilyById(req.params.id);
        if (!family) {
            return res.status(404).json({ error: 'Article family not found' });
        }
        res.json(family);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateFamily = async (req, res) => {
    try {
        await articleHierarchyService.updateFamily(req.params.id, req.body);
        res.json({ message: 'Article family updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteFamily = async (req, res) => {
    try {
        await articleHierarchyService.deleteFamily(req.params.id);
        res.json({ message: 'Article family deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Article Subfamilies Controllers
exports.createSubfamily = async (req, res) => {
    try {
        const id = await articleHierarchyService.createSubfamily(req.body);
        res.status(201).json({ id, message: 'Article subfamily created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSubfamilies = async (req, res) => {
    try {
        const subfamilies = await articleHierarchyService.getSubfamilies();
        res.json(subfamilies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSubfamilyById = async (req, res) => {
    try {
        const subfamily = await articleHierarchyService.getSubfamilyById(req.params.id);
        if (!subfamily) {
            return res.status(404).json({ error: 'Article subfamily not found' });
        }
        res.json(subfamily);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateSubfamily = async (req, res) => {
    try {
        await articleHierarchyService.updateSubfamily(req.params.id, req.body);
        res.json({ message: 'Article subfamily updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteSubfamily = async (req, res) => {
    try {
        await articleHierarchyService.deleteSubfamily(req.params.id);
        res.json({ message: 'Article subfamily deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}; 