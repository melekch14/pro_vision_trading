const mysql = require('mysql2/promise');
require('dotenv').config();

const dbPassword = process.env.DB_PASS ?? process.env.DB_PASSWORD;
const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: dbPort,
    user: process.env.DB_USER,
    password: dbPassword,
    database: process.env.DB_NAME,
});

// Create opticien_permissions table
const createOpticienPermissionsTable = `
CREATE TABLE IF NOT EXISTS opticien_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  opticien_id INT NOT NULL,
  component_id VARCHAR(50) NOT NULL,
  has_access BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (opticien_id) REFERENCES opticien(id) ON DELETE CASCADE,
  UNIQUE KEY unique_opticien_component (opticien_id, component_id)
)`;

// Add the new table creation to the initialization
const initializeDatabase = async () => {
  try {
    // ... existing table creations ...
    await db.query(createOpticienPermissionsTable);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

module.exports = db;
