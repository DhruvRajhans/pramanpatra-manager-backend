const mysql = require('mysql2');

// Database connection settings
const dbConfig = {
    host: '45.152.46.204',
    user: 'u979817283_SauravRajhans',
    password: 'by?vFyO?0',
    database: 'u979817283_Certificate_Ma',
    multipleStatements: true,
    port: 3306,
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
