const mysql = require('mysql2/promise');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const dbName = process.env.DB_NAME;

// List of table creation SQLs (from your dump, without INSERTs)
const tableStatements = [
  // Tables without foreign keys first
  `CREATE TABLE IF NOT EXISTS article_groups (
    id int NOT NULL AUTO_INCREMENT,
    code varchar(100) NOT NULL,
    name varchar(255) NOT NULL,
    PRIMARY KEY (id)
  ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS couleur_photo (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    description text,
    PRIMARY KEY (id)
  ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS design (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    description text,
    PRIMARY KEY (id)
  ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS fournisseur (
    code varchar(100) NOT NULL,
    raison_social varchar(255) NOT NULL,
    adresse text,
    mat_vin varchar(100) DEFAULT NULL,
    tel varchar(20) DEFAULT NULL,
    fax varchar(20) DEFAULT NULL,
    email varchar(255) DEFAULT NULL,
    responsable varchar(255) DEFAULT NULL,
    id_fiscale varchar(100) DEFAULT NULL,
    banque varchar(255) DEFAULT NULL,
    agence varchar(255) DEFAULT NULL,
    rib varchar(100) DEFAULT NULL,
    categorie_prix_vente varchar(100) DEFAULT NULL,
    status varchar(100) DEFAULT NULL,
    activite_economique varchar(255) DEFAULT NULL,
    remise decimal(5,2) DEFAULT NULL,
    taux_retenue decimal(5,2) DEFAULT NULL,
    rccm varchar(100) DEFAULT NULL,
    ninea varchar(100) DEFAULT NULL,
    code_douane varchar(100) DEFAULT NULL,
    PRIMARY KEY (code)
  ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS foyer (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    description text,
    PRIMARY KEY (id)
  ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS indice (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    description text,
    PRIMARY KEY (id)
  ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS opticien (
    id int NOT NULL AUTO_INCREMENT,
    codee varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
    nom varchar(255) DEFAULT NULL,
    prenom varchar(255) DEFAULT NULL,
    email varchar(191) NOT NULL,
    password varchar(255) NOT NULL,
    role varchar(50) DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY email (email)
  ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS traitement (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    description text,
    PRIMARY KEY (id)
  ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS typeArticle (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    description text,
    PRIMARY KEY (id)
  ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS client (
    id int NOT NULL AUTO_INCREMENT,
    codee varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
    raison_social varchar(255) DEFAULT NULL,
    email varchar(191) NOT NULL,
    password varchar(255) NOT NULL,
    responsable varchar(255) DEFAULT NULL,
    tel varchar(20) DEFAULT NULL,
    status varchar(20) NOT NULL,
    adresse text,
    rccm varchar(100) DEFAULT NULL,
    ninea varchar(100) DEFAULT NULL,
    code_douane varchar(100) DEFAULT NULL,
    password_reset_token varchar(250) NULL,
    password_reset_expires varchar(255) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY email (email)
  ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  
  // Tables with foreign keys (dependencies)
  `CREATE TABLE IF NOT EXISTS article_families (
    id int NOT NULL AUTO_INCREMENT,
    code varchar(100) NOT NULL,
    name varchar(255) NOT NULL,
    group_id int NOT NULL,
    PRIMARY KEY (id),
    KEY group_id (group_id)
  ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS article_subfamilies (
    id int NOT NULL AUTO_INCREMENT,
    code varchar(100) NOT NULL,
    name varchar(255) NOT NULL,
    family_id int NOT NULL,
    PRIMARY KEY (id),
    KEY family_id (family_id)
  ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS opticien_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    opticien_id INT NOT NULL,
    component_id VARCHAR(50) NOT NULL,
    has_access BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_opticien_component (opticien_id, component_id)
  ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS article (
    id int NOT NULL AUTO_INCREMENT,
    code varchar(100) NOT NULL,
    libelle varchar(255) NOT NULL,
    diametre decimal(10,2) DEFAULT NULL,
    foyer_id int DEFAULT NULL,
    indice_id int DEFAULT NULL,
    design_id int DEFAULT NULL,
    couleur_photo_id int DEFAULT NULL,
    traitement_id int DEFAULT NULL,
    prix_achat decimal(10,2) DEFAULT NULL,
    tva decimal(5,2) DEFAULT NULL,
    prix_vente decimal(10,2) DEFAULT NULL,
    code_a_barre varchar(255) DEFAULT NULL,
    expiration varchar(100) DEFAULT NULL,
    fournisseur_id varchar(100) DEFAULT NULL,
    typeArticle_id int DEFAULT NULL,
    article_subfamily_id int DEFAULT NULL,
    type_stock varchar(50) DEFAULT NULL,
    origineArticle varchar(100) NOT NULL,
    PRIMARY KEY (id),
    KEY foyer_id (foyer_id),
    KEY indice_id (indice_id),
    KEY design_id (design_id),
    KEY couleur_photo_id (couleur_photo_id),
    KEY traitement_id (traitement_id),
    KEY fournisseur_id (fournisseur_id),
    KEY typeArticle_id (typeArticle_id),
    KEY article_subfamily_id (article_subfamily_id)
  ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS stock (
    id int NOT NULL AUTO_INCREMENT,
    article_id int NOT NULL,
    sphere decimal(5,2) NOT NULL,
    cylindre decimal(5,2) DEFAULT NULL,
    addition decimal(5,2) DEFAULT NULL,
    quantite int NOT NULL DEFAULT '0',
    PRIMARY KEY (id),
    KEY article_id (article_id)
  ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS orders (
    id int NOT NULL AUTO_INCREMENT,
    client_id int NOT NULL,
    first_name varchar(100) DEFAULT NULL,
    last_name varchar(100) DEFAULT NULL,
    phone varchar(20) DEFAULT NULL,
    email varchar(100) DEFAULT NULL,
    od_sphere varchar(20) DEFAULT NULL,
    od_cylinder varchar(20) DEFAULT NULL,
    od_axe varchar(20) DEFAULT NULL,
    od_addition varchar(20) DEFAULT NULL,
    og_sphere varchar(20) DEFAULT NULL,
    og_cylinder varchar(20) DEFAULT NULL,
    og_axe varchar(20) DEFAULT NULL,
    og_addition varchar(20) DEFAULT NULL,
    typeCommande varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
    origineArticle varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
    produit int DEFAULT NULL,
    produit2 int DEFAULT NULL,
    price decimal(10,2) DEFAULT NULL,
    price2 decimal(10,2) DEFAULT NULL,
    shipping_type varchar(50) DEFAULT NULL,
    delivery_time varchar(50) DEFAULT NULL,
    selected_file varchar(255) DEFAULT NULL,
    order_datetime timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    status varchar(50) DEFAULT 'en attente',
    fournisseur_code varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
    payment_status varchar(50) DEFAULT 'unpaid',
    typeCorrection varchar(100) NOT NULL,
    total_price decimal(10,2) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY client_id (client_id),
    KEY produit (produit),
    KEY fk_fournisseur (fournisseur_code)
  ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`
];

async function initDb() {
  // Connect to MySQL without specifying database
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
  });

  // Check if database exists
  const [rows] = await connection.query('SHOW DATABASES LIKE ?', [dbName]);
  if (rows.length === 0) {
    await connection.query(`CREATE DATABASE ?? DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`, [dbName]);
    console.log(`Database '${dbName}' created.`);
  } else {
    console.log(`Database '${dbName}' already exists.`);
  }
  await connection.end();

  // Connect to the database
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: dbName
  });

  // Create all tables
  for (const stmt of tableStatements) {
    await db.query(stmt);
  }

  // Check if default admin opticien exists
  const [opticiens] = await db.query('SELECT * FROM opticien WHERE email = ?', ['admin@admin.com']);
  if (opticiens.length === 0) {
    const hashedPassword = await bcrypt.hash('admin@password123', 10);
    await db.query(
      `INSERT INTO opticien (codee, nom, prenom, email, password, role) VALUES (?, ?, ?, ?, ?, ?)`,
      ['admin01', 'admin', 'admin', 'admin@admin.com', hashedPassword, 'opticien']
    );
    console.log('Default admin opticien created: admin@admin.com / admin@password123');
  } else {
    console.log('Default admin opticien already exists.');
  }
  await db.end();
  console.log('All tables checked/created.');
}

module.exports = initDb; 