<?php
// backend/api/tickets.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config.php';
$db = getDB();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        // Registrar Nueva Entrada
        $data = json_decode(file_get_contents("php://input"));
        
        if (!empty($data->empresa_id) && !empty($data->tipo_vehiculo_id) && !empty($data->usuario_vendedor_id)) {
            // Generar un código de barras aleatorio seguro tipo 1231224012855
            $codigo = date('ymd') . rand(1000000, 9999999);
            
            $query = "INSERT INTO tickets (codigo, empresa_id, usuario_vendedor_id, tipo_vehiculo_id, patente, fecha_entrada, estado) 
                      VALUES (:codigo, :empresa_id, :vendedor, :tipo, :patente, NOW(), 'pendiente')";
            
            $stmt = $db->prepare($query);
            
            if ($stmt->execute([
                ':codigo' => $codigo,
                ':empresa_id' => $data->empresa_id,
                ':vendedor' => $data->usuario_vendedor_id,
                ':tipo' => $data->tipo_vehiculo_id,
                ':patente' => isset($data->patente) ? $data->patente : ''
            ])) {
                http_response_code(201);
                echo json_encode([
                    "status" => "success", 
                    "message" => "Vehículo y ticket ingresados exitosamente.", 
                    "ticket_emitido" => $codigo
                ]);
            } else {
                http_response_code(503);
                echo json_encode(["status" => "error", "message" => "Database exception. No se pudo ingresar."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Faltan parámetros críticos (empresa_id, tipo_vehiculo_id)."]);
        }
        break;

    case 'GET':
        // Listar Todos los Vehículos Pendientes (Autos en el Local)
        $empresa_id = isset($_GET['empresa_id']) ? $_GET['empresa_id'] : null;
        if ($empresa_id) {
            $query = "SELECT t.codigo, t.patente, DATE_FORMAT(t.fecha_entrada, '%H:%i') as entrada, v.nombre as tipo_vehiculo 
                      FROM tickets t 
                      LEFT JOIN tipos_vehiculo v ON t.tipo_vehiculo_id = v.id 
                      WHERE t.empresa_id = :empresa AND t.estado = 'pendiente' 
                      ORDER BY t.fecha_entrada DESC";
            
            $stmt = $db->prepare($query);
            $stmt->execute([':empresa' => $empresa_id]);
            $tickets = $stmt->fetchAll();
            
            echo json_encode(["status" => "success", "data" => $tickets]);
        } else {
             http_response_code(400);
             echo json_encode(["status" => "error", "message" => "Es obligatorio enviar ?empresa_id=X para el modelo SaaS."]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Método no soportado en esta API."]);
        break;
}
?>
