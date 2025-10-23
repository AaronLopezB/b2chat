-- Tabla para almacenar el historial de eventos de la aplicación
CREATE TABLE `events_history` (
  `id` int(11) NOT NULL,
  `user_id` char(36) NOT NULL,
  `action` varchar(255) NOT NULL,
  `route` varchar(255) NOT NULL,
  `method` varchar(10) NOT NULL,
  `ip` varchar(100) DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
)

-- Índices opcionales

CREATE INDEX IF NOT EXISTS idx_events_user ON events_history(user_id);
CREATE INDEX IF NOT EXISTS idx_events_action ON events_history(action);
