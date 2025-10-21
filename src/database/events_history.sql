-- Tabla para almacenar el historial de eventos de la aplicación
CREATE TABLE IF NOT EXISTS events_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(255) NOT NULL,
    route VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    ip VARCHAR(100) NULL,
    payload JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices opcionales
CREATE INDEX IF NOT EXISTS idx_events_user ON events_history(user_id);
CREATE INDEX IF NOT EXISTS idx_events_action ON events_history(action);
