const cron = require('node-cron');
const ApiVoiceService = require('../services/api-voice');
const { queryPool } = require('../models/conexion');

/**
 * Sistema de tareas programadas (cron jobs) para el servicio de voz.
 * 
 * Funcionalidades:
 * - Ejecutar llamadas programadas automáticamente
 * - Procesar cola de llamadas pendientes
 * - Generar reportes periódicos
 * - Limpiar logs antiguos
 */

class VoiceCronJobs {
    constructor() {
        this.token = null;
        this.isRunning = false;
    }

    /**
     * Inicializar el sistema de cron jobs
     */
    async start() {
        if (this.isRunning) {
            console.log('Cron jobs already running');
            return;
        }

        try {
            // Obtener token de autenticación al iniciar
            await this.refreshToken();
            this.isRunning = true;

            // Programar tareas
            this.scheduleJobs();

            console.log('Voice cron jobs started successfully');
        } catch (error) {
            console.error('Error starting voice cron jobs:', error);
        }
    }

    /**
     * Detener todas las tareas programadas
     */
    stop() {
        cron.getTasks().forEach(task => task.stop());
        this.isRunning = false;
        console.log('Voice cron jobs stopped');
    }

    /**
     * Refrescar token de autenticación
     */
    async refreshToken() {
        try {
            const loginResult = await ApiVoiceService.logIn();
            if (loginResult.ok && loginResult.result?.data.token) {
                this.token = loginResult.result.data.token;
                console.log('Voice API token refreshed');
                return true;
            } else {
                throw new Error('Failed to get access token');
            }
        } catch (error) {
            console.error('Error refreshing voice token:', error);
            return false;
        }
    }

    /**
     * Programar todas las tareas
     */
    scheduleJobs() {
        // Refrescar token cada 50 minutos (tokens suelen durar 1 hora)
        cron.schedule('*/50 * * * *', async () => {
            console.log('Refreshing voice API token...');
            await this.refreshToken();
        });

        // Procesar llamadas programadas cada 5 minutos
        cron.schedule('*/5 * * * *', async () => {
            await this.processScheduledCalls();
        });

        // Procesar cola de llamadas fallidas cada 10 minutos
        cron.schedule('*/10 * * * *', async () => {
            await this.retryFailedCalls();
        });

        // Limpiar logs antiguos diariamente a las 2:00 AM
        cron.schedule('0 2 * * *', async () => {
            await this.cleanOldLogs();
        });

        // Reporte diario a las 9:00 AM
        cron.schedule('0 9 * * *', async () => {
            await this.generateDailyReport();
        });

        console.log('Cron jobs scheduled:');
        console.log('- Token refresh: every 50 minutes');
        console.log('- Scheduled calls: every 5 minutes');
        console.log('- Retry failed calls: every 10 minutes');
        console.log('- Clean logs: daily at 2:00 AM');
        console.log('- Daily report: daily at 9:00 AM');
    }

    /**
     * Procesar llamadas programadas que deben ejecutarse ahora
     */
    async processScheduledCalls() {
        try {
            if (!this.token) {
                await this.refreshToken();
                if (!this.token) return;
            }

            // Buscar llamadas programadas pendientes
            const scheduledCalls = await queryPool(`
                SELECT id, data, scheduled_at, retry_count,service
                FROM scheduled_calls 
                WHERE status = 'pending' 
                AND scheduled_at <= NOW()
                AND retry_count < 3
                ORDER BY scheduled_at ASC
                LIMIT 10
            `);

            console.log(`Processing ${scheduledCalls.length} scheduled calls`);

            for (const call of scheduledCalls) {
                // Parsear si call.data viene como string

                await this.executeScheduledCall(call);
            }

        } catch (error) {
            console.error('Error processing scheduled calls:', error);
        }
    }

