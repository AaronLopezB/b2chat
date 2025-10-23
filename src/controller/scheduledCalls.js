const { response } = require('express');
const voiceCronJobs = require('../jobs/voiceCronJobs');
const { queryPool } = require('../models/conexion');
const {
    getCurrentDate,
    formatForMySQL,
    getFutureDate,
    isFutureDate,
    parseDate,
    getTimezoneInfo
} = require('../helpers/dateHelper');

/**
 * CONTROLADOR DE LLAMADAS PROGRAMADAS
 * Incluye operaciones CRUD completas y funciones de eliminación avanzadas
 */

/**
 * Programar una nueva llamada
 */
const scheduleCall = async (req, res = response) => {
    const {
        first_call_type,
        first_call_id,
        second_call_type,
        second_call_id,
        number_default,
        label,
        scheduled_at,
        max_retries = 3
    } = req.body;

    try {
        // Validar fecha programada usando helper de fechas
        let scheduledDate;
        if (scheduled_at) {
            scheduledDate = parseDate(scheduled_at);

            if (!scheduledDate) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Invalid date format. Use ISO format: 2025-10-22T15:30:00 or 2025-10-22'
                });
            }

            if (!isFutureDate(scheduledDate)) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Scheduled date must be in the future',
                    current_time: getCurrentDate().toISOString(),
                    provided_date: scheduledDate.toISOString()
                });
            }
        } else {
            // Si no se especifica fecha, programar para dentro de 1 minuto
            scheduledDate = getFutureDate(1);
        }


        // Obtener ID del usuario desde middleware de autenticación
        const user = await queryPool(`SELECT id FROM users WHERE api_key = ? LIMIT 1`, [req.token.identity]);
        const userId = user && user[0] ? user[0].id : null;


        const params = JSON.stringify({
            first_call_type,
            first_call_id,
            second_call_type,
            second_call_id,
            number_default,
            label: label || 'Scheduled Call'
        })

        const result = await queryPool(`
            INSERT INTO scheduled_calls (
                data, scheduled_at, max_retries, user_id, service
            ) VALUES (?, ?, ?, ?, ?)
        `, [
            params,
            formatForMySQL(scheduledDate),
            max_retries,
            userId,
            'VOICE'
        ]);

        // Log de creación


        await queryPool(`
            INSERT INTO call_logs (scheduled_call_id, event_type, event_timestamp, api_response)
            VALUES (?, 'scheduled', NOW(), ?)
        `, [result.insertId, JSON.stringify({ created_by: userId })]);

        res.status(201).json({
            ok: true,
            msg: 'Call scheduled successfully',
            // callId: result.insertId,
            scheduledAt: scheduledDate.toISOString(),

        });

    } catch (error) {
        console.error('Error in scheduleCall:', error);
        res.status(500).json({
            ok: false,
            msg: 'Internal server error',
            error: error.message
        });
    }
};

