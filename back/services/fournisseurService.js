const db = require('../models/db');

const createFournisseur = async (fournisseur) => {
    const [result] = await db.query(
        `INSERT INTO fournisseur (
            code, raison_social, adresse, mat_vin, tel, fax, email, 
            responsable, id_fiscale, banque, agence, rib, 
            categorie_prix_vente, status, activite_economique, 
            remise, taux_retenue
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            fournisseur.code,
            fournisseur.raison_social,
            fournisseur.adresse,
            fournisseur.mat_vin,
            fournisseur.tel,
            fournisseur.fax,
            fournisseur.email,
            fournisseur.responsable,
            fournisseur.id_fiscale,
            fournisseur.banque,
            fournisseur.agence,
            fournisseur.rib,
            fournisseur.categorie_prix_vente,
            fournisseur.status,
            fournisseur.activite_economique,
            fournisseur.remise,
            fournisseur.taux_retenue
        ]
    );
    return result.insertId;
};

const getFournisseurs = async () => {
    const [fournisseurs] = await db.query('SELECT * FROM fournisseur');
    return fournisseurs;
};

const getFournisseurByCode = async (code) => {
    const [fournisseurs] = await db.query('SELECT * FROM fournisseur WHERE code = ?', [code]);
    return fournisseurs[0];
};

const updateFournisseur = async (code, fournisseur) => {
    await db.query(
        `UPDATE fournisseur SET 
            raison_social = ?,
            adresse = ?,
            mat_vin = ?,
            tel = ?,
            fax = ?,
            email = ?,
            responsable = ?,
            id_fiscale = ?,
            banque = ?,
            agence = ?,
            rib = ?,
            categorie_prix_vente = ?,
            status = ?,
            activite_economique = ?,
            remise = ?,
            taux_retenue = ?
        WHERE code = ?`,
        [
            fournisseur.raison_social,
            fournisseur.adresse,
            fournisseur.mat_vin,
            fournisseur.tel,
            fournisseur.fax,
            fournisseur.email,
            fournisseur.responsable,
            fournisseur.id_fiscale,
            fournisseur.banque,
            fournisseur.agence,
            fournisseur.rib,
            fournisseur.categorie_prix_vente,
            fournisseur.status,
            fournisseur.activite_economique,
            fournisseur.remise,
            fournisseur.taux_retenue,
            code
        ]
    );
};

const deleteFournisseur = async (code) => {
    await db.query('DELETE FROM fournisseur WHERE code = ?', [code]);
};

module.exports = {
    createFournisseur,
    getFournisseurs,
    getFournisseurByCode,
    updateFournisseur,
    deleteFournisseur
}; 