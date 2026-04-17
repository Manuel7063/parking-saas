<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); exit;
}

require_once '../config.php';
$db = getDB();

$method = $_SERVER['REQUEST_METHOD'];

// Para mantener el esquema SaaS, verificamos qué empresa_id consultan las API
$empresa_id = isset($_GET['empresa_id']) ? $_GET['empresa_id'] : (isset($_POST['empresa_id']) ? $_POST['empresa_id'] : 1);

if ($method === 'GET') {
    $stmt = $db->prepare("SELECT id, rut, nombre, perfil, activo, fecha_creacion FROM usuarios WHERE empresa_id = :empresa_id ORDER BY id DESC");
    $stmt->execute([':empresa_id' => $empresa_id]);
    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["success" => true, "data" => $usuarios]);
} 
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $empresa_id = isset($data->empresa_id) ? $data->empresa_id : $empresa_id;

    if (empty($data->rut) || empty($data->nombre) || empty($data->perfil)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Faltan datos obligatorios."]);
        exit;
    }

    // Verificar si el RUT ya existe globalmente
    $stmtCheck = $db->prepare("SELECT id FROM usuarios WHERE rut = :rut LIMIT 1");
    $stmtCheck->execute([':rut' => $data->rut]);
    if ($stmtCheck->fetch()) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "El RUT ya está registrado."]);
        exit;
    }

    $clave = !empty($data->password) ? $data->password : '123456';
    $hash = password_hash($clave, PASSWORD_DEFAULT);

    $stmt = $db->prepare("INSERT INTO usuarios (rut, nombre, clave_hash, perfil, empresa_id, activo) VALUES (:rut, :nombre, :hash, :perfil, :empresa_id, 1)");
    $result = $stmt->execute([
        ':rut' => $data->rut,
        ':nombre' => $data->nombre,
        ':hash' => $hash,
        ':perfil' => $data->perfil,
        ':empresa_id' => $empresa_id
    ]);

    if ($result) {
        echo json_encode(["success" => true, "message" => "Usuario creado existosamente."]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error al guardar el usuario en MySQL."]);
    }
}
elseif ($method === 'DELETE') {
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Falta ID."]);
        exit;
    }
    // Borrado lógico (desactivar)
    $stmt = $db->prepare("UPDATE usuarios SET activo = 0 WHERE id = :id AND empresa_id = :empresa_id");
    if($stmt->execute([':id' => $_GET['id'], ':empresa_id' => $empresa_id])) {
        echo json_encode(["success" => true, "message" => "Usuario desactivado."]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error al desactivar usuario."]);
    }
}
?>
