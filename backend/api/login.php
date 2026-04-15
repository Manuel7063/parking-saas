<?php
// backend/api/login.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido."]);
    exit;
}

require_once '../config.php';
$db = getDB();

$data = json_decode(file_get_contents("php://input"));

if (empty($data->rut) || empty($data->password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "RUT y contraseña son obligatorios."]);
    exit;
}

// Buscar usuario por RUT en la BD
$stmt = $db->prepare("SELECT id, nombre, perfil, empresa_id FROM usuarios WHERE rut = :rut AND activo = 1 LIMIT 1");
$stmt->execute([':rut' => $data->rut]);
$usuario = $stmt->fetch();

if (!$usuario) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Usuario no encontrado o inactivo."]);
    exit;
}

// Verificar contraseña con password_hash de PHP
$stmt2 = $db->prepare("SELECT clave_hash FROM usuarios WHERE rut = :rut LIMIT 1");
$stmt2->execute([':rut' => $data->rut]);
$row = $stmt2->fetch();

if (!password_verify($data->password, $row['clave_hash'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Contraseña incorrecta."]);
    exit;
}

// Login exitoso - devolver perfil para que React redirija
echo json_encode([
    "success"    => true,
    "perfil"     => $usuario['perfil'],   // 'SUPERADMIN', 'ADMIN' o 'CAJERO'
    "nombre"     => $usuario['nombre'],
    "empresa_id" => $usuario['empresa_id'],
    "usuario_id" => $usuario['id']
]);
?>
