const mysql = require('mysql2/promise'); // Corrección aquí
const config = require('../config/app');

const pool = mysql.createPool({
    host: config.database.host,
    port: Number(config.database.port || 3306),
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
    waitForConnections: true,
    connectionLimit: Number(config.database.limit || 10),
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 15_000,
    multipleStatements: false,
});

// Asegúrate de tener logger definido antes de usarlo
pool.on('connection', async (conn) => {
    // logger.info('[DB] Conexión creada en el pool');
    console.log('Conexión creada en el pool');

    try {
        const p = conn.promise();
        await p.query('SET SESSION wait_timeout = 600');
        await p.query('SET SESSION interactive_timeout = 600');
    } catch (e) {
        console.log('[DB] No se pudo ajustar timeouts de sesión', { error: e.code || e.message });

        // logger.warn('[DB] No se pudo ajustar timeouts de sesión', { error: e.code || e.message });
    }
});
setInterval(async () => {
    try { const c = await pool.getConnection(); await c.ping(); c.release(); }
    catch (e) { console.log('[DB] Ping falló', { error: e.code || e.message }); }
}, 60_000);

module.exports = { pool };