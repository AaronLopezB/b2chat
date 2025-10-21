
const { header } = require('express-validator');
const { queryPool } = require('../models/conexion');
const historyService = require('../services/historyService');

/**
 * Middleware para registrar eventos de peticiones HTTP.
 *
 * Uso: colocarlo globalmente o en rutas específicas:
 * app.use(require('./middlewares/history-events'))
 *
 * El middleware intenta guardar un registro con: user_id (si existe),
 * acción (ruta normalizada), método, ip y payload (query o body).
 */
const historyEvents = async (req, res, next) => {
    try {
        const user = await queryPool('SELECT id FROM users WHERE api_key = ?', [req.token?.identity]);

        // console.log({ 'method': 'middleware-history', user: user });

        const user_id = user ? user[0].id : null;
        const route = req.originalUrl || req.url;
        const method = req.method;
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.socket?.remoteAddress || null;

        // console.dir({
        //     'method': 'middleware-history', user: user_id, route, method, ip: req.ip, remote: req.connection?.remoteAddress, headers: req.socket?.remoteAddress
        // });
        // Elegir payload: preferir query para GET/HEAD, body para otros métodos
        const payload = (/* method === 'GET' || */ method === 'HEAD') ? req.query : req.body;

        // action: ruta + método (puedes normalizar según tus rutas)
        const action = `${method} ${route}`;

        // Registrar asincrónicamente, no bloquear la petición

        historyService.logEvent({ user_id, action, route, method, ip, payload });
    } catch (err) {
        console.error('history-events middleware error:', err);
        // No interrumpir la petición si el logging falla
    }

    next();
};

module.exports = { historyEvents };

