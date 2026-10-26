const mysql = require('mysql2');
require('dotenv').config();

// Connection Pool ব্যবহার করা হলো যাতে কানেকশন ড্রপ বা ECONNRESET হলে সার্ভার ক্র্যাশ না করে
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'rahul',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Connection with MySQL failed:', err.message);
  } else {
    console.log('✅ MySQL database (rahul) connected successfully!');
    connection.release();
  }
});

module.exports = db;

