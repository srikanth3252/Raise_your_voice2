const mysql = require("mysql2");

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 4000),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: {
        minVersion: "TLSv1.2"
    },

    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 5,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

db.on("error", (err) => {
    console.error("DATABASE POOL ERROR:", err);
});

db.getConnection((err, connection) => {
    if (err) {
        console.error("TiDB connection failed:", err.message);
        return;
    }

    console.log("Connected to TiDB successfully!");

    connection.on("error", (err) => {
        console.error("TIDB CONNECTION ERROR:", err.code, err.message);
    });

    connection.release();
});