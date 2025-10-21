CREATE TABLE `users` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `nombre_user` varchar(100) NOT NULL,
  `email_user` varchar(100) NOT NULL,
  `api_key` varchar(255) DEFAULT NULL,
  `b2_token` varchar(100) NULL,
  `activo` enum('Activo','Inactivo','Cancelado')  DEFAULT 'Activo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE `users` ADD UNIQUE INDEX `idx_email_user` (`email_user`);
ALTER TABLE `users` ADD UNIQUE INDEX `idx_api_key` (`api_key`);
