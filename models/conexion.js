'use strict';

const { pool } = require('../database/config');

/**
 * Campos almacenados como JSON en la base de datos.
 *
 * Si una columna viene como texto (string) pero contiene JSON
 * (por ejemplo por haber sido guardada con JSON.stringify),
 * esta lista define qué columnas deben intentar parsearse a objeto.
 * Añadir nombres de columnas aquí cuando sea necesario.
 */
const JSON_FIELDS = ['atributos'];


/**
 * Ejecuta una consulta usando el pool de conexiones y procesa resultados.
 *
 * Esta función obtiene una conexión del pool, ejecuta la consulta SQL
 * con los parámetros proporcionados y devuelve los resultados. Si el
 * resultado es un array (varias filas), itera cada fila y, para las
 * columnas definidas en `JSON_FIELDS`, intenta parsear cadenas JSON
 * a objetos con JSON.parse. Si la consulta devuelve un solo objeto
 * (por ejemplo con funciones agregadas), la función devuelve ese
 * resultado tal cual.
 *
 * Notas sobre entrada/salida:
 * - sql: string con la consulta SQL (puede contener placeholders ?)
 * - params: array con los valores para los placeholders de la consulta
 *
 * Retorna:
 * - Si la consulta devuelve múltiples filas: Array<Object> con las filas
 *   (y con los campos JSON parseados cuando corresponde).
 * - Si la consulta devuelve un valor escalar o un objeto: se devuelve
 *   ese resultado tal cual.
 *
 * Manejo de errores:
 * - Registra el error en consola y vuelve a lanzarlo para que el
 *   llamador pueda gestionarlo (try/catch externo recomendado).
 *
 * Ejemplo de uso:
 *   const rows = await queryPool('SELECT * FROM usuarios WHERE id = ?', [id]);
 *
 * @param {string} sql - Consulta SQL a ejecutar.
 * @param {Array} [params] - Parámetros para la consulta (opcional).
 * @returns {Promise<any>} Resultado de la consulta (Array|Object|valor).
 * @throws {Error} Error de la base de datos si la consulta falla.
 */
const queryPool = async (sql, params) => {
    let connection;
    try {
        // Obtener una conexión del pool (mysql2/promise o similar)
        connection = await pool.getConnection();

        // Ejecutar la consulta con los parámetros
        const [results, fields] = await connection.query(sql, params);

        // Si la respuesta no es un array, devolverla tal cual
        if (!Array.isArray(results)) return results;

        // Procesar cada fila: clonar la fila y parsear campos JSON cuando proceda
        return results.map(row => {
            const processedRow = { ...row };

            for (const key in processedRow) {
                // Si la columna está en JSON_FIELDS y es una cadena, intentar parsear
                if (JSON_FIELDS.includes(key) && typeof processedRow[key] === 'string') {
                    try {
                        processedRow[key] = JSON.parse(processedRow[key]);
                    } catch (e) {
                        // No queremos romper la aplicación por un campo mal formado;
                        // registramos la advertencia y dejamos el valor original.
                        console.warn(`No se pudo parsear el campo JSON "${key}":`, e.message);
                    }
                }
            }

            return processedRow;
        });
    } catch (error) {
        // Registro de errores para facilitar el debug; el error se relanza
        // para que la capa superior (servicio/controlador) pueda decidir qué hacer.
        console.error('Error en la consulta a la base de datos:', error);
        throw error;
    } finally {
        // Liberar la conexión de vuelta al pool si se obtuvo
        if (connection) connection.release();
    }
};

// Exportar la función principal de este módulo
module.exports = { queryPool };