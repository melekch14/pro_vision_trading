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

  // Get BL by numero (to check for duplicates)
  async getBlByNumero(numero) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM bl WHERE numero = ?',
        [numero]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error fetching BL record by numero: ${error.message}`);
    }
  }

  // Find BL by order IDs (check if BL already exists for these orders)
  async findBlByOrderIds(orderIds) {
    try {
      if (!orderIds || orderIds.length === 0) {
        return null;
      }

      // Convert orderIds to integers and create placeholders
      const orderIdInts = orderIds.map(id => parseInt(id)).filter(id => !isNaN(id));
      if (orderIdInts.length === 0) {
        return null;
      }

      const placeholders = orderIdInts.map(() => '?').join(',');
      
      // Find BLs that have EXACTLY the same set of order IDs
      // This query finds BLs where:
      // 1. All input order IDs are linked to the BL
      // 2. The BL has no additional orders (count matches)
      const [rows] = await db.query(
        `SELECT b.*, 
                COUNT(DISTINCT bo.order_id) as matching_orders,
                (SELECT COUNT(*) FROM bl_orders WHERE bl_id = b.id) as total_orders
         FROM bl b
         INNER JOIN bl_orders bo ON b.id = bo.bl_id
         WHERE bo.order_id IN (${placeholders})
         GROUP BY b.id
         HAVING matching_orders = ? AND total_orders = ?`,
        [...orderIdInts, orderIdInts.length, orderIdInts.length]
      );

      // Return the first matching BL if found
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`Error finding BL by order IDs: ${error.message}`);
    }
  }

  // Create a new BL record
  async createBl(blData) {
    try {
      const {
        numero, date, code_tier, nom_raison_social, total_ttc,
        mode_paie, observation, user_create, totreg, deja_recu, reste, order_ids
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

      const blId = result.insertId;

      // Link orders to BL if order_ids are provided
      if (order_ids && Array.isArray(order_ids) && order_ids.length > 0) {
        const orderIdInts = order_ids.map(id => parseInt(id)).filter(id => !isNaN(id));
        if (orderIdInts.length > 0) {
          for (const orderId of orderIdInts) {
            try {
              await db.query(
                'INSERT INTO bl_orders (bl_id, order_id) VALUES (?, ?)',
                [blId, orderId]
              );
            } catch (linkError) {
              // Ignore duplicate key errors (order already linked)
              if (!linkError.message.includes('Duplicate entry')) {
                console.error(`Error linking order ${orderId} to BL ${blId}:`, linkError);
              }
            }
          }
        }
      }

      return { id: blId, ...blData };
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
        
        const code_tier = row[2] ? row[2].toString() : null;
        
        // Check if code_tier exists in client table (codee field)
        if (code_tier) {
          const [clients] = await db.query('SELECT id FROM client WHERE codee = ?', [code_tier]);
          if (clients.length === 0) {
            // Skip this row if client doesn't exist
            console.log(`Skipping row ${i + 1}: Code Tier ${code_tier} does not exist in client table`);
            continue;
          }
        }
        
        const blRecord = {
          numero: row[0] ? row[0].toString() : null,
          date: row[1] ? this.parseExcelDate(row[1]) : null,
          code_tier: code_tier,
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

  // Generate next unique BL number
  async getNextBlNumber() {
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const datePrefix = `${year}${month}${day}`;
      const blPrefix = `BL-${datePrefix}-`;

      // Get the highest sequence number for today
      const [rows] = await db.query(
        `SELECT numero FROM bl WHERE numero LIKE ? ORDER BY numero DESC LIMIT 1`,
        [`${blPrefix}%`]
      );

      let sequence = 1;
      if (rows.length > 0) {
        // Extract the sequence number from the last BL number
        const lastNumero = rows[0].numero;
        const parts = lastNumero.split('-');
        if (parts.length >= 3) {
          const lastSequence = parseInt(parts[2]) || 0;
          sequence = lastSequence + 1;
        }
      }

      // Try to find an available number (handle race conditions)
      let attempts = 0;
      const maxAttempts = 100; // Prevent infinite loop
      
      while (attempts < maxAttempts) {
        // Generate the BL number with 3-digit sequence (or more if needed)
        const sequenceStr = sequence.toString().padStart(3, '0');
        const blNumber = `${blPrefix}${sequenceStr}`;

        // Check if this number already exists
        const [existing] = await db.query('SELECT id FROM bl WHERE numero = ?', [blNumber]);
        
        if (existing.length === 0) {
          // Number is available, return it
          return blNumber;
        }
        
        // Number exists, try next sequence
        sequence++;
        attempts++;
      }

      // If we've tried too many times, throw an error
      throw new Error('Unable to generate unique BL number after multiple attempts');
    } catch (error) {
      throw new Error(`Error generating next BL number: ${error.message}`);
    }
  }
}

module.exports = new BlService();

