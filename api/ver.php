<?php
// api/ver.php?id= — Sirve el archivo inline (para <iframe> o <img>)
require __DIR__ . '/config.php';

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) { http_response_code(400); exit('ID inválido'); }

try {
  $stmt = db()->prepare("SELECT archivo_pdf FROM documentos WHERE id_documento = ?");
  $stmt->execute([$id]);
  $row = $stmt->fetch();
  if (!$row || empty($row['archivo_pdf'])) { http_response_code(404); exit('Sin archivo'); }

  $rel = $row['archivo_pdf']; // ej uploads/20261015_001-2026_ab12.pdf
  $path = realpath(__DIR__ . '/../' . $rel);
  $base = realpath(UPLOAD_DIR);
  // Anti path-traversal: el archivo debe estar dentro de uploads/
  if (!$path || !$base || !str_starts_with($path, $base) || !is_file($path)) {
    http_response_code(404); exit('Archivo no encontrado');
  }

  $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
  $ct = $ext === 'pdf' ? 'application/pdf'
      : ($ext === 'png' ? 'image/png' : 'image/jpeg');
  header("Content-Type: {$ct}");
  header('Content-Length: ' . filesize($path));
  header('X-Content-Type-Options: nosniff');
  readfile($path);
} catch (Throwable $ex) {
  http_response_code(500); exit('Error');
}
