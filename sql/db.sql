-- Sistema de Gestión de Documentos — UNACH ETDA Campus IV
-- Compatible MySQL 5.7 / 8.0 y MariaDB 10.x
-- Uso local (XAMPP): importa en phpMyAdmin o: mysql -u root < sql/db.sql
-- Uso InfinityFree: crea la DB en el panel y ejecuta este script en phpMyAdmin

CREATE DATABASE IF NOT EXISTS gestion_docs
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestion_docs;

DROP TABLE IF EXISTS documentos;
CREATE TABLE documentos (
  id_documento INT UNSIGNED NOT NULL AUTO_INCREMENT,
  no_oficio   VARCHAR(30) NOT NULL,
  fecha       DATE NOT NULL,
  asunto      VARCHAR(255) NOT NULL,
  remitente   VARCHAR(150) NOT NULL,
  destinatario VARCHAR(150) NOT NULL,
  estatus     ENUM('Recibido','En proceso','Atendido') NOT NULL DEFAULT 'Recibido',
  archivo_pdf VARCHAR(255) DEFAULT NULL COMMENT 'Ruta relativa ej uploads/20261015_001-2026_ab12.pdf',
  creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_documento),
  UNIQUE KEY uq_no_oficio (no_oficio),
  KEY ix_fecha (fecha),
  KEY ix_estatus (estatus),
  FULLTEXT KEY ft_busqueda (asunto, remitente, destinatario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sin datos de ejemplo: la tabla se crea vacía.