    /**
     * Ejecutar una llamada programada específica
     */
    async executeScheduledCall(callData) {
        try {
            console.log(callData);

            if (callData.service === 'VOICE') {
                // console.log(callData.data);
                const data = JSON.parse(callData.data);
                console.log(data);

                const params = {
                    datetime: "now",
                    first_call: {
                        destination_type: data.first_call_type,
                        destination_id: String(data.first_call_id)
                    },
                    second_call: {
                        destination_type: data.second_call_type,
                        destination_id: String(data.second_call_id)
                    },
                    preferred_trunk: data.number_default ? String(data.number_default) : null,
                    label: data.label || 'Scheduled Call'
                };

                console.log(`Executing scheduled call ID: ${callData.id}`);
                const result = await ApiVoiceService.createCall(params, this.token);

                if (result.ok) {
                    // Marcar como completada
                    await queryPool(`
                    UPDATE scheduled_calls 
                    SET status = 'completed', executed_at = NOW(), result = ?
                    WHERE id = ?
                `, [JSON.stringify(result), callData.id]);

                    console.log(`Scheduled call ${callData.id} completed successfully`);
                } else {
                    // Incrementar contador de reintentos
                    await queryPool(`
                    UPDATE scheduled_calls 
                    SET retry_count = retry_count + 1, last_error = ?
                    WHERE id = ?
                `, [JSON.stringify(result), callData.id]);

                    console.log(`Scheduled call ${callData.id} failed, retry count: ${callData.retry_count + 1}`);
                }
            }
            if (callData.service === 'B2') {

            }

        } catch (error) {
            console.error(`Error executing scheduled call ${callData.id}:`, error);

            // Marcar como error
            await queryPool(`
                UPDATE scheduled_calls 
                SET retry_count = retry_count + 1, last_error = ?
                WHERE id = ?
            `, [error.message, callData.id]);
        }
    }

    /**
     * Reintentar llamadas fallidas
     */
    async retryFailedCalls() {
        try {
            // Marcar como fallidas las llamadas que han excedido el límite de reintentos
            await queryPool(`
                UPDATE scheduled_calls 
                SET status = 'failed' 
                WHERE status = 'pending' 
                AND retry_count >= 3
            `);

            console.log('Failed calls marked as failed after max retries');
        } catch (error) {
            console.error('Error handling failed calls:', error);
        }
    }

    /**
     * Limpiar logs antiguos (más de 30 días)
     */
    async cleanOldLogs() {
        try {
            const result = await queryPool(`
                DELETE FROM scheduled_calls 
                WHERE status IN ('completed', 'failed') 
                AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
            `);

            console.log(`Cleaned ${result.affectedRows} old call records`);
        } catch (error) {
            console.error('Error cleaning old logs:', error);
        }
    }

    /**
     * Generar reporte diario de llamadas
     */
    async generateDailyReport() {
        try {
            const stats = await queryPool(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM scheduled_calls 
                WHERE DATE(created_at) = CURDATE()
                GROUP BY status
            `);

            console.log('=== DAILY VOICE CALLS REPORT ===');
            console.log('Date:', new Date().toISOString().split('T')[0]);

            let total = 0;
            stats.forEach(stat => {
                console.log(`${stat.status.toUpperCase()}: ${stat.count}`);
                total += stat.count;
            });

            console.log(`TOTAL: ${total}`);
            console.log('================================');

        } catch (error) {
            console.error('Error generating daily report:', error);
        }
    }

    /**
     * Programar una nueva llamada
     */
    async scheduleCall(callData, scheduledAt = new Date()) {
        try {
            const result = await queryPool(`
                INSERT INTO scheduled_calls (
                    first_call_type, first_call_id, second_call_type, second_call_id,
                    number_default, label, scheduled_at, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
            `, [
                callData.first_call_type,
                callData.first_call_id,
                callData.second_call_type,
                callData.second_call_id,
                callData.number_default,
                callData.label,
                scheduledAt
            ]);

            console.log(`Call scheduled with ID: ${result.insertId}`);
            return { ok: true, callId: result.insertId };
        } catch (error) {
            console.error('Error scheduling call:', error);
            return { ok: false, error: error.message };
        }
    }
}

module.exports = new VoiceCronJobs();