const scheduleChat = async (req, res = response) => {
    const {
        from,
        to,
        template_name,
        campaign_name,
        header_url,
        values,
        broadcast_target,
        scheduled_at,
        max_retries = 3
    } = req.body;

    try {
        // Validar fecha programada
        let scheduledDate;
        if (scheduled_at) {
            scheduledDate = new Date(scheduled_at);
            if (isNaN(scheduledDate) || scheduledDate <= new Date()) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Invalid scheduled_at date. Must be a future date.'
                });
            }
        } else {
            // Si no se especifica fecha, programar para dentro de 1 minuto
            scheduledDate = new Date(Date.now() + 60000);
        }


        // Obtener ID del usuario desde middleware de autenticación
        const user = await queryPool(`SELECT id FROM users WHERE api_key = ? LIMIT 1`, [req.token.identity]);
        const userId = user && user[0] ? user[0].id : null;


        const params = JSON.stringify({
            from,
            to,
            template_name,
            campaign_name,
            header_url,
            values,
            broadcast_target,
        })

        const result = await queryPool(`
            INSERT INTO scheduled_calls (
                data, scheduled_at, max_retries, user_id, service
            ) VALUES (?, ?, ?, ?)
        `, [params,
            scheduledDate,
            max_retries,
            userId,
            'B2'
        ]);

        // Log de creación


        await queryPool(`
            INSERT INTO call_logs (scheduled_call_id, event_type, event_timestamp, api_response)
            VALUES (?, 'scheduled', NOW(), ?)
        `, [result.insertId, JSON.stringify({ created_by: userId })]);

        res.status(201).json({
            ok: true,
            msg: 'Call scheduled successfully',
            // callId: result.insertId,
            scheduledAt: scheduledDate.toISOString(),

        });

    } catch (error) {
        console.error('Error in scheduleCall:', error);
        res.status(500).json({
            ok: false,
            msg: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Obtener llamadas programadas con filtros avanzados
 */
const getScheduledCalls = async (req, res = response) => {
    try {
        const {
            status,
            priority,
            date_from,
            date_to,
            limit = 50,
            offset = 0,
            sort_by = 'scheduled_at',
            sort_order = 'DESC'
        } = req.query;

        let whereConditions = [];
        let params = [];

        // Filtros
        if (status) {
            whereConditions.push('status = ?');
            params.push(status);
        }

        if (priority) {
            whereConditions.push('priority = ?');
            params.push(parseInt(priority));
        }

        if (date_from) {
            whereConditions.push('scheduled_at >= ?');
            params.push(date_from);
        }

        if (date_to) {
            whereConditions.push('scheduled_at <= ?');
            params.push(date_to);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // Validar ordenamiento
        const validSortFields = ['scheduled_at', 'created_at', 'priority', 'status', 'retry_count'];
        const validSortOrders = ['ASC', 'DESC'];
        const safeSortBy = validSortFields.includes(sort_by) ? sort_by : 'scheduled_at';
        const safeSortOrder = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

        params.push(parseInt(limit), parseInt(offset));

        const calls = await queryPool(`
            SELECT 
                id, first_call_type, first_call_id, second_call_type, second_call_id,
                number_default, label, scheduled_at, status, priority, timezone,
                retry_count, max_retries, executed_at, call_duration, api_call_id,
                created_by, created_at, updated_at
            FROM scheduled_calls 
            ${whereClause}
            ORDER BY ${safeSortBy} ${safeSortOrder}
            LIMIT ? OFFSET ?
        `, params);

        // Contar total
        const totalParams = params.slice(0, -2); // Remover limit y offset
        const total = await queryPool(`
            SELECT COUNT(*) as count FROM scheduled_calls ${whereClause}
        `, totalParams);

        res.json({
            ok: true,
            calls,
            total: total[0].count,
            limit: parseInt(limit),
            offset: parseInt(offset),
            filters: { status, priority, date_from, date_to }
        });

    } catch (error) {
        console.error('Error getting scheduled calls:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error retrieving scheduled calls'
        });
    }
};

/**
 * Obtener una llamada específica con sus logs
 */
const getScheduledCall = async (req, res = response) => {
    try {
        const { callId } = req.params;

        // Obtener llamada
        const call = await queryPool(`
            SELECT * FROM scheduled_calls WHERE id = ?
        `, [callId]);

        if (!call.length) {
            return res.status(404).json({
                ok: false,
                msg: 'Call not found'
            });
        }

        // Obtener logs de la llamada
        const logs = await queryPool(`
            SELECT event_type, event_timestamp, api_response, error_code, error_message, 
                   response_time_ms, attempt_number
            FROM call_logs 
            WHERE scheduled_call_id = ? 
            ORDER BY event_timestamp DESC
        `, [callId]);

        res.json({
            ok: true,
            call: call[0],
            logs
        });

    } catch (error) {
        console.error('Error getting scheduled call:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error retrieving call details'
        });
    }
};

/**
 * Cancelar una llamada programada
 */
const cancelScheduledCall = async (req, res = response) => {
    try {
        const { callId } = req.params;
        const { reason = 'Cancelled by user' } = req.body;

        const result = await queryPool(`
            UPDATE scheduled_calls 
            SET status = 'cancelled', last_error = ?, updated_at = NOW()
            WHERE id = ? AND status IN ('pending', 'processing')
        `, [reason, callId]);

        if (result.affectedRows > 0) {
            // Log de cancelación
            await queryPool(`
                INSERT INTO call_logs (scheduled_call_id, event_type, event_timestamp, api_response)
                VALUES (?, 'cancelled', NOW(), ?)
            `, [callId, JSON.stringify({ reason, cancelled_by: req.user?.[0]?.id })]);

            res.json({
                ok: true,
                msg: 'Call cancelled successfully'
            });
        } else {
            res.status(404).json({
                ok: false,
                msg: 'Call not found or already processed'
            });
        }

    } catch (error) {
        console.error('Error cancelling scheduled call:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error cancelling call'
        });
    }
};

/**
 * ELIMINAR una llamada específica (DELETE)
 */
const deleteScheduledCall = async (req, res = response) => {
    try {
        const { callId } = req.params;
        const { force = false } = req.query;

        // Verificar si la llamada existe
        const call = await queryPool(`
            SELECT id, status FROM scheduled_calls WHERE id = ?
        `, [callId]);

        if (!call.length) {
            return res.status(404).json({
                ok: false,
                msg: 'Call not found'
            });
        }

        // Solo permitir eliminar llamadas completadas, fallidas o canceladas, a menos que se use force
        if (!force && !['completed', 'failed', 'cancelled'].includes(call[0].status)) {
            return res.status(400).json({
                ok: false,
                msg: 'Cannot delete pending or processing calls. Use force=true to override or cancel first.',
                current_status: call[0].status
            });
        }

        // Eliminar la llamada (los logs se eliminan automáticamente por CASCADE)
        await queryPool(`DELETE FROM scheduled_calls WHERE id = ?`, [callId]);

        res.json({
            ok: true,
            msg: 'Call deleted successfully',
            deleted_call_id: parseInt(callId)
        });

    } catch (error) {
        console.error('Error deleting scheduled call:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error deleting call'
        });
    }
};

