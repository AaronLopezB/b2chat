const { queryPool } = require('../models/conexion');

/**
 * Servicio para registrar eventos en la base de datos.
 * Provee una función `logEvent` que inserta una fila en la tabla events_history.
 */
class HistoryService {
    /**
     * Registra un evento en la tabla events_history.
     * @param {Object} params
     * @param {number|null} params.user_id - id del usuario si está autenticado
     * @param {string} params.action - acción realizada (p.ej. 'get_contacts')
     * @param {string} params.route - ruta HTTP (p.ej. '/contacts')
     * @param {string} params.method - método HTTP (GET/POST/...)
     * @param {string} params.ip - ip del cliente
     * @param {Object|string|null} params.payload - datos relevantes (query/body)
     * @returns {Promise<any>} Resultado de la inserción
     */
    async logEvent({ user_id = null, action, route, method, ip, payload = null }) {
        try {
            const sql = `INSERT INTO events_history (user_id, action, route, method, ip, payload, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`;
            const params = [user_id, action, route, method, ip, JSON.stringify(payload)];
            const result = await queryPool(sql, params);
            return result;
        } catch (error) {
            console.error('HistoryService.logEvent error:', error);
            // No lanzar para no romper la petición principal; solo registrar
            return null;
        }
    }
}

module.exports = new HistoryService();
