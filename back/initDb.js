const mysql = require('mysql2/promise');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const dbName = process.env.DB_NAME;
const hasDbPass =
  Object.prototype.hasOwnProperty.call(process.env, "DB_PASS") ||
  Object.prototype.hasOwnProperty.call(process.env, "DB_PASSWORD");
const dbPassword = process.env.DB_PASS ?? process.env.DB_PASSWORD ?? "";
const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;
const adminUser = process.env.DB_ADMIN_USER ?? process.env.DB_USER;
const adminPassword = process.env.DB_ADMIN_PASS ?? dbPassword;

// List of table creation SQLs (from your dump, without INSERTs)
const tableStatements = [
  // Tables without foreign keys first
  `CREATE TABLE IF NOT EXISTS article_groups (
    id int NOT NULL AUTO_INCREMENT,
    code varchar(100) NOT NULL,
    name varchar(255) NOT NULL,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS couleur_photo (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    description text,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS design (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    description text,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS foyer (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    description text,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS indice (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    description text,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS opticien (
    id int NOT NULL AUTO_INCREMENT,
    codee varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
    nom varchar(255) DEFAULT NULL,
    prenom varchar(255) DEFAULT NULL,
    email varchar(191) NOT NULL,
    password varchar(255) NOT NULL,
    role varchar(50) DEFAULT NULL,
    password_reset_token varchar(250) NULL,
    password_reset_expires varchar(255) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS traitement (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    description text,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS typeArticle (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    description text,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS client (
    id int NOT NULL AUTO_INCREMENT,
    codee varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
    raison_social varchar(255) DEFAULT NULL,
    email varchar(191) NOT NULL,
    password varchar(255) NOT NULL,
    responsable varchar(255) DEFAULT NULL,
    tel varchar(20) DEFAULT NULL,
    fax varchar(20) DEFAULT NULL,
    ville varchar(100) DEFAULT NULL,
    status varchar(20) NOT NULL,
    adresse text,
    risque varchar(100) DEFAULT NULL,
    rccm varchar(100) DEFAULT NULL,
    ninea varchar(100) DEFAULT NULL,
    code_douane varchar(100) DEFAULT NULL,
    password_reset_token varchar(250) NULL,
    password_reset_expires varchar(255) NULL,
    password_updated boolean DEFAULT FALSE,
    email_updated boolean DEFAULT FALSE,
    imported_from_excel boolean DEFAULT FALSE,
    PRIMARY KEY (id),
    UNIQUE KEY email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,

  // New table for profile update requests
  `CREATE TABLE IF NOT EXISTS profile_update_requests (
    id int NOT NULL AUTO_INCREMENT,
    client_id int NOT NULL,
    requested_data JSON NOT NULL,
    status enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    admin_notes text,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    reviewed_by int DEFAULT NULL,
    reviewed_at timestamp NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY client_id (client_id),
    KEY status (status),
    KEY reviewed_by (reviewed_by)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  
  // Tables with foreign keys (dependencies)
  `CREATE TABLE IF NOT EXISTS article_families (
    id int NOT NULL AUTO_INCREMENT,
    code varchar(100) NOT NULL,
    name varchar(255) NOT NULL,
    group_id int NOT NULL,
    PRIMARY KEY (id),
    KEY group_id (group_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS article_subfamilies (
    id int NOT NULL AUTO_INCREMENT,
    code varchar(100) NOT NULL,
    name varchar(255) NOT NULL,
    family_id int NOT NULL,
    PRIMARY KEY (id),
    KEY family_id (family_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS opticien_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    opticien_id INT NOT NULL,
    component_id VARCHAR(50) NOT NULL,
    has_access BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_opticien_component (opticien_id, component_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
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
    min_sphere decimal(5,2) DEFAULT NULL,
    max_sphere decimal(5,2) DEFAULT NULL,
    min_cylindre decimal(5,2) DEFAULT NULL,
    max_cylindre decimal(5,2) DEFAULT NULL,
    min_addition decimal(5,2) DEFAULT NULL,
    max_addition decimal(5,2) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY foyer_id (foyer_id),
    KEY indice_id (indice_id),
    KEY design_id (design_id),
    KEY couleur_photo_id (couleur_photo_id),
    KEY traitement_id (traitement_id),
    KEY fournisseur_id (fournisseur_id),
    KEY typeArticle_id (typeArticle_id),
    KEY article_subfamily_id (article_subfamily_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS stock (
    id int NOT NULL AUTO_INCREMENT,
    article_id int NOT NULL,
    sphere decimal(5,2) NOT NULL,
    cylindre decimal(5,2) DEFAULT NULL,
    addition decimal(5,2) DEFAULT NULL,
    quantite int NOT NULL DEFAULT '0',
    PRIMARY KEY (id),
    KEY article_id (article_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS supplementary_prices (
    id int NOT NULL AUTO_INCREMENT,
    stock_id int NOT NULL,
    sphere decimal(5,2) NOT NULL,
    cylindre decimal(5,2) DEFAULT NULL,
    addition decimal(5,2) DEFAULT NULL,
    prix_supplement decimal(10,2) NOT NULL DEFAULT '0',
    PRIMARY KEY (id),
    KEY stock_id (stock_id),
    FOREIGN KEY (stock_id) REFERENCES stock(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
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
    fabrication1 int DEFAULT NULL,
    fabrication2 int DEFAULT NULL,
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS bl (
    id int NOT NULL AUTO_INCREMENT,
    numero varchar(50) NOT NULL,
    date datetime DEFAULT NULL,
    code_tier varchar(20) DEFAULT NULL,
    nom_raison_social varchar(255) DEFAULT NULL,
    total_ttc decimal(15,2) DEFAULT NULL,
    mode_paie varchar(100) DEFAULT NULL,
    observation text DEFAULT NULL,
    user_create varchar(100) DEFAULT NULL,
    totreg decimal(15,2) DEFAULT 0,
    deja_recu decimal(15,2) DEFAULT 0,
    reste decimal(15,2) DEFAULT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY numero (numero),
    KEY code_tier (code_tier),
    KEY date (date),
    KEY user_create (user_create)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS bl_orders (
    id int NOT NULL AUTO_INCREMENT,
    bl_id int NOT NULL,
    order_id int NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_bl_order (bl_id, order_id),
    KEY bl_id (bl_id),
    KEY order_id (order_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  `CREATE TABLE IF NOT EXISTS activity_history (
    id int NOT NULL AUTO_INCREMENT,
    user_id int NOT NULL,
    user_name varchar(255) NOT NULL,
    user_role varchar(50) NOT NULL,
    action varchar(255) NOT NULL,
    target varchar(500) DEFAULT NULL,
    ip_address varchar(45) DEFAULT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY user_id (user_id),
    KEY created_at (created_at),
    KEY action (action(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`
];

async function initDb() {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;

  if (!host || !user || !dbName) {
    throw new Error("Missing required env vars: DB_HOST, DB_USER, DB_NAME");
  }
  if (!hasDbPass) {
    throw new Error("Missing DB password. Provide DB_PASS or DB_PASSWORD in backend .env");
  }

  // Try connecting directly to the target DB using app credentials.
  // If the DB doesn't exist yet, use admin creds to create it, then retry.
  let db;
  try {
    db = await mysql.createConnection({
      host,
      port: dbPort,
      user,
      password: dbPassword,
      database: dbName,
    });
  } catch (err) {
    // ER_BAD_DB_ERROR = Unknown database
    if (err && err.code === "ER_BAD_DB_ERROR") {
      const adminConn = await mysql.createConnection({
        host,
        port: dbPort,
        user: adminUser,
        password: adminPassword,
      });
      await adminConn.query(
        `CREATE DATABASE IF NOT EXISTS ?? DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
        [dbName]
      );
      await adminConn.end();
      console.log(`Database '${dbName}' checked/created (admin).`);

      db = await mysql.createConnection({
        host,
        port: dbPort,
        user,
        password: dbPassword,
        database: dbName,
      });
    } else {
      throw err;
    }
  }

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
      ['admin01', 'admin', 'admin', 'admin@admin.com', hashedPassword, 'administrateur']
    );
    console.log('Default admin opticien created: admin@admin.com / admin@password123');
  } else {
    console.log('Default admin opticien already exists.');
  }
  await db.end();
  console.log('All tables checked/created.');
}

module.exports = initDb; 
