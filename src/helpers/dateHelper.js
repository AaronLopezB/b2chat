/**
 * HELPER PARA MANEJO DE FECHAS Y ZONA HORARIA
 * Centraliza el manejo de fechas para usar la zona horaria local
 */

// Configuración de zona horaria
const TIMEZONE = process.env.TZ || process.env.TIMEZONE || 'America/Bogota'; // Cambia según tu ubicación

/**
 * Obtener la fecha actual en la zona horaria configurada
 * @returns {Date} Fecha actual ajustada
 */
const getCurrentDate = () => {
    return new Date();
};

/**
 * Obtener la fecha actual como string ISO en zona horaria local
 * @returns {string} Fecha en formato ISO
 */
const getCurrentISOString = () => {
    const now = new Date();
    // Ajustar a zona horaria local
    const offset = now.getTimezoneOffset() * 60000;
    const localDate = new Date(now.getTime() - offset);
    return localDate.toISOString();
};

/**
 * Convertir fecha a zona horaria local
 * @param {string|Date} date - Fecha a convertir
 * @returns {Date} Fecha convertida
 */
const toLocalDate = (date) => {
    const inputDate = typeof date === 'string' ? new Date(date) : date;
    return new Date(inputDate.toLocaleString("en-US", { timeZone: TIMEZONE }));
};

/**
 * Formatear fecha para MySQL (DATETIME)
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha en formato MySQL
 */
const formatForMySQL = (date = new Date()) => {
    const localDate = toLocalDate(date);
    return localDate.toISOString().slice(0, 19).replace('T', ' ');
};

/**
 * Obtener fecha futura en minutos
 * @param {number} minutes - Minutos a añadir
 * @returns {Date} Fecha futura
 */
const getFutureDate = (minutes = 1) => {
    return new Date(Date.now() + (minutes * 60000));
};

/**
 * Validar si una fecha es futura
 * @param {string|Date} date - Fecha a validar
 * @returns {boolean} True si es futura
 */
const isFutureDate = (date) => {
    const inputDate = typeof date === 'string' ? new Date(date) : date;
    return inputDate > new Date();
};

/**
 * Obtener información de zona horaria
 * @returns {object} Información de zona horaria
 */
const getTimezoneInfo = () => {
    const now = new Date();
    return {
        timezone: TIMEZONE,
        current_date: now.toISOString(),
        local_date: now.toLocaleString(),
        offset_minutes: now.getTimezoneOffset(),
        offset_hours: now.getTimezoneOffset() / 60,
        mysql_format: formatForMySQL(now)
    };
};

/**
 * Parsear fecha desde diferentes formatos
 * @param {string} dateString - Fecha como string
 * @returns {Date|null} Fecha parseada o null si es inválida
 */
const parseDate = (dateString) => {
    if (!dateString) return null;
    
    // Intentar diferentes formatos
    const formats = [
        // ISO completo
        dateString,
        // Solo fecha (añadir hora actual)
        dateString.includes('T') ? dateString : `${dateString}T${new Date().toTimeString().slice(0, 8)}`,
        // Formato MySQL
        dateString.replace(' ', 'T')
    ];
    
    for (const format of formats) {
        const date = new Date(format);
        if (!isNaN(date)) {
            return date;
        }
    }
    
    return null;
};

module.exports = {
    TIMEZONE,
    getCurrentDate,
    getCurrentISOString,
    toLocalDate,
    formatForMySQL,
    getFutureDate,
    isFutureDate,
    getTimezoneInfo,
    parseDate
};