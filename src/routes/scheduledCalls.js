const { Router } = require('express');
const { check, query, body } = require('express-validator');

const {
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
} = require('../controller/scheduledCalls');

const { validateAccess, validateAccessVoice } = require('../middlewares/validate-access');

const router = Router();

// ====================================================================
// RUTAS BÁSICAS (CRUD)
// ====================================================================

// Programar una nueva llamada
router.post('/schedule/voice',
    [
        check('first_call_type', 'First call type is required').isIn(['ext', 'phone']),
        check('first_call_id', 'First call ID is required').notEmpty(),
        check('second_call_type', 'Second call type is required').isIn(['ext', 'phone']),
        check('second_call_id', 'Second call ID is required').notEmpty(),
        check('scheduled_at', 'Scheduled date must be valid').isISO8601(),
        validateAccessVoice
    ],
    scheduleCall
);
router.post('/schedule/chat',
    [
        //  from, to, template_name, campaign_name, header_url, values, broadcast_target
        check('from', 'From is required').notEmpty(),
        check('to', 'To is required').notEmpty(),
        check('template_name', 'Template name is required').notEmpty(),
        check('campaign_name', 'Campaign name is required').notEmpty(),
        check('header_url', 'Header URL is required').optional().isURL(),
        check('values', 'Values must be an array').optional().isArray(),
        check('broadcast_target', 'Broadcast target is required').notEmpty(),
        check('scheduled_at', 'Scheduled date must be valid').isISO8601(),
        validateAccessVoice
    ],
    scheduleChat
);

// Obtener todas las llamadas programadas (con filtros)
router.get('/',
    [
        query('status', 'Status must be valid').optional().isIn(['pending', 'processing', 'completed', 'failed', 'cancelled']),
        query('priority', 'Priority must be between 1 and 5').optional().isInt({ min: 1, max: 5 }),
        query('limit', 'Limit must be a number').optional().isInt({ min: 1, max: 100 }),
        query('offset', 'Offset must be a number').optional().isInt({ min: 0 }),
        query('sort_by', 'Sort field must be valid').optional().isIn(['scheduled_at', 'created_at', 'priority', 'status', 'retry_count']),
        query('sort_order', 'Sort order must be valid').optional().isIn(['ASC', 'DESC']),
        query('date_from', 'Date from must be valid').optional().isISO8601(),
        query('date_to', 'Date to must be valid').optional().isISO8601(),
        validateAccessVoice
    ],
    getScheduledCalls
);

// Obtener una llamada específica con sus logs
router.get('/:callId',
    [
        check('callId', 'Call ID is required').isInt(),
        validateAccessVoice
    ],
    getScheduledCall
);

// Cancelar una llamada programada
router.patch('/:callId/cancel',
    [
        check('callId', 'Call ID is required').isInt(),
        body('reason', 'Reason must be a string').optional().isString(),
        validateAccessVoice
    ],
    cancelScheduledCall
);

// Reprogramar una llamada fallida
router.patch('/:callId/reschedule',
    [
        check('callId', 'Call ID is required').isInt(),
        body('new_scheduled_at', 'New scheduled date is required').isISO8601(),
        body('reset_retries', 'Reset retries must be boolean').optional().isBoolean(),
        validateAccessVoice
    ],
    rescheduleCall
);

// ====================================================================
// RUTAS DE ELIMINACIÓN
// ====================================================================

// Eliminar una llamada específica
router.delete('/:callId',
    [
        check('callId', 'Call ID is required').isInt(),
        query('force', 'Force must be boolean').optional().isBoolean(),
        validateAccess
    ],
    deleteScheduledCall
);

// Eliminación en lote (bulk delete)
router.delete('/bulk/delete',
    [
        body('confirm_delete', 'Must confirm deletion').equals('true'),
        body('status', 'Status must be valid').optional(),
        body('older_than_days', 'Days must be a number').optional().isInt({ min: 1 }),
        body('priority', 'Priority must be between 1 and 5').optional().isInt({ min: 1, max: 5 }),
        body('call_ids', 'Call IDs must be an array of integers').optional().isArray(),
        validateAccess
    ],
    deleteScheduledCallsBulk
);

// Limpiar llamadas antiguas
router.post('/cleanup',
    [
        body('retention_days', 'Retention days must be a number').optional().isInt({ min: 1 }),
        body('status_filter', 'Status filter must be an array').optional().isArray(),
        body('dry_run', 'Dry run must be boolean').optional().isBoolean(),
        validateAccess
    ],
    cleanupOldCalls
);

// ====================================================================
// RUTAS DE ESTADÍSTICAS Y REPORTES
// ====================================================================

// Obtener estadísticas avanzadas
router.get('/reports/stats',
    [
        query('period', 'Period must be valid').optional().isIn(['today', 'yesterday', 'week', 'month']),
        validateAccess
    ],
    getCallStats
);

// ====================================================================
// EJEMPLOS DE USO (COMENTADOS)
// ====================================================================

/*
EJEMPLOS DE RUTAS Y PAYLOADS:

1. PROGRAMAR LLAMADA:
POST /api/scheduled-calls/schedule
{
  "first_call_type": "ext",
  "first_call_id": "1001", 
  "second_call_type": "phone",
  "second_call_id": "+1234567890",
  "scheduled_at": "2025-10-23T15:30:00Z",
  "priority": 3,
  "label": "Llamada importante"
}

2. OBTENER LLAMADAS FILTRADAS:
GET /api/scheduled-calls?status=pending&priority=5&limit=20&sort_by=priority&sort_order=DESC

3. ELIMINAR LLAMADA:
DELETE /api/scheduled-calls/123?force=true

4. ELIMINACIÓN EN LOTE:
DELETE /api/scheduled-calls/bulk/delete
{
  "confirm_delete": "true",
  "status": ["completed", "failed"],
  "older_than_days": 30
}

5. LIMPIAR LLAMADAS ANTIGUAS (DRY RUN):
POST /api/scheduled-calls/cleanup
{
  "retention_days": 30,
  "status_filter": ["completed", "failed"],
  "dry_run": true
}

6. REPROGRAMAR LLAMADA:
PATCH /api/scheduled-calls/123/reschedule
{
  "new_scheduled_at": "2025-10-24T10:00:00Z",
  "reset_retries": true
}

7. ESTADÍSTICAS:
GET /api/scheduled-calls/reports/stats?period=week

8. INFORMACIÓN DE FECHA/HORA DEL SERVIDOR:
GET /api/scheduled-calls/server-time
*/

// ====================================================================
// RUTA DE INFORMACIÓN DEL SERVIDOR
// ====================================================================

// Obtener información de fecha/hora del servidor
router.get('/server-time', getServerTimeInfo);

module.exports = router;