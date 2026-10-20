# Reporte Técnico — Sistema de Gestión de Documentos de Oficina
**UNACH · ETDA Campus IV Tapachula — Desarrollo de aplicaciones web y móviles**
Alumno: Jose Matias Dominguez Rodas (7mo A) · Profesor: Mtro. Christian Mauricio Castillo Estrada · Entrega: 16-oct-2026

---

## 1. Problema y solución

La oficina de la ETDA gestionaba sus oficios, circulares y solicitudes en papel: los documentos se traspapelaban, se archivaban mal y localizar uno por folio, asunto, remitente o fecha tomaba demasiado tiempo. Además, no existía evidencia digital ni un control claro del estado del trámite de cada oficio.

Se construyó una **plataforma web responsiva** (funciona igual en celular, tablet y computadora) que permite: **recibir** el documento, **digitalizarlo** (tomando foto con la cámara o subiendo un PDF), **registrarlo** con sus datos administrativos (No. de oficio, fecha, asunto, remitente, destinatario, estatus), **consultarlo** en un listado completo con búsqueda y filtros, **actualizar su estatus** de trámite y **ver/descargar** el archivo digital. El flujo mínimo exigido queda garantizado de punta a punta: *recibir → digitalizar → registrar → buscar → actualizar estatus → consultar PDF*.

---

## 2. Arquitectura

**Frontend** (`index.html`, `styles.css`, `app.js`): HTML5 + CSS3 + jQuery 3.7, enfoque *mobile-first*. La interfaz se compone de un *shell* adaptable:
- **Móvil (<700px):** barra superior, navegación inferior tipo app (bottom-nav) con botón flotante de alta, y documentos en formato tarjeta.
- **Tablet (≥700px):** tabla de documentos.
- **Escritorio (≥960px):** dos columnas (menú lateral fijo + contenido), sin barra superior ni inferior.

Vistas: **Inicio** (hero con conteos en vivo y accesos recientes) y **Documentos** (listado con búsqueda y filtros). La captura/alta se hace en un **asistente de 3 pasos** (Datos → Archivo → Verificación) a pantalla completa. Las peticiones al servidor se hacen con `$.ajax`/`$.getJSON`.

**Backend** (PHP 8 puro, `api/`): 6 endpoints + configuración central:
| Endpoint | Método | Función |
|---|---|---|
| `listar.php` | GET | Lista con filtros (texto, estatus, rango de fechas) y devuelve conteos |
| `registrar.php` | POST multipart | Valida, sube el archivo e inserta el documento |
| `ver.php?id=` | GET | Sirve el archivo *inline* (PDF en `<iframe>`, foto en `<img>`) |
| `descargar.php?id=` | GET | Fuerza descarga (`Content-Disposition: attachment`) |
| `estatus.php` | POST JSON | Actualiza el estatus (`Recibido`/`En proceso`/`Atendido`) |
| `eliminar.php` | POST JSON | Borra el registro **y** su archivo físico |

`config.php` centraliza la conexión **PDO** y las constantes del dominio (límite 10 MB, MIME permitidos, estatus válidos). Las credenciales pueden sobrescribirse por variables de entorno (`getenv`), lo que permite el mismo código en local y en el hosting.

**Base de datos** (`sql/db.sql`): MySQL/MariaDB, base `gestion_docs`, tabla `documentos`:
`id_documento` INT PK autoincremental · `no_oficio` VARCHAR(30) UNIQUE · `fecha` DATE · `asunto` VARCHAR(255) · `remitente` y `destinatario` VARCHAR(150) · `estatus` ENUM('Recibido','En proceso','Atendido') DEFAULT 'Recibido' · `archivo_pdf` VARCHAR(255) · `creado_en` TIMESTAMP. Índices en folio, fecha y estatus, más índice FULLTEXT para búsqueda.

**Archivos:** se guardan en `uploads/` con nombre seguro `AAAAMMDD_folio_hash.ext` (evita colisiones y caracteres peligrosos). Un `.htaccess` **bloquea la ejecución de scripts** dentro de la carpeta.

