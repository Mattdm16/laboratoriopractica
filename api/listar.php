<?php
// api/listar.php — GET q, estatus, desde, hasta
// Responde { ok, data:[...], counts:{recibido, proceso, atendido, total} }
require __DIR__ . '/config.php';

try {
  $pdo = db();
  $q = trim($_GET['q'] ?? '');
  $estatus = trim($_GET['estatus'] ?? '');
  $desde = trim($_GET['desde'] ?? '');
  $hasta = trim($_GET['hasta'] ?? '');

  $where = [];
  $params = [];

  if ($q !== '') {
    $where[] = "(no_oficio LIKE :q OR asunto LIKE :q OR remitente LIKE :q OR destinatario LIKE :q)";
    $params[':q'] = "%{$q}%";
  }
  if ($estatus !== '' && in_array($estatus, ESTATUS_VALIDOS, true)) {
    $where[] = "estatus = :est";
    $params[':est'] = $estatus;
  }
  if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $desde)) {
    $where[] = "fecha >= :desde";
    $params[':desde'] = $desde;
  }
  if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $hasta)) {
    $where[] = "fecha <= :hasta";
    $params[':hasta'] = $hasta;
  }

  $sql = "SELECT id_documento AS id, no_oficio AS folio, fecha,
                 asunto, remitente, destinatario, estatus, archivo_pdf AS archivo
          FROM documentos";
  if ($where) $sql .= " WHERE " . implode(' AND ', $where);
  $sql .= " ORDER BY fecha DESC, id_documento DESC";

  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);
  $rows = $stmt->fetchAll();

  // Conteos globales (para hero Inicio)
  $counts = ['recibido' => 0, 'proceso' => 0, 'atendido' => 0, 'total' => 0];
  foreach ($pdo->query("SELECT estatus, COUNT(*) c FROM documentos GROUP BY estatus") as $r) {
    if ($r['estatus'] === 'Recibido') $counts['recibido'] = (int)$r['c'];
    if ($r['estatus'] === 'En proceso') $counts['proceso'] = (int)$r['c'];
    if ($r['estatus'] === 'Atendido') $counts['atendido'] = (int)$r['c'];
  }
  $counts['total'] = $counts['recibido'] + $counts['proceso'] + $counts['atendido'];

  json(['ok' => true, 'data' => $rows, 'counts' => $counts]);
} catch (Throwable $ex) {
  json_error('Error al listar: ' . $ex->getMessage(), 500);
}
