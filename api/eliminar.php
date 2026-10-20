<?php
// api/eliminar.php — POST JSON { id } : borra fila + archivo físico
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Método no permitido', 405);
$in = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$id = (int)($in['id'] ?? 0);
if ($id <= 0) json_error('ID inválido.');

try {
  $pdo = db();
  $stmt = $pdo->prepare("SELECT archivo_pdf FROM documentos WHERE id_documento = ?");
  $stmt->execute([$id]);
  $row = $stmt->fetch();
  if (!$row) json_error('Documento no encontrado.', 404);

  $pdo->prepare("DELETE FROM documentos WHERE id_documento = ?")->execute([$id]);

  if (!empty($row['archivo_pdf'])) {
    $path = realpath(__DIR__ . '/../' . $row['archivo_pdf']);
    $base = realpath(UPLOAD_DIR);
    if ($path && $base && str_starts_with($path, $base) && is_file($path)) @unlink($path);
  }
  json(['ok' => true]);
} catch (Throwable $ex) {
  json_error('Error: ' . $ex->getMessage(), 500);
}
