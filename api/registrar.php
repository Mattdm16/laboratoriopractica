<?php
// api/registrar.php — POST multipart: no_oficio, fecha, asunto, remitente, destinatario, estatus, archivo
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Método no permitido', 405);

try {
  $folio = trim($_POST['no_oficio'] ?? '');
  $fecha = trim($_POST['fecha'] ?? '');
  $asunto = trim($_POST['asunto'] ?? '');
  $remitente = trim($_POST['remitente'] ?? '');
  $destinatario = trim($_POST['destinatario'] ?? '');
  $estatus = trim($_POST['estatus'] ?? 'Recibido');

  // Validaciones servidor
  if ($folio === '' || $fecha === '' || $asunto === '' || $remitente === '' || $destinatario === '') {
    json_error('Todos los campos son obligatorios.');
  }
  if (mb_strlen($folio) > 30) json_error('No. de oficio máximo 30 caracteres.');
  if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) json_error('Fecha inválida (YYYY-MM-DD).');
  if ($fecha > date('Y-m-d')) json_error('La fecha no puede ser futura.');
  if (!in_array($estatus, ESTATUS_VALIDOS, true)) json_error('Estatus inválido.');
  if (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
    json_error('Debes adjuntar el PDF o foto del documento.');
  }

  $f = $_FILES['archivo'];
  if ($f['size'] > MAX_FILE_BYTES) json_error('Archivo excede 10 MB.');
  $finfo = new finfo(FILEINFO_MIME_TYPE);
  $mime = $finfo->file($f['tmp_name']);
  $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
  if (!in_array($ext, ALLOWED_EXT, true) || !in_array($mime, ALLOWED_MIME, true)) {
    json_error("Tipo no permitido ({$mime}). Solo PDF, JPG, PNG.");
  }

  $pdo = db();

  // Folio único
  $chk = $pdo->prepare("SELECT COUNT(*) FROM documentos WHERE no_oficio = ?");
  $chk->execute([$folio]);
  if ((int)$chk->fetchColumn() > 0) json_error("El folio {$folio} ya está registrado.", 409);

  // Guardar archivo con nombre seguro: 20261015_001-2026_a1b2c3.pdf
  if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);
  $base = preg_replace('/[^A-Za-z0-9\-_\/]/', '-', $folio);
  $safe = date('Ymd') . '_' . str_replace('/', '-', $base) . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
  $dest = UPLOAD_DIR . $safe;
  if (!move_uploaded_file($f['tmp_name'], $dest)) json_error('No se pudo guardar el archivo.', 500);

  $stmt = $pdo->prepare("INSERT INTO documentos
    (no_oficio, fecha, asunto, remitente, destinatario, estatus, archivo_pdf)
    VALUES (?,?,?,?,?,?,?)");
  $stmt->execute([$folio, $fecha, $asunto, $remitente, $destinatario, $estatus, UPLOAD_URL . $safe]);

  json(['ok' => true, 'id' => (int)$pdo->lastInsertId(), 'archivo' => UPLOAD_URL . $safe], 201);
} catch (PDOException $ex) {
  if (str_contains($ex->getMessage(), 'Duplicate')) json_error('Folio duplicado.', 409);
  json_error('Error BD: ' . $ex->getMessage(), 500);
} catch (Throwable $ex) {
  json_error('Error al registrar: ' . $ex->getMessage(), 500);
}
