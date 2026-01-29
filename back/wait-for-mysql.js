const mysql = require("mysql2/promise");

const waitForMysql = async () => {
  const dbPassword = process.env.DB_PASS ?? process.env.DB_PASSWORD;
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: dbPassword,
    multipleStatements: true,
  };

  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    try {
      const connection = await mysql.createConnection(config);
      console.log("✅ MySQL is ready!");
      await connection.end();
      process.exit(0);
    } catch (err) {
      console.log(`⏳ Waiting for MySQL... attempt ${attempts + 1}`);
      attempts++;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.error("❌ Failed to connect to MySQL after multiple attempts.");
  process.exit(1);
};

waitForMysql();
