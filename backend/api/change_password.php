<?php
// backend/api/change_password.php
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

if (empty($data->rut) || empty($data->clave_actual) || empty($data->clave_nueva)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Faltan campos obligatorios."]);
    exit;
}

if (strlen($data->clave_nueva) < 8) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "La nueva clave debe tener al menos 8 caracteres."]);
    exit;
}

// Verificar contraseña actual
$stmt = $db->prepare("SELECT id, clave_hash FROM usuarios WHERE rut = :rut AND activo = 1 LIMIT 1");
$stmt->execute([':rut' => $data->rut]);
$usuario = $stmt->fetch();

if (!$usuario) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Usuario no encontrado."]);
    exit;
}

if (!password_verify($data->clave_actual, $usuario['clave_hash'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "La contraseña actual es incorrecta."]);
    exit;
}

// Generar nuevo hash seguro
$nuevo_hash = password_hash($data->clave_nueva, PASSWORD_BCRYPT);

$stmt2 = $db->prepare("UPDATE usuarios SET clave_hash = :hash WHERE id = :id");
$stmt2->execute([':hash' => $nuevo_hash, ':id' => $usuario['id']]);

echo json_encode(["success" => true, "message" => "Contraseña actualizada exitosamente."]);
?>
