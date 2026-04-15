<?php
// backend/api/tarifas.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config.php';
$db = getDB();

$method = $_SERVER['REQUEST_METHOD'];

// Para simplificar, en este MVP usamos empresa_id = 1
// En el futuro, esto vendrá de un Token JWT o sesión
$empresa_id = 1;

if ($method === 'GET') {
    // Obtener tipos de vehículo y sus tarifas asociadas
    $query = "SELECT v.id as vehicle_type_id, v.nombre, v.activo as vehicle_active,
                     t.id as tarifa_id, t.cobro_minimo, t.minutos_minimo, t.cobro_fraccion, t.minutos_fraccion
              FROM tipos_vehiculo v
              LEFT JOIN tarifas t ON v.id = t.tipo_vehiculo_id AND v.empresa_id = t.empresa_id
              WHERE v.empresa_id = :empresa_id";
    
    $stmt = $db->prepare($query);
    $stmt->execute([':empresa_id' => $empresa_id]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(["success" => true, "data" => $results]);
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['tarifas']) || !is_array($data['tarifas'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Datos de tarifas no válidos."]);
        exit;
    }
    
    try {
        $db->beginTransaction();
        
        foreach ($data['tarifas'] as $tarifa) {
            $v_id = $tarifa['vehicle_type_id'];
            $activo = isset($tarifa['activo']) ? ($tarifa['activo'] ? 1 : 0) : 1;
            
            // 1. Actualizar estado del tipo de vehículo
            $stmtV = $db->prepare("UPDATE tipos_vehiculo SET activo = :activo WHERE id = :id AND empresa_id = :eid");
            $stmtV->execute([':activo' => $activo, ':id' => $v_id, ':eid' => $empresa_id]);
            
            // 2. Insertar o Actualizar tarifa
            // Buscamos si ya existe
            $stmtCheck = $db->prepare("SELECT id FROM tarifas WHERE empresa_id = :eid AND tipo_vehiculo_id = :vid");
            $stmtCheck->execute([':eid' => $empresa_id, ':vid' => $v_id]);
            $exists = $stmtCheck->fetch();
            
            if ($exists) {
                $queryTarifa = "UPDATE tarifas SET 
                                cobro_minimo = :cm, minutos_minimo = :mm, 
                                cobro_fraccion = :cf, minutos_fraccion = :mf
                                WHERE id = :id";
                $stmtT = $db->prepare($queryTarifa);
                $stmtT->execute([
                    ':cm' => $tarifa['cobro_minimo'],
                    ':mm' => $tarifa['minutos_minimo'],
                    ':cf' => $tarifa['cobro_fraccion'],
                    ':mf' => $tarifa['minutos_fraccion'],
                    ':id' => $exists['id']
                ]);
            } else {
                $queryTarifa = "INSERT INTO tarifas 
                                (empresa_id, tipo_vehiculo_id, cobro_minimo, minutos_minimo, cobro_fraccion, minutos_fraccion)
                                VALUES (:eid, :vid, :cm, :mm, :cf, :mf)";
                $stmtT = $db->prepare($queryTarifa);
                $stmtT->execute([
                    ':eid' => $empresa_id,
                    ':vid' => $v_id,
                    ':cm' => $tarifa['cobro_minimo'],
                    ':mm' => $tarifa['minutos_minimo'],
                    ':cf' => $tarifa['cobro_fraccion'],
                    ':mf' => $tarifa['minutos_fraccion']
                ]);
            }
        }
        
        $db->commit();
        echo json_encode(["success" => true, "message" => "Tarifas actualizadas correctamente."]);
        
    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error al guardar: " . $e->getMessage()]);
    }
}
?>