/**
 * ELIMINAR llamadas en lote (BULK DELETE)
 */
const deleteScheduledCallsBulk = async (req, res = response) => {
    try {
        const {
            status,
            older_than_days,
            priority,
            call_ids,
            confirm_delete = false
        } = req.body;

        if (!confirm_delete) {
            return res.status(400).json({
                ok: false,
                msg: 'Set confirm_delete: true to proceed with bulk deletion'
            });
        }

        let whereConditions = [];
        let params = [];

        // Construir condiciones WHERE
        if (status) {
            if (Array.isArray(status)) {
                const placeholders = status.map(() => '?').join(',');
                whereConditions.push(`status IN (${placeholders})`);
                params.push(...status);
            } else {
                whereConditions.push('status = ?');
                params.push(status);
            }
        }

        if (older_than_days) {
            whereConditions.push('created_at < DATE_SUB(NOW(), INTERVAL ? DAY)');
            params.push(older_than_days);
        }

        if (priority) {
            whereConditions.push('priority = ?');
            params.push(priority);
        }

        if (call_ids && Array.isArray(call_ids)) {
            const placeholders = call_ids.map(() => '?').join(',');
            whereConditions.push(`id IN (${placeholders})`);
            params.push(...call_ids);
        }

        if (whereConditions.length === 0) {
            return res.status(400).json({
                ok: false,
                msg: 'At least one filter condition is required for bulk delete'
            });
        }

        const whereClause = whereConditions.join(' AND ');

        // Primero, contar cuántas se van a eliminar
        const countResult = await queryPool(`
            SELECT COUNT(*) as count FROM scheduled_calls WHERE ${whereClause}
        `, params);

        const toDeleteCount = countResult[0].count;

        if (toDeleteCount === 0) {
            return res.json({
                ok: true,
                msg: 'No calls found matching the criteria',
                deleted_count: 0
            });
        }

        // Eliminar
        const deleteResult = await queryPool(`
            DELETE FROM scheduled_calls WHERE ${whereClause}
        `, params);

        res.json({
            ok: true,
            msg: 'Bulk deletion completed successfully',
            deleted_count: deleteResult.affectedRows,
            criteria: { status, older_than_days, priority, call_ids }
        });

    } catch (error) {
        console.error('Error in bulk delete:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error during bulk deletion'
        });
    }
};

