<?php
// api/estatus.php — POST JSON { id, estatus }
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Método no permitido', 405);
$in = json_decode(file_get_contents('php://input'), true) ?: $_POST;

$id = (int)($in['id'] ?? 0);
$est = trim($in['estatus'] ?? '');
if ($id <= 0) json_error('ID inválido.');
if (!in_array($est, ESTATUS_VALIDOS, true)) json_error('Estatus inválido.');

try {
  $stmt = db()->prepare("UPDATE documentos SET estatus = ? WHERE id_documento = ?");
  $stmt->execute([$est, $id]);
  if ($stmt->rowCount() === 0) json_error('Documento no encontrado.', 404);
  json(['ok' => true, 'id' => $id, 'estatus' => $est]);
} catch (Throwable $ex) {
  json_error('Error: ' . $ex->getMessage(), 500);
}
