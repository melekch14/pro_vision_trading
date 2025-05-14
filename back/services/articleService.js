const db = require('../models/db');

// Article CRUD
const createArticle = async (article) => {
    const [result] = await db.query(
        `INSERT INTO article (
            code, libelle, diametre, foyer_id, indice_id, design_id, 
            couleur_photo_id, traitement_id, axe, addition, 
            prix_achat, tva, prix_vente, code_a_barre, 
            expiration, fournisseur_id, typeArticle_id, article_subfamily_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            article.code, article.libelle, article.diametre, article.foyer_id, article.indice_id,
            article.design_id, article.couleur_photo_id, article.traitement_id,
            article.axe, article.addition, article.prix_achat, article.tva,
            article.prix_vente, article.code_a_barre, article.expiration,
            article.fournisseur_id, article.typeArticle_id, article.article_subfamily_id
        ]
    );
    return result.insertId;
};

const getArticles = async () => {
    const [articles] = await db.query(`
        SELECT a.*, 
            f.name as foyer_name,
            i.name as indice_name,
            d.name as design_name,
            cp.name as couleur_photo_name,
            t.name as traitement_name,
            fo.responsable as fournisseur_name,
            ta.name as type_article_name
        FROM article a
        LEFT JOIN foyer f ON a.foyer_id = f.id
        LEFT JOIN indice i ON a.indice_id = i.id
        LEFT JOIN design d ON a.design_id = d.id
        LEFT JOIN couleur_photo cp ON a.couleur_photo_id = cp.id
        LEFT JOIN traitement t ON a.traitement_id = t.id
        LEFT JOIN fournisseur fo ON a.fournisseur_id = fo.code
        LEFT JOIN typeArticle ta ON a.typeArticle_id = ta.id
    `);
    return articles;
};

const getArticleById = async (id) => {
    const [articles] = await db.query(`
        SELECT a.*, 
            f.name as foyer_name,
            i.name as indice_name,
            d.name as design_name,
            cp.name as couleur_photo_name,
            t.name as traitement_name,
            fo.responsable as fournisseur_name,
            ta.name as type_article_name
        FROM article a
        LEFT JOIN foyer f ON a.foyer_id = f.id
        LEFT JOIN indice i ON a.indice_id = i.id
        LEFT JOIN design d ON a.design_id = d.id
        LEFT JOIN couleur_photo cp ON a.couleur_photo_id = cp.id
        LEFT JOIN traitement t ON a.traitement_id = t.id
        LEFT JOIN fournisseur fo ON a.fournisseur_id = fo.code
        LEFT JOIN typeArticle ta ON a.typeArticle_id = ta.id
        WHERE a.id = ?
    `, [id]);
    return articles[0];
};

const updateArticle = async (id, article) => {
    await db.query(
        `UPDATE article SET 
            code = ?, libelle = ?, diametre = ?, foyer_id = ?, indice_id = ?, 
            design_id = ?, couleur_photo_id = ?, traitement_id = ?, 
            axe = ?, addition = ?, prix_achat = ?, tva = ?, 
            prix_vente = ?, code_a_barre = ?, expiration = ?, 
            fournisseur_id = ?, typeArticle_id = ?, article_subfamily_id = ?
        WHERE id = ?`,
        [

            article.code, article.libelle, article.diametre, article.foyer_id, article.indice_id,
            article.design_id, article.couleur_photo_id, article.traitement_id,
            article.axe, article.addition, article.prix_achat, article.tva,
            article.prix_vente, article.code_a_barre, article.expiration,
            article.fournisseur_id, article.typeArticle_id, article.article_subfamily_id, id
        ]
    );
};

const deleteArticle = async (id) => {
    await db.query('DELETE FROM article WHERE id = ?', [id]);
};

module.exports = {
    createArticle,
    getArticles,
    getArticleById,
    updateArticle,
    deleteArticle
}; 