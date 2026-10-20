<?php
// api/config.php — Conexión central PDO + helpers
// Local XAMPP: host=localhost db=gestion_docs user=root pass=''
// InfinityFree: edita estos 4 valores con los del panel MySQL

declare(strict_types=1);

const DB_HOST = 'sql305.infinityfree.com';
const DB_NAME = 'if0_43197450_gestion_docs';
const DB_USER = 'if0_43197450';
const DB_PASS = 'iBW6fYDWoH';
const DB_CHARSET = 'utf8mb4';

// Carpeta de archivos (relativa a api/)
const UPLOAD_DIR = __DIR__ . '/../uploads/';
const UPLOAD_URL = 'uploads/';
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXT = ['pdf', 'jpg', 'jpeg', 'png'];
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];

const ESTATUS_VALIDOS = ['Recibido', 'En proceso', 'Atendido'];

function db(): PDO {
  static $pdo = null;
  if ($pdo instanceof PDO) return $pdo;
  // Permite override por variables de entorno (InfinityFree / Railway)
  $host = getenv('DB_HOST') ?: DB_HOST;
  $name = getenv('DB_NAME') ?: DB_NAME;
  $user = getenv('DB_USER') ?: DB_USER;
  $pass = getenv('DB_PASS') ?: DB_PASS;
  $dsn = "mysql:host={$host};dbname={$name};charset=" . DB_CHARSET;
  $pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  return $pdo;
}

function json($data, int $code = 200): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function json_error(string $msg, int $code = 400): void {
  json(['ok' => false, 'error' => $msg], $code);
}

function e(string $s): string {
  return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

/**
 * Construye un PDF (1 página) que embebe un JPEG binario.
 * Usa DCTDecode: no re-codifica, copia los bytes JPEG tal cual.
 */
function pdf_desde_jpeg_binario(string $jpeg, int $w, int $h): string {
  $content = sprintf("q %d 0 0 %d 0 0 cm /Im0 Do Q", $w, $h);
  $objs = [];
  $objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  $objs[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
  $objs[3] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {$w} {$h}] "
           . "/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>";
  $objs[4] = "<< /Type /XObject /Subtype /Image /Width {$w} /Height {$h} "
           . "/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length "
           . strlen($jpeg) . " >>\nstream\n" . $jpeg . "\nendstream";
  $objs[5] = "<< /Length " . strlen($content) . " >>\nstream\n" . $content . "\nendstream";

  $pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  $offsets = [];
  foreach ($objs as $n => $body) {
    $offsets[$n] = strlen($pdf);
    $pdf .= "{$n} 0 obj\n{$body}\nendobj\n";
  }
  $startxref = strlen($pdf);
  $pdf .= "xref\n0 6\n0000000000 65535 f \n";
  for ($i = 1; $i <= 5; $i++) {
    $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
  }
  $pdf .= "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{$startxref}\n%%EOF";
  return $pdf;
}

/**
 * Lee JPG/PNG desde disco y devuelve un PDF listo para descargar.
 * - JPG/JPEG: se embebe sin re-codificar (calidad original).
 * - PNG: se aplana sobre fondo blanco y se convierte a JPEG 92 con GD.
 */
function imagen_a_pdf(string $path, string $ext): string {
  $info = @getimagesize($path);
  if (!$info) throw new RuntimeException('Imagen ilegible');
  [$w, $h] = [$info[0], $info[1]];

  if ($ext === 'jpg' || $ext === 'jpeg') {
    return pdf_desde_jpeg_binario(file_get_contents($path), $w, $h);
  }

  // PNG u otro: convertir vía GD a JPEG y embeber
  if (!function_exists('imagecreatefromstring')) {
    throw new RuntimeException('Extensión GD no disponible en el servidor');
  }
  $src = @imagecreatefromstring(file_get_contents($path));
  if (!$src) throw new RuntimeException('No se pudo leer el PNG');

  // Aplanar transparencia sobre blanco
  $canvas = imagecreatetruecolor($w, $h);
  $white = imagecolorallocate($canvas, 255, 255, 255);
  imagefill($canvas, 0, 0, $white);
  imagecopy($canvas, $src, 0, 0, 0, 0, $w, $h);
  imagedestroy($src);

  ob_start();
  imagejpeg($canvas, null, 92);
  $jpeg = ob_get_clean();
  imagedestroy($canvas);

  return pdf_desde_jpeg_binario($jpeg, $w, $h);
}
