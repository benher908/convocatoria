// config/db.js
const mysql2 = require('mysql2/promise');
require('dotenv').config();

const pool = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function connectBD() {
    let connectionAttempted = false; 
    let connection;

    try {
        console.log('Intentando obtener una conexión del pool...');
        connection = await pool.getConnection(); 
        connectionAttempted = true;
        console.log('Conexión exitosa a la base de datos.');

    } catch (error) {
        


        if (pool) {
            pool.end(err => {
                if (err) {
                    console.error('Error al cerrar el pool de conexiones tras el fallo:', err.message);
                } else {
                    console.log('Pool de conexiones cerrado debido a un error inicial de conexión.');
                }
            });
        }
        process.exit(1); 
    } finally {
        
        if (connection && connectionAttempted) {
            connection.release();
            console.log('Conexión de prueba liberada de vuelta al pool.');
        } else if (connectionAttempted && !connection) {
            
            console.log('No se pudo obtener una conexión válida para liberar.');
        }
    }
}

module.exports = {
    pool:pool,
    connectBD: connectBD,
};