**Seguridad:** validación doble (cliente + servidor), detección de tipo MIME real con `finfo`, límite de tamaño, sentencias preparadas en todas las consultas (anti SQL-Injection), `realpath` para evitar *path traversal* en ver/descargar/eliminar, y `htmlspecialchars`/escape en el render (anti XSS).

**Despliegue dual:** XAMPP en local para desarrollo/demostración, e **InfinityFree** (PHP + MySQL gratuito) para la URL pública; GitHub como repositorio de código. Ver `docs/adr/0001`.

---

## 3. Funcionalidades

- **Registrar (asistente 3 pasos):** paso 1 datos con validación en línea (obligatorios, máximo de caracteres, fecha no futura); paso 2 archivo con **vista previa** (miniatura para fotos, ficha con nombre/tamaño para PDF) y botones *Tomar foto* (abre la cámara del móvil vía `capture=environment`) y *Seleccionar PDF*; paso 3 **verificación** donde el sistema confirma contra el servidor que el registro y el archivo quedaron guardados y muestra el mensaje de éxito con un resumen.
- **Listado:** muestra **todos** los documentos por defecto, con búsqueda por folio/asunto/remitente/destinatario (con *debounce* de 350 ms) y filtros por estatus y rango de fechas.
- **Estatus:** cambio por fila mediante selector; los conteos del Inicio se actualizan desde el servidor.
- **Ver / Descargar:** visor embebido (sin salir de la plataforma) y descarga con nombre basado en el folio.
- **Eliminar:** con confirmación; borra la fila y el archivo físico.
- **Regla de dominio:** folio único (duplicados → **409**), sin archivo no hay registro.

**Casos borde cubiertos:** sin resultados muestra mensaje; sin archivo indica "Sin archivo"; fecha futura y archivo >10 MB o de tipo no permitido se rechazan con mensaje claro.

---

## 4. Pruebas

| # | Caso | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 1 | Registrar `001/2026` + PDF 1.2 MB | 201 y aparece en el listado | OK |
| 2 | Intentar duplicar el folio | 409 "ya registrado" | OK |
| 3 | Buscar "materiales" / filtrar Recibido / rango oct-2026 | Solo coincidencias | OK |
| 4 | Cambiar estatus a "Atendido" | Badge y conteos actualizados | OK |
| 5 | Ver PDF en el visor / descargar | Inline / descarga | OK |
| 6 | Subir `.exe` o archivo de 25 MB | Rechazo con mensaje (400) | OK |
| 7 | Eliminar un documento | Borra fila + archivo físico | OK |
| 8 | Registrar desde el celular (foto) | Sube la foto y verifica | OK |
| 9 | Móvil 360px / tablet 768px / desktop 1280px | Sin scroll horizontal | OK |

**Evidencias sugeridas:** capturas de Inicio, listado con filtros, los 3 pasos del asistente (incluida la pantalla de éxito), visor del PDF, phpMyAdmin con la tabla, y un video corto del flujo completo.

---

## 5. Conclusiones

Se cumple el 100% de los requerimientos funcionales y técnicos con el stack exigido (HTML5, CSS3, jQuery, PHP, MySQL) y buenas prácticas de desarrollo seguro (prepared statements, validación doble, control de tipo/tamaño de archivos, credenciales fuera del código). La interfaz es completamente responsiva y mobile-first, e incluye digitalización desde cámara y verificación de la subida.

**Limitaciones:** no incluye autenticación/roles ni módulo de reportes (fuera del alcance acordado); en el hosting gratuito la carpeta `uploads/` es accesible públicamente (mitigado con renombrado y bloqueo de ejecución).

**Trabajo futuro:** inicio de sesión con roles, paginación del lado del servidor, conversión de foto a PDF con OCR, bitácora de cambios de estatus y respaldo automático de la base de datos.

**Instalación rápida:** local → XAMPP, importar `sql/db.sql`, abrir `http://localhost/laboratorio2/`; público → InfinityFree, importar el SQL, subir los archivos y editar `api/config.php`.
