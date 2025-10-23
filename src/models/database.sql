CREATE TABLE `users` (
  `id` CHAR(36) NOT NULL DEFAULT uuid () COLLATE 'utf8mb4_general_ci',
  `api_key` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
  `b2_token` VARCHAR(100) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
  `voice_token` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
  `user_crm_id` INT(11) NOT NULL,
  `activo` ENUM ('Activo', 'Inactivo', 'Cancelado') NULL DEFAULT 'Activo' COLLATE 'utf8mb4_general_ci',
  `created_at` TIMESTAMP NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_api_key` (`api_key`) USING BTREE,
  INDEX `api_key` (`api_key`) USING BTREE,
  INDEX `id` (`id`) USING BTREE
);

CREATE TABLE `events_history` (
  `id` CHAR(36) NOT NULL DEFAULT uuid () COLLATE 'utf8mb4_general_ci',
  `user_id` CHAR(36) NOT NULL COLLATE 'utf8mb4_general_ci',
  `action` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_general_ci',
  `route` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_general_ci',
  `method` VARCHAR(10) NOT NULL COLLATE 'utf8mb4_general_ci',
  `ip` VARCHAR(100) NULL DEFAULT NULL COLLATE 'utf8mb4_general_ci',
  `payload` LONGTEXT NULL DEFAULT NULL COLLATE 'utf8mb4_bin',
  `created_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id` (`user_id`) USING BTREE,
  INDEX `idx_events_action` (`action`) USING BTREE,
  CONSTRAINT `events_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT `payload` CHECK (json_valid (`payload`))
) COLLATE = 'utf8mb4_general_ci' ENGINE = InnoDB;