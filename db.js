const mysql = require('mysql2');

// Configuración robusta de la conexión
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'motomania',
    port: Number(process.env.DB_PORT) || 3306,
    // SOPORTE SSL (Vital para Railway desde Render)
    ssl: { rejectUnauthorized: false }, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Timeout estricto de 10 segundos para no dejar colgada la petición
    connectTimeout: 10000 
});

// Chivato proactivo para detectar fallos de conexión al cargar el módulo
const promisePool = pool.promise();

promisePool.getConnection()
    .then(connection => {
        console.log('✅ [DB] Conectado a la base de datos de Railway con éxito.');
        connection.release();
    })
    .catch(err => {
        console.error('❌ [DB ERROR] Error fatal al conectar con Railway:');
        if (err.code === 'ENOTFOUND') console.error('   -> El HOST es incorrecto o inalcanzable.');
        if (err.code === 'ER_ACCESS_DENIED_ERROR') console.error('   -> Las CREDENCIALES (User/Pass) son incorrectas.');
        if (err.code === 'ETIMEDOUT') console.error('   -> Tiempo de espera agotado (Revisa el puerto o el firewall).');
        console.error('   Detalle técnico:', err.message);
    });

module.exports = promisePool;
