<?php
// backend/api/empresas.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); exit;
}

require_once '../config.php';
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    case 'GET':
        // Listar todas las empresas (solo para SUPERADMIN)
        $stmt = $db->prepare("SELECT id, nombre, rut_contacto, plan, estado FROM empresas ORDER BY id DESC");
        $stmt->execute();
        $empresas = $stmt->fetchAll();
        echo json_encode(["success" => true, "data" => $empresas]);
        break;

    case 'POST':
        // Crear nueva empresa
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->nombre) || empty($data->rut_contacto)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Nombre y RUT son obligatorios."]);
            exit;
        }

        $plan   = isset($data->plan) ? $data->plan : 'Básico';
        $stmt = $db->prepare("INSERT INTO empresas (nombre, rut_contacto, plan, estado) VALUES (:nombre, :rut, :plan, 'Activo')");
        $stmt->execute([
            ':nombre' => $data->nombre,
            ':rut'    => $data->rut_contacto,
            ':plan'   => $plan
        ]);
        $nuevo_id = $db->lastInsertId();
        http_response_code(201);
        echo json_encode(["success" => true, "id" => $nuevo_id, "message" => "Empresa registrada exitosamente."]);
        break;

    case 'PUT':
        // Actualizar estado de empresa (Activo/Suspendido)
        $data = json_decode(file_get_contents("php://input"));
        if (empty($data->id) || empty($data->estado)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Se requiere id y estado."]);
            exit;
        }
        $stmt = $db->prepare("UPDATE empresas SET estado = :estado WHERE id = :id");
        $stmt->execute([':estado' => $data->estado, ':id' => $data->id]);
        echo json_encode(["success" => true, "message" => "Estado actualizado."]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Método no soportado."]);
        break;
}
?>
