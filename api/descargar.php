<?php
// api/descargar.php?id= — Fuerza descarga SIEMPRE en PDF (convierte JPG/PNG si hace falta)
require __DIR__ . '/config.php';

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) { http_response_code(400); exit('ID inválido'); }

try {
  $stmt = db()->prepare("SELECT no_oficio, archivo_pdf FROM documentos WHERE id_documento = ?");
  $stmt->execute([$id]);
  $row = $stmt->fetch();
  if (!$row || empty($row['archivo_pdf'])) { http_response_code(404); exit('Sin archivo'); }

  $path = realpath(__DIR__ . '/../' . $row['archivo_pdf']);
  $base = realpath(UPLOAD_DIR);
  if (!$path || !$base || !str_starts_with($path, $base) || !is_file($path)) {
    http_response_code(404); exit('Archivo no encontrado');
  }

  $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
  $dl = preg_replace('/[^\w\-]/', '-', $row['no_oficio']) . '.pdf';

  if ($ext === 'pdf') {
    header('Content-Type: application/pdf');
    header("Content-Disposition: attachment; filename=\"{$dl}\"");
    header('Content-Length: ' . filesize($path));
    readfile($path);
    exit;
  }

  if (in_array($ext, ['jpg', 'jpeg', 'png'], true)) {
    $pdf = imagen_a_pdf($path, $ext);
    header('Content-Type: application/pdf');
    header("Content-Disposition: attachment; filename=\"{$dl}\"");
    header('Content-Length: ' . strlen($pdf));
    header('X-Content-Type-Options: nosniff');
    echo $pdf;
    exit;
  }

  http_response_code(415); exit('Tipo de archivo no soportado para conversión a PDF');
} catch (Throwable $ex) {
  http_response_code(500); exit('Error al generar el PDF: ' . $ex->getMessage());
}