/**
 * LIMPIAR llamadas antiguas (CLEANUP)
 */
const cleanupOldCalls = async (req, res = response) => {
    try {
        const {
            retention_days = 30,
            status_filter = ['completed', 'failed', 'cancelled'],
            dry_run = false
        } = req.body;

        const whereCondition = `
            created_at < DATE_SUB(NOW(), INTERVAL ? DAY) 
            AND status IN (${status_filter.map(() => '?').join(',')})
        `;
        const params = [retention_days, ...status_filter];

        if (dry_run) {
            // Solo contar sin eliminar
            const result = await queryPool(`
                SELECT 
                    status,
                    COUNT(*) as count,
                    MIN(created_at) as oldest,
                    MAX(created_at) as newest
                FROM scheduled_calls 
                WHERE ${whereCondition}
                GROUP BY status
            `, params);

            const total = await queryPool(`
                SELECT COUNT(*) as total FROM scheduled_calls WHERE ${whereCondition}
            `, params);

            return res.json({
                ok: true,
                msg: 'Dry run completed - no data was deleted',
                would_delete: total[0].total,
                breakdown: result,
                criteria: { retention_days, status_filter }
            });
        }

        // Eliminar realmente
        const deleteResult = await queryPool(`
            DELETE FROM scheduled_calls WHERE ${whereCondition}
        `, params);

        // Log de la operación de limpieza
        await queryPool(`
            INSERT INTO cron_job_logs (job_name, job_type, status, start_time, end_time, records_processed, records_success)
            VALUES ('manual_cleanup', 'cleanup', 'completed', NOW(), NOW(), ?, ?)
        `, [deleteResult.affectedRows, deleteResult.affectedRows]);

        res.json({
            ok: true,
            msg: 'Cleanup completed successfully',
            deleted_count: deleteResult.affectedRows,
            retention_days,
            status_filter
        });

    } catch (error) {
        console.error('Error in cleanup:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error during cleanup operation'
        });
    }
};

/**
 * Obtener estadísticas avanzadas
 */
