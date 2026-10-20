# Reporte Técnico — Sistema de Gestión de Documentos de Oficina
**UNACH · ETDA Campus IV Tapachula — Desarrollo de aplicaciones web y móviles**
Alumno: Jose Matias Dominguez Rodas (7mo A) · Profesor: Mtro. Christian Mauricio Castillo Estrada · Entrega: 20-oct-2026

---

## 1. Problema y solución

La oficina de la ETDA gestionaba sus oficios, circulares y solicitudes en papel: los documentos se traspapelaban, se archivaban mal y localizar uno por folio, asunto, remitente o fecha tomaba demasiado tiempo. Además, no existía evidencia digital ni un control claro del estado del trámite de cada oficio.

Se construyó una **plataforma web responsiva** (funciona igual en celular, tablet y computadora) que permite: **recibir** el documento, **digitalizarlo** (tomando foto con la cámara o subiendo un PDF), **registrarlo** con sus datos administrativos (No. de oficio, fecha, asunto, remitente, destinatario, estatus), **consultarlo** en un listado completo con búsqueda y filtros, **actualizar su estatus** de trámite y **ver/descargar** el archivo digital **siempre en formato PDF** (las fotos JPG/PNG se convierten automáticamente al descargar). El flujo mínimo exigido queda garantizado de punta a punta: *recibir → digitalizar → registrar → buscar → actualizar estatus → consultar PDF*.

---

## 2. Arquitectura

**Frontend** (`index.html`, `styles.css`, `app.js`): HTML5 + CSS3 + jQuery 3.7, enfoque *mobile-first*. La interfaz es una SPA de **2 vistas** dentro de un *shell* adaptable:

- **Móvil / tablet (<960px):** barra superior compacta con navegación horizontal (Documentos / Nuevo) y el píldora de acción; los documentos se muestran en **tarjetas** (<800px) o en **tabla con scroll horizontal** (≥800px).
- **Escritorio (≥960px):** dos columnas (menú lateral fijo con "Acciones" y "Recientes" + contenido), topbar gris con título y píldora.

Vistas: **Documentos** (listado con búsqueda full-width, filtros de estatus/fechas y conteos en vivo) y **Nuevo documento** (asistente a pantalla completa). El píldora del topbar se invierte según la vista: en Documentos dice *Nuevo*; en Nuevo dice *Documentos*. Las peticiones al servidor se hacen con `$.ajax`/`$.getJSON`.

La captura/alta se hace en un **asistente de 4 pasos**: Datos → Archivo → Verificación → Confirmación. Las peticiones se envían con `$.ajax` y se muestra un toast de resultado.

**Backend** (PHP 8 puro, `api/`): 6 endpoints + configuración central:

| Endpoint | Método | Función |
|---|---|---|
| `listar.php` | GET | Lista con filtros (texto, estatus, rango de fechas) y devuelve conteos |
| `registrar.php` | POST multipart | Valida, sube el archivo e inserta el documento |
| `ver.php?id=` | GET | Sirve el archivo *inline* (PDF en `<iframe>`, foto en `<img>`) |
| `descargar.php?id=` | GET | Fuerza descarga **siempre en PDF** (`Content-Disposition: attachment`) |
| `estatus.php` | POST JSON | Actualiza el estatus (`Recibido`/`En proceso`/`Atendido`) |
| `eliminar.php` | POST JSON | Borra el registro **y** su archivo físico |

`config.php` centraliza la conexión **PDO**, las constantes del dominio (límite 10 MB, MIME permitidos, estatus válidos) y los helpers de conversión de imagen a PDF. Las credenciales pueden sobrescribirse por variables de entorno (`getenv`), lo que permite el mismo código en local y en el hosting.

**Base de datos** (`sql/db.sql`): MySQL/MariaDB, base `gestion_docs`, tabla `documentos`:
`id_documento` INT PK autoincremental · `no_oficio` VARCHAR(30) UNIQUE · `fecha` DATE · `asunto` VARCHAR(255) · `remitente` y `destinatario` VARCHAR(150) · `estatus` ENUM('Recibido','En proceso','Atendido') DEFAULT 'Recibido' · `archivo_pdf` VARCHAR(255) · `creado_en` TIMESTAMP. Índices en folio, fecha y estatus, más índice FULLTEXT para búsqueda.

**Archivos:** se guardan en `uploads/` con nombre seguro `AAAAMMDD_folio_hash.ext` (evita colisiones y caracteres peligrosos). Un `.htaccess` **bloquea la ejecución de scripts** dentro de la carpeta.

**Descarga en PDF:** `descargar.php` sirve el PDF tal cual; si el archivo es JPG/JPEG se embebe en un PDF generado en PHP (filtro `DCTDecode`, sin re-codificar); si es PNG se aplana sobre fondo blanco y se convierte a JPEG con GD antes de embeberse. El nombre de descarga es siempre `folio.pdf`.

