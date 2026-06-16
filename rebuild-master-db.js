const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function rebuild() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: '',
    multipleStatements: true
  });

  console.log('Connected to MySQL on port 3307.');

  try {
    console.log('Using master_saas_db...');
    await connection.query('USE master_saas_db;');

    console.log('Dropping tables if they exist...');
    const tables = ['admins', 'blockedips', 'plans', 'users'];
    for (const table of tables) {
      try {
        await connection.query(`DROP TABLE IF EXISTS \`${table}\`;`);
        console.log(`Dropped table ${table}`);
      } catch (err) {
        console.log(`Error dropping table ${table}:`, err.message);
      }
    }

    const sqlPath = path.join(__dirname, '..', 'master_saas_db.sql');
    console.log(`Reading SQL file from ${sqlPath}...`);
    let sql = fs.readFileSync(sqlPath, 'utf8');

    // Remove any CREATE DATABASE / USE database statements from sql if they exist
    sql = sql.replace(/CREATE DATABASE[\s\S]*?;/i, '');
    
    console.log('Importing SQL statements into existing database...');
    await connection.query(sql);
    console.log('✅ Import successful! Database master_saas_db rebuilt.');
  } catch (err) {
    console.error('❌ Error rebuilding database:', err);
  } finally {
    await connection.end();
  }
}

rebuild();
