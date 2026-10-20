# CONTEXT.md — Sistema de Gestión de Documentos (UNACH ETDA)

## Glosario canónico

- **Documento**: oficio, circular, solicitud, invitación o comunicado recibido en la oficina. Unidad central del sistema.
- **No. de Oficio / Folio** (`no_oficio`): identificador administrativo del documento, ej `001/2026`. Único, obligatorio, máx. 30 caracteres.
- **Fecha** (`fecha`): fecha de recepción del documento (DATE, no futura). Obligatoria.
- **Asunto** (`asunto`): descripción breve del contenido. Obligatorio.
- **Remitente**: persona, dependencia o institución que envía. Obligatorio.
- **Destinatario**: persona, área o dependencia que recibe. Obligatorio.
- **Estatus**: estado del trámite. Solo uno de: `Recibido` → `En proceso` → `Atendido`. Valor inicial `Recibido`.
- **Archivo digitalizado** (`archivo_pdf`): ruta relativa en `uploads/`, ej `uploads/20261015_001-2026_ab12.pdf`. PDF, JPG o PNG, máx. 10 MB. Obligatorio al registrar.
- **Digitalizar**: tomar foto desde el móvil o seleccionar archivo y asociarlo al documento.
- **Listado**: tabla filtrable por texto (folio/asunto/remitente/destinatario) + estatus + rango de fechas.
- **Detalle**: panel que muestra el documento seleccionado y permite ver/descargar/cambiar estatus/eliminar.

## Reglas de dominio

1. Un Documento siempre tiene folio único; duplicados se rechazan (409).
2. Estatus solo avanza entre los 3 valores permitidos; cualquier otro se rechaza.
3. Sin archivo no hay registro (la evidencia digital es obligatoria).
4. Eliminar un Documento borra también su archivo físico.
5. Módulos Reportes / Usuarios / Configuración están fuera de alcance en esta versión.
