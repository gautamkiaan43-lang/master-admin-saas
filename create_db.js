const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabase() {
  try {
    // Connect to MySQL without specifying a database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306,
    });

    const dbName = process.env.DB_NAME || 'master_saas_db';

    console.log(`Checking if database '${dbName}' exists on port ${process.env.DB_PORT || 3306}...`);
    
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    
    console.log(`✅ Database '${dbName}' is ready!`);

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    process.exit(1);
  }
}

createDatabase();
