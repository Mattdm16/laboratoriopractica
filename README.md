# UNACH · ETDA — Sistema de Gestión de Documentos

**Alumno:** Jose Matias Dominguez Rodas — 7mo A
**Profesor:** Mtro. Christian Mauricio Castillo Estrada
**Stack:** HTML5 + CSS3 + jQuery 3.7 + PHP 8 + MySQL 8 — Mobile First

Flujo demostrable: recibir → digitalizar → registrar → buscar → actualizar estatus → consultar PDF.

## Estructura

```
laboratorio2/
├── index.html          # Inicio + Documentos + Detalle + modales
├── styles.css
├── app.js              # jQuery + AJAX al API
├── api/
│   ├── config.php      # ← EDITA AQUÍ credenciales InfinityFree
│   ├── listar.php      # GET q, estatus, desde, hasta
│   ├── registrar.php   # POST multipart
│   ├── ver.php?id=     # inline (iframe/img)
│   ├── descargar.php?id= # attachment
│   ├── estatus.php     # POST JSON {id, estatus}
│   └── eliminar.php    # POST JSON {id}
├── sql/db.sql
├── uploads/            # PDF/JPG/PNG (10 MB máx)
├── CONTEXT.md
└── docs/adr/ + docs/REPORTE-TECNICO.md
```

## 1) Correr en local (XAMPP, 5 min)

1. Instala XAMPP, inicia Apache + MySQL.
2. Copia esta carpeta a `C:\xampp\htdocs\laboratorio2\`.
3. En phpMyAdmin (http://localhost/phpmyadmin) → Importar → `sql/db.sql`.
4. Si tu MySQL tiene contraseña, edita `api/config.php` (`DB_USER/DB_PASS`) o define env.
5. Abre http://localhost/laboratorio2/ → registra tu primer documento con PDF.
6. Pruebas: busca por folio, filtra por Estatus, cambia estatus, ver/descargar, eliminar.

> Sin PHP instalado en esta PC el código no se puede ejecutar aquí, pero está listo para XAMPP/InfinityFree (ambos con PHP 8 + PDO).

## 2) Subir a GitHub (evidencia)

```bash
cd laboratorio2
git init; git add .; git commit -m "Sistema gestión documentos UNACH"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/gestion-docs-unach.git
git push -u origin main
```

## 3) URL pública en InfinityFree (15 min)

1. Crea cuenta en infinityfree.com → Create Account → Subdomain (ej `gestion-docs.unaux.com`).
2. Panel → MySQL Databases → Create DB → anota host (ej `sqlXXX.infinityfree.com`), db, user, pass.
3. En esa DB → phpMyAdmin → Import → `sql/db.sql`.
4. File Manager (htdocs/) → sube todo el contenido de `laboratorio2/` (incluye `api/`, `uploads/` con permisos 755).
5. Edita en el servidor `api/config.php`: `DB_HOST/DB_NAME/DB_USER/DB_PASS` con los datos del paso 2.
   O en `.htaccess` raíz: `SetEnv DB_HOST ...` (el código lee `getenv` primero).
6. Visita `https://TU-SUBDOMINIO.infinityfree.com/` → prueba el flujo completo.
7. Si falla: revisa PHP 8.2 en panel, `uploads/` escribible, y que `ver.php?id=1` responda.

## Validaciones servidor

Todos los campos obligatorios, folio UNIQUE (409 si duplica), fecha `YYYY-MM-DD` no futura, estatus en lista, archivo obligatorio con `finfo` MIME real + extensión + 10 MB, nombre `fecha_folio_hash.ext`, anti path-traversal con `realpath` en ver/descargar/eliminar, PDO preparado en todas las consultas.

## Capturas para evidencia

1. Inicio con conteos, 2. Listado con filtros, 3. Modal registro + foto, 4. Visor PDF embebido, 5. Cambio de estatus, 6. phpMyAdmin con tabla `documentos`.
