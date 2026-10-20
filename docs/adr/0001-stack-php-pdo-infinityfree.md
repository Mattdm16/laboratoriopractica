# ADR 0001 — PHP puro con PDO + jQuery AJAX, deploy XAMPP local + InfinityFree público

Fecha: 2026-10-15
Autor: Jose Matias Dominguez Rodas (7mo A)

## Contexto
Laboratorio UNACH ETDA exige HTML5 + CSS3 + jQuery + PHP + MySQL, mobile-first, entrega 16-oct-2026. Base existente: front jQuery con mock en memoria. Sin login. Necesidad de URL pública + repo GitHub.

## Decisión
- Backend en **PHP puro con PDO y sentencias preparadas** (sin framework), 6 endpoints JSON + 2 de streaming (`ver`, `descargar`).
- Frontend conserva la vista actual y sustituye el array mock por `$.ajax` al API.
- Archivos en filesystem `uploads/` con nombre `fecha_folio_hash.ext` + `.htaccess` que bloquea ejecución.
- DB `gestion_docs.tabla documentos` con UNIQUE en `no_oficio`, índices en fecha/estatus y FULLTEXT en asunto/remitente/destinatario.
- Deploy dual: **XAMPP local** para desarrollo/presentación + **InfinityFree** para URL pública (mismo código, `api/config.php` con override por `getenv`). GitHub solo como repositorio.

## Alternativas consideradas
- Laravel / Slim: descartados, exceso de setup para 1 día y el PDF pide PHP simple.
- GitHub Pages como hosting: descartado, no ejecuta PHP/MySQL.
- Guardar PDF como BLOB en MySQL: descartado, infla la DB y complica backups; filesystem es lo pedido en el PDF.
- Railway/Render: descartados, piden tarjeta y free-tier efímero.

## Consecuencias
- Pros: cumple stack exigido, rápido de instalar, validación servidor + prepared statements, subida foto desde móvil con `capture=environment`.
- Contras: sin auth (asumido fuera de alcance), uploads públicos (mitigado con renombrado + htaccess), límite 10 MB impuesto por hosting gratuito.
