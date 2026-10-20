-- Sistema de Gestión de Documentos — UNACH ETDA
-- USO ENFINITYFREE (importar en phpMyAdmin de InfinityFree, ya con la DB creada en el panel)
-- NO incluye CREATE DATABASE porque InfinityFree no lo permite.

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
