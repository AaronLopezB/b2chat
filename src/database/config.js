const mysql = require('mysql2/promise'); // Corrección aquí

const pool = mysql.createPool({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE_NAME,
    waitForConnections: true,
    connectionLimit: Number(process.env.DATABASE_CONN_LIMIT || 10),
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