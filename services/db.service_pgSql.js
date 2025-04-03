const { Pool, Client } = require('pg');

// Database connection settings
const dbConfig = {
    host: 'localhost', // Change if running locally (use 'localhost')
    user: 'envdev',
    password: 'Dev@123',
    database: 'Certificate_Management',
    port: 5432, // Default PostgreSQL port
    timezone: 'Asia/Kolkata',
};

// Connection pool for multiple connections
const pool = new Pool(dbConfig);

// Single client connection (useful for simple queries)
const client = new Client(dbConfig);

// Connect the client
client.connect()
    .then(() => console.log("✅ connected successfully!"))
    .catch(err => console.error("❌ connection error:", err.stack));

// Export connections
module.exports = { pool, client };
