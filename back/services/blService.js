const db = require('../models/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = path.extname(file.originalname);
    cb(null, `bl_import_${timestamp}${extension}`);
  }
});

const upload = multer({ storage: storage });

class BlService {
  // Get all BL records
  async getAllBl() {
    try {
      const [rows] = await db.query(`
        SELECT * FROM bl 
        ORDER BY date DESC, numero DESC
      `);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching BL records: ${error.message}`);
    }
  }

  // Get BL by ID
  async getBlById(id) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM bl WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error fetching BL record: ${error.message}`);
    }
  }

  // Create a new BL record
  async createBl(blData) {
    try {
      const {
        numero, date, code_tier, nom_raison_social, total_ttc,
        mode_paie, observation, user_create, totreg, deja_recu, reste
      } = blData;

      const [result] = await db.query(
        `INSERT INTO bl (
          numero, date, code_tier, nom_raison_social, total_ttc,
          mode_paie, observation, user_create, totreg, deja_recu, reste
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          numero, date, code_tier, nom_raison_social, total_ttc,
          mode_paie, observation, user_create, totreg || 0, deja_recu || 0, reste
        ]
      );

      return { id: result.insertId, ...blData };
    } catch (error) {
      throw new Error(`Error creating BL record: ${error.message}`);
    }
  }

  // Update BL record
  async updateBl(id, blData) {
    try {
      const {
        numero, date, code_tier, nom_raison_social, total_ttc,
        mode_paie, observation, user_create, totreg, deja_recu, reste
      } = blData;

      const [result] = await db.query(
        `UPDATE bl SET 
          numero = ?, date = ?, code_tier = ?, nom_raison_social = ?, total_ttc = ?,
          mode_paie = ?, observation = ?, user_create = ?, totreg = ?, deja_recu = ?, reste = ?
        WHERE id = ?`,
        [
          numero, date, code_tier, nom_raison_social, total_ttc,
          mode_paie, observation, user_create, totreg || 0, deja_recu || 0, reste, id
        ]
      );

      if (result.affectedRows === 0) {
        throw new Error('BL record not found');
      }

      return { message: 'BL record updated successfully' };
    } catch (error) {
      throw new Error(`Error updating BL record: ${error.message}`);
    }
  }

  // Delete BL record
  async deleteBl(id) {
    try {
      const [result] = await db.query('DELETE FROM bl WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('BL record not found');
      }

      return { message: 'BL record deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting BL record: ${error.message}`);
    }
  }

  // Import BL data from Excel file
  async importBlFromExcel(filePath) {
    try {
      // Read the Excel file
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Skip header row and process data
      const blRecords = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        // Skip empty rows
        if (!row[0]) continue;
        
        const blRecord = {
          numero: row[0] ? row[0].toString() : null,
          date: row[1] ? this.parseExcelDate(row[1]) : null,
          code_tier: row[2] ? row[2].toString() : null,
          nom_raison_social: row[3] ? row[3].toString() : null,
          total_ttc: row[4] ? parseFloat(row[4]) : null,
          mode_paie: row[5] ? row[5].toString() : null,
          observation: row[6] ? row[6].toString() : null,
          user_create: row[7] ? row[7].toString() : null,
          totreg: row[8] ? parseFloat(row[8]) : 0,
          deja_recu: row[9] ? parseFloat(row[9]) : 0,
          reste: row[10] ? parseFloat(row[10]) : null
        };
        
        blRecords.push(blRecord);
      }
      
      // Insert records into database
      const insertedRecords = [];
      for (const record of blRecords) {
        try {
          const result = await this.createBl(record);
          insertedRecords.push(result);
        } catch (error) {
          console.error(`Error inserting record ${record.numero}:`, error.message);
          // Continue with other records even if one fails
        }
      }
      
      // Clean up the uploaded file
      fs.unlinkSync(filePath);
      
      return {
        message: `Successfully imported ${insertedRecords.length} BL records`,
        importedCount: insertedRecords.length,
        totalRecords: blRecords.length
      };
    } catch (error) {
      // Clean up the uploaded file in case of error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new Error(`Error importing BL data: ${error.message}`);
    }
  }

  // Helper method to parse Excel date
  parseExcelDate(excelDate) {
    try {
      // Excel dates are often stored as numbers
      if (typeof excelDate === 'number') {
        // Excel date serial number (days since 1900-01-01)
        const excelEpoch = new Date(1900, 0, 1);
        const date = new Date(excelEpoch.getTime() + (excelDate - 2) * 24 * 60 * 60 * 1000);
        return date;
      } else if (typeof excelDate === 'string') {
        // Try to parse as date string
        const date = new Date(excelDate);
        return isNaN(date.getTime()) ? null : date;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Get upload middleware
  getUploadMiddleware() {
    return upload.single('file');
  }

  // Search BL records
  async searchBl(searchTerm) {
    try {
      const [rows] = await db.query(`
        SELECT * FROM bl 
        WHERE numero LIKE ? 
           OR nom_raison_social LIKE ? 
           OR code_tier LIKE ?
           OR user_create LIKE ?
        ORDER BY date DESC, numero DESC
      `, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
      
      return rows;
    } catch (error) {
      throw new Error(`Error searching BL records: ${error.message}`);
    }
  }

  // Get BL statistics
  async getBlStatistics() {
    try {
      const [totalCount] = await db.query('SELECT COUNT(*) as total FROM bl');
      const [totalAmount] = await db.query('SELECT SUM(total_ttc) as total_amount FROM bl WHERE total_ttc IS NOT NULL');
      const [totalRemaining] = await db.query('SELECT SUM(reste) as total_remaining FROM bl WHERE reste IS NOT NULL');
      
      return {
        totalRecords: totalCount[0].total,
        totalAmount: totalAmount[0].total_amount || 0,
        totalRemaining: totalRemaining[0].total_remaining || 0
      };
    } catch (error) {
      throw new Error(`Error fetching BL statistics: ${error.message}`);
    }
  }
}

module.exports = new BlService();

