-- ====================================================================
-- B2CHAT DATABASE SCHEMA - Sistema de Llamadas Programadas
-- ====================================================================
-- Fecha: 2025-10-22
-- Descripción: Schema completo para el sistema de cron jobs de llamadas
-- ====================================================================
-- Eliminar tablas existentes si existen (opcional - usar con cuidado)
-- DROP TABLE IF EXISTS scheduled_calls;
-- DROP TABLE IF EXISTS call_logs;
-- DROP TABLE IF EXISTS cron_job_logs;
-- ====================================================================
-- 1. TABLA PRINCIPAL: scheduled_calls
-- ====================================================================
-- Almacena todas las llamadas programadas
CREATE TABLE IF NOT EXISTS scheduled_calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Datos de la primera llamada
    first_call_type ENUM('ext', 'phone', 'queue', 'group') NOT NULL COMMENT 'Tipo de primer destino',
    first_call_id VARCHAR(64) NOT NULL COMMENT 'ID/número del primer destino',
    -- Datos de la segunda llamada  
    second_call_type ENUM('ext', 'phone', 'queue', 'group') NOT NULL COMMENT 'Tipo de segundo destino',
    second_call_id VARCHAR(64) NOT NULL COMMENT 'ID/número del segundo destino',
    -- Configuración adicional
    number_default VARCHAR(20) NULL COMMENT 'Trunk o número por defecto',
    label VARCHAR(255) NULL COMMENT 'Etiqueta descriptiva de la llamada',
    priority TINYINT DEFAULT 1 COMMENT 'Prioridad (1=baja, 5=alta)',
    -- Programación
    scheduled_at DATETIME NOT NULL COMMENT 'Fecha y hora programada',
    timezone VARCHAR(50) DEFAULT 'UTC' COMMENT 'Zona horaria',
    -- Estado y control
    status ENUM(
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled'
    ) DEFAULT 'pending',
    retry_count INT DEFAULT 0 COMMENT 'Número de reintentos realizados',
    max_retries INT DEFAULT 3 COMMENT 'Máximo número de reintentos permitidos',
    -- Resultados
    executed_at DATETIME NULL COMMENT 'Fecha y hora de ejecución',
    call_duration INT NULL COMMENT 'Duración de la llamada en segundos',
    api_call_id VARCHAR(100) NULL COMMENT 'ID de la llamada en el sistema externo',
    result JSON NULL COMMENT 'Resultado completo de la API',
    last_error TEXT NULL COMMENT 'Último error ocurrido',
    -- Usuario y auditoría
    created_by INT NULL COMMENT 'ID del usuario que programó la llamada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Constraints
    INDEX idx_status (status),
    INDEX idx_scheduled_at (scheduled_at),
    INDEX idx_created_at (created_at),
    INDEX idx_priority_scheduled (priority, scheduled_at),
    INDEX idx_status_retry (status, retry_count),
    INDEX idx_created_by (created_by)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Tabla principal para llamadas programadas';