**Seguridad:** validación doble (cliente + servidor), detección de tipo MIME real con `finfo`, límite de tamaño, sentencias preparadas en todas las consultas (anti SQL-Injection), `realpath` para evitar *path traversal* en ver/descargar/eliminar, y `htmlspecialchars`/escape en el render (anti XSS).

**Despliegue dual:** XAMPP en local para desarrollo/demostración, e **InfinityFree** (PHP 8.2 + MySQL gratuito) para la URL pública `lab2.infinityfree.io`; GitHub (`Mattdm16/laboratoriopractica`) como repositorio de código. Ver `docs/adr/0001`.

---

## 3. Funcionalidades

- **Registrar (asistente 4 pasos):**
  1. **Datos** — validación en línea (obligatorios, máximo de caracteres, fecha no futura) y verificación de folio duplicado contra el servidor antes de avanzar.
  2. **Archivo** — obligatorio; botones *Tomar foto* (cámara del móvil vía `capture=environment`) y *Seleccionar archivo*; vista previa (miniatura para fotos, ficha con nombre/tamaño para PDF).
  3. **Verificación** — resumen editable de todos los campos; permite volver a editar o confirmar.
  4. **Confirmación** — el sistema sube el registro, verifica contra el servidor que el archivo quedó guardado y muestra el resultado con resumen y enlace para ver el documento.
- **Listado:** muestra **todos** los documentos por defecto, con búsqueda full-width por folio/asunto/remitente/destinatario (con *debounce* de 350 ms) y filtros por estatus y rango de fechas. La lista **Recientes** del sidebar se carga siempre sin filtros, independiente de la búsqueda.
- **Estatus:** cambio por fila mediante selector; los conteos se actualizan desde el servidor.
- **Ver / Descargar:** visor embebido en modal (PDF en iframe, foto en `<img>`) y descarga forzada **siempre en formato PDF** con nombre basado en el folio.
- **Eliminar:** con confirmación; borra la fila y el archivo físico.
- **Regla de dominio:** folio único (duplicados → **409**), sin archivo no hay registro.

**Casos borde cubiertos:** sin resultados muestra mensaje "Sin coincidencias"; sin archivo indica "Sin archivo"; fecha futura y archivo >10 MB o de tipo no permitido se rechazan con mensaje claro; folio duplicado se bloquea en el paso 1.

---

## 4. Pruebas

| # | Caso | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 1 | Registrar `001/2026` + PDF 1.2 MB | 201 y aparece en el listado | OK |
| 2 | Intentar duplicar el folio | Bloqueo en el paso 1 + 409 "ya registrado" | OK |
| 3 | Buscar "materiales" / filtrar Recibido / rango oct-2026 | Solo coincidencias; Recientes sin cambiar | OK |
| 4 | Cambiar estatus a "Atendido" | Badge y conteos actualizados | OK |
| 5 | Ver PDF en el visor / descargar | Inline / descarga `.pdf` | OK |
| 6 | Subir `.exe` o archivo de 25 MB | Rechazo con mensaje (400) | OK |
| 7 | Eliminar un documento | Borra fila + archivo físico | OK |
| 8 | Registrar desde el celular (foto) | Sube la foto y verifica | OK |
| 9 | Descargar foto JPG/PNG | Se descarga convertida a `.pdf` | OK |
| 10 | Móvil 360px / tablet 768px / desktop 1280px | Sin scroll horizontal; cards en móvil, tabla en desktop | OK |

**Evidencias:** capturas de escritorio (`Pruebas/1–8.png`) y de celular (`Pruebas/Celular 1–4.jpg`) en el repositorio.

---

## 5. Conclusiones

Se cumple el 100% de los requerimientos funcionales y técnicos con el stack exigido (HTML5, CSS3, jQuery, PHP, MySQL) y buenas prácticas de desarrollo seguro (prepared statements, validación doble, control de tipo/tamaño de archivos, credenciales fuera del código). La interfaz es completamente responsiva (mobile-first) e incluye digitalización desde cámara, verificación de la subida y conversión automática de imágenes a PDF al descargar.

**Limitaciones:** no incluye autenticación/roles ni módulo de reportes (fuera del alcance acordado); en el hosting gratuito la carpeta `uploads/` es accesible públicamente (mitigado con renombrado y bloqueo de ejecución).

**Trabajo futuro:** inicio de sesión con roles, paginación del lado del servidor, soporte de múltiples imágenes por documento, OCR sobre fotos, bitácora de cambios de estatus y respaldo automático de la base de datos.

**Instalación rápida:** local → XAMPP, importar `sql/db.sql`, abrir `http://localhost/laboratorio2/`; público → InfinityFree, crear la DB en el panel, importar `sql/db_infinityfree.sql`, subir los archivos y editar `api/config.php` (o `.htaccess` con `SetEnv`).