const getCallStats = async (req, res = response) => {
    try {
        const { period = 'today' } = req.query;

        let dateFilter = '';
        let periodDescription = '';

        switch (period) {
            case 'today':
                dateFilter = 'DATE(created_at) = CURDATE()';
                periodDescription = 'Today';
                break;
            case 'yesterday':
                dateFilter = 'DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
                periodDescription = 'Yesterday';
                break;
            case 'week':
                dateFilter = 'created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
                periodDescription = 'Last 7 days';
                break;
            case 'month':
                dateFilter = 'created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
                periodDescription = 'Last 30 days';
                break;
            default:
                dateFilter = 'DATE(created_at) = CURDATE()';
                periodDescription = 'Today';
        }

        // Estadísticas generales
        const summary = await queryPool(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                AVG(call_duration) as avg_duration,
                AVG(retry_count) as avg_retries,
                MIN(scheduled_at) as earliest_scheduled,
                MAX(scheduled_at) as latest_scheduled
            FROM scheduled_calls 
            WHERE ${dateFilter}
        `);

        // Estadísticas por prioridad
        const priorityStats = await queryPool(`
            SELECT 
                priority,
                COUNT(*) as count,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                AVG(call_duration) as avg_duration
            FROM scheduled_calls 
            WHERE ${dateFilter}
            GROUP BY priority
            ORDER BY priority DESC
        `);

        // Estadísticas por hora (para hoy o ayer)
        let hourlyStats = [];
        if (['today', 'yesterday'].includes(period)) {
            hourlyStats = await queryPool(`
                SELECT 
                    HOUR(scheduled_at) as hour,
                    COUNT(*) as count,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
                FROM scheduled_calls 
                WHERE ${dateFilter}
                GROUP BY HOUR(scheduled_at)
                ORDER BY hour
            `);
        }

        // Llamadas más fallidas
        const failedCalls = await queryPool(`
            SELECT 
                id, label, first_call_type, first_call_id, second_call_type, second_call_id,
                retry_count, last_error, scheduled_at
            FROM scheduled_calls 
            WHERE status = 'failed' AND ${dateFilter}
            ORDER BY retry_count DESC, updated_at DESC
            LIMIT 10
        `);

        res.json({
            ok: true,
            period: periodDescription,
            summary: summary[0],
            by_priority: priorityStats,
            by_hour: hourlyStats,
            top_failed_calls: failedCalls
        });

    } catch (error) {
        console.error('Error getting call stats:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error retrieving statistics'
        });
    }
};

/**
 * Reprogramar una llamada fallida
 */
const rescheduleCall = async (req, res = response) => {
    try {
        const { callId } = req.params;
        const { new_scheduled_at, reset_retries = false } = req.body;

        if (!new_scheduled_at) {
            return res.status(400).json({
                ok: false,
                msg: 'new_scheduled_at is required'
            });
        }

        const newDate = new Date(new_scheduled_at);
        if (isNaN(newDate) || newDate <= new Date()) {
            return res.status(400).json({
                ok: false,
                msg: 'new_scheduled_at must be a valid future date'
            });
        }

        const updateFields = [
            'scheduled_at = ?',
            'status = "pending"',
            'last_error = NULL',
            'updated_at = NOW()'
        ];
        const params = [newDate];

        if (reset_retries) {
            updateFields.push('retry_count = 0');
        }

        params.push(callId);

        const result = await queryPool(`
            UPDATE scheduled_calls 
            SET ${updateFields.join(', ')}
            WHERE id = ? AND status IN ('failed', 'cancelled')
        `, params);

        if (result.affectedRows > 0) {
            // Log de reprogramación
            await queryPool(`
                INSERT INTO call_logs (scheduled_call_id, event_type, event_timestamp, api_response)
                VALUES (?, 'scheduled', NOW(), ?)
            `, [callId, JSON.stringify({
                rescheduled: true,
                new_date: newDate,
                reset_retries,
                rescheduled_by: req.user?.[0]?.id
            })]);

            res.json({
                ok: true,
                msg: 'Call rescheduled successfully',
                new_scheduled_at: newDate.toISOString()
            });
        } else {
            res.status(404).json({
                ok: false,
                msg: 'Call not found or cannot be rescheduled (must be failed or cancelled)'
            });
        }

    } catch (error) {
        console.error('Error rescheduling call:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error rescheduling call'
        });
    }
};

/**
 * Obtener información de fecha/hora del servidor
 */
const getServerTimeInfo = async (req, res = response) => {
    try {
        const timezoneInfo = getTimezoneInfo();

        res.json({
            ok: true,
            server_time: timezoneInfo,
            examples: {
                schedule_now_plus_5_min: getFutureDate(5).toISOString(),
                schedule_tomorrow_9am: (() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(9, 0, 0, 0);
                    return tomorrow.toISOString();
                })(),
                mysql_format_example: formatForMySQL(),
                valid_formats: [
                    "2025-10-22T15:30:00",
                    "2025-10-22T15:30:00Z",
                    "2025-10-22 15:30:00",
                    "2025-10-22"
                ]
            }
        });
    } catch (error) {
        console.error('Error getting server time info:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error retrieving server time information'
        });
    }
};

module.exports = {
    // CRUD básico
    scheduleCall,
    scheduleChat,
    getScheduledCalls,
    getScheduledCall,
    cancelScheduledCall,

    // Operaciones de eliminación
    deleteScheduledCall,
    deleteScheduledCallsBulk,
    cleanupOldCalls,

    // Estadísticas y gestión
    getCallStats,
    rescheduleCall,

    // Información del servidor
    getServerTimeInfo
};