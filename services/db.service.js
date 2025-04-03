const mysql = require('mysql2');

// Database connection settings
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
    port: process.env.DB_PORT || 3306,
};

// Connection pool for multiple connections
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10, // Adjust based on your server capacity
    queueLimit: 0
});

// Single connection (if needed)
const connection = pool.promise();

// Test connection
connection.getConnection()
    .then(conn => {
        console.log("? MySQL connected successfully!");
        conn.release();
    })
    .catch(err => console.error("? MySQL connection error:", err));

// Export connections
module.exports = { pool, connection };