-- Tabla para almacenar llamadas programadas
CREATE TABLE IF NOT EXISTS scheduled_calls (
    id CHAR(36) NOT NULL DEFAULT uuid() PRIMARY KEY,
    json JSON NULL DEFAULT NULL,
    user_id CHAR(36) NULL DEFAULT uuid(),
    service ENUM('B2', 'VOICE') NULL DEFAULT 'VOICE',
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    retry_count INT DEFAULT 0 COMMENT 'Número de reintentos realizados',
    max_retries INT DEFAULT 3 COMMENT 'Máximo número de reintentos permitidos',
    executed_at DATETIME NULL,
    result JSON NULL COMMENT 'Resultado completo de la API',
    last_error TEXT NULL COMMENT 'Último error ocurrido',
    scheduled_at DATETIME NOT NULL COMMENT 'Fecha y hora programada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX `user_id` (`user_id`) USING BTREE,
    CONSTRAINT `FK_calls_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
    INDEX idx_status (status),
    INDEX idx_scheduled_at (scheduled_at),
    INDEX idx_created_at (created_at),
    INDEX idx_priority_scheduled (scheduled_at),
    INDEX idx_status_retry (status, retry_count),
    INDEX idx_created_by (user_id)
);

-- ====================================================================
-- 2. TABLA DE LOGS: call_logs  
-- ====================================================================
-- Registra el historial detallado de todas las llamadas
CREATE TABLE IF NOT EXISTS call_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scheduled_call_id INT NOT NULL COMMENT 'FK a scheduled_calls',
    -- Información de la llamada
    event_type ENUM(
        'scheduled',
        'started',
        'connected',
        'ended',
        'failed',
        'cancelled'
    ) NOT NULL,
    event_timestamp DATETIME NOT NULL,
    -- Detalles técnicos  
    api_response JSON NULL COMMENT 'Respuesta completa de la API',
    error_code VARCHAR(50) NULL COMMENT 'Código de error específico',
    error_message TEXT NULL COMMENT 'Mensaje de error detallado',
    -- Métricas
    response_time_ms INT NULL COMMENT 'Tiempo de respuesta en milisegundos',
    attempt_number INT DEFAULT 1 COMMENT 'Número del intento',
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Foreign Key
    FOREIGN KEY (scheduled_call_id) REFERENCES scheduled_calls (id) ON DELETE CASCADE,
    -- Índices
    INDEX idx_scheduled_call (scheduled_call_id),
    INDEX idx_event_type (event_type),
    INDEX idx_event_timestamp (event_timestamp),
    INDEX idx_error_code (error_code)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Log detallado de eventos de llamadas';

-- ====================================================================
-- 3. TABLA DE CONTROL: cron_job_logs
-- ====================================================================
-- Registra la ejecución de los cron jobs
CREATE TABLE IF NOT EXISTS cron_job_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Información del job
    job_name VARCHAR(100) NOT NULL COMMENT 'Nombre del cron job',
    job_type ENUM(
        'token_refresh',
        'process_calls',
        'retry_failed',
        'cleanup',
        'report'
    ) NOT NULL,
    -- Estado de ejecución
    status ENUM('started', 'completed', 'failed') NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    duration_ms INT NULL COMMENT 'Duración en milisegundos',
    -- Resultados
    records_processed INT DEFAULT 0 COMMENT 'Número de registros procesados',
    records_success INT DEFAULT 0 COMMENT 'Registros procesados exitosamente',
    records_failed INT DEFAULT 0 COMMENT 'Registros que fallaron',
    -- Detalles
    details JSON NULL COMMENT 'Detalles adicionales del job',
    error_message TEXT NULL COMMENT 'Mensaje de error si falló',
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Índices
    INDEX idx_job_type (job_type),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time),
    INDEX idx_job_name (job_name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Log de ejecución de cron jobs';

-- ====================================================================
-- 4. TABLA DE CONFIGURACIÓN: cron_job_config
-- ====================================================================
-- Configuración dinámica de los cron jobs
CREATE TABLE IF NOT EXISTS cron_job_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Configuración del job
    job_name VARCHAR(100) NOT NULL UNIQUE,
    cron_pattern VARCHAR(50) NOT NULL COMMENT 'Patrón cron (ej: */5 * * * *)',
    is_enabled BOOLEAN DEFAULT TRUE COMMENT 'Si el job está habilitado',
    -- Configuración adicional
    max_concurrent_runs INT DEFAULT 1 COMMENT 'Máximo de ejecuciones concurrentes',
    timeout_seconds INT DEFAULT 300 COMMENT 'Timeout en segundos',
    retry_on_failure BOOLEAN DEFAULT TRUE COMMENT 'Si debe reintentar en caso de fallo',
    -- Configuración específica por job
    config JSON NULL COMMENT 'Configuración específica del job',
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Índices
    INDEX idx_job_name (job_name),
    INDEX idx_enabled (is_enabled)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Configuración de cron jobs';

-- ====================================================================
-- 5. VISTA PARA ESTADÍSTICAS
-- ====================================================================
-- Vista para obtener estadísticas rápidas
CREATE OR REPLACE VIEW v_call_statistics AS
SELECT
    DATE(created_at) as date,
    status,
    priority,
    COUNT(*) as count,
    AVG(call_duration) as avg_duration,
    AVG(retry_count) as avg_retries,
    MIN(created_at) as first_call,
    MAX(created_at) as last_call
FROM
    scheduled_calls
WHERE
    created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY
    DATE(created_at),
    status,
    priority
ORDER BY
    date DESC,
    priority DESC;

-- ====================================================================
-- 6. DATOS INICIALES
-- ====================================================================
-- Configuración inicial de cron jobs
INSERT INTO
    cron_job_config (
        job_name,
        cron_pattern,
        is_enabled,
        timeout_seconds,
        config
    )
VALUES
    (
        'token_refresh',
        '*/50 * * * *',
        TRUE,
        30,
        '{"description": "Refresh voice API token every 50 minutes"}'
    ),
    (
        'process_calls',
        '*/5 * * * *',
        TRUE,
        300,
        '{"batch_size": 10, "description": "Process scheduled calls every 5 minutes"}'
    ),
    (
        'retry_failed',
        '*/10 * * * *',
        TRUE,
        180,
        '{"max_retries": 3, "description": "Retry failed calls every 10 minutes"}'
    ),
    (
        'cleanup_logs',
        '0 2 * * *',
        TRUE,
        600,
        '{"retention_days": 30, "description": "Clean old logs daily at 2 AM"}'
    ),
    (
        'daily_report',
        '0 9 * * *',
        TRUE,
        60,
        '{"email_enabled": false, "description": "Generate daily report at 9 AM"}'
    )
ON DUPLICATE KEY UPDATE
    cron_pattern = VALUES(cron_pattern),
    updated_at = CURRENT_TIMESTAMP;

-- ====================================================================
-- 7. STORED PROCEDURES ÚTILES
-- ====================================================================
-- Procedure para obtener llamadas pendientes
DELIMITER / /
CREATE PROCEDURE IF NOT EXISTS GetPendingCalls (IN batch_size INT) BEGIN
SELECT
    id,
    first_call_type,
    first_call_id,
    second_call_type,
    second_call_id,
    number_default,
    label,
    scheduled_at,
    retry_count,
    priority
FROM
    scheduled_calls
WHERE
    status = 'pending'
    AND scheduled_at <= NOW()
    AND retry_count < max_retries
ORDER BY
    priority DESC,
    scheduled_at ASC
LIMIT
    batch_size;

END / / DELIMITER;

-- Procedure para marcar llamada como procesada
DELIMITER / /
CREATE PROCEDURE IF NOT EXISTS MarkCallProcessed (
    IN call_id INT,
    IN new_status ENUM('processing', 'completed', 'failed'),
    IN api_call_id VARCHAR(100),
    IN call_duration INT,
    IN result_json JSON,
    IN error_msg TEXT
) BEGIN
UPDATE scheduled_calls
SET
    status = new_status,
    executed_at = CASE
        WHEN new_status IN ('completed', 'failed') THEN NOW()
        ELSE executed_at
    END,
    api_call_id = COALESCE(api_call_id, api_call_id),
    call_duration = COALESCE(call_duration, call_duration),
    result = COALESCE(result_json, result),
    last_error = CASE
        WHEN new_status = 'failed' THEN error_msg
        ELSE last_error
    END,
    retry_count = CASE
        WHEN new_status = 'failed' THEN retry_count + 1
        ELSE retry_count
    END,
    updated_at = NOW()
WHERE
    id = call_id;

END / / DELIMITER;

-- ====================================================================
-- 8. TRIGGERS PARA AUDITORÍA
-- ====================================================================
-- Trigger para log automático de cambios de estado
DELIMITER / /
CREATE TRIGGER IF NOT EXISTS tr_scheduled_calls_status_change AFTER
UPDATE ON scheduled_calls FOR EACH ROW BEGIN IF OLD.status != NEW.status THEN
INSERT INTO
    call_logs (
        scheduled_call_id,
        event_type,
        event_timestamp,
        api_response
    )
VALUES
    (
        NEW.id,
        NEW.status,
        NOW(),
        JSON_OBJECT(
            'old_status',
            OLD.status,
            'new_status',
            NEW.status
        )
    );

END IF;

END / / DELIMITER;

-- ====================================================================
-- 9. DATOS DE EJEMPLO (OPCIONAL)
-- ====================================================================
-- Ejemplos de llamadas programadas (descomenta para usar)
/*
INSERT INTO scheduled_calls (
first_call_type, first_call_id, second_call_type, second_call_id,
number_default, label, scheduled_at, priority
) VALUES 
('ext', '1001', 'phone', '+1234567890', '5551234', 'Llamada de prueba 1', DATE_ADD(NOW(), INTERVAL 5 MINUTE), 3),
('phone', '+0987654321', 'ext', '1002', '5551234', 'Llamada de prueba 2', DATE_ADD(NOW(), INTERVAL 10 MINUTE), 2),
('ext', '1003', 'queue', 'support', '5551234', 'Llamada a cola de soporte', DATE_ADD(NOW(), INTERVAL 15 MINUTE), 4);
*/
-- ====================================================================
-- 10. COMANDOS ÚTILES PARA ADMINISTRACIÓN
-- ====================================================================
-- Ver estadísticas de hoy
-- SELECT * FROM v_call_statistics WHERE date = CURDATE();
-- Ver llamadas pendientes
-- CALL GetPendingCalls(10);
-- Ver logs de cron jobs de las últimas 24 horas
-- SELECT * FROM cron_job_logs WHERE start_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR) ORDER BY start_time DESC;
-- Ver llamadas fallidas con más de 2 reintentos
-- SELECT * FROM scheduled_calls WHERE status = 'failed' AND retry_count >= 2 ORDER BY updated_at DESC;
-- Limpiar llamadas completadas de más de 30 días
-- DELETE FROM scheduled_calls WHERE status = 'completed' AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
-- ====================================================================
-- FIN DEL SCHEMA
-- ====================================================================
-- Mostrar resumen de tablas creadas
SELECT
    TABLE_NAME as 'Tabla Creada',
    TABLE_COMMENT as 'Descripción'
FROM
    INFORMATION_SCHEMA.TABLES
WHERE
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME IN (
        'scheduled_calls',
        'call_logs',
        'cron_job_logs',
        'cron_job_config'
    )
ORDER BY
    TABLE_NAME;