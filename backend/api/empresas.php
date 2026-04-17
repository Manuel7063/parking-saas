<?php
// backend/api/empresas.php
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
$empresa_id = isset($_GET['id']) ? $_GET['id'] : 1; 

if ($method === 'GET') {
    if (isset($_GET['todos'])) {
        $stmt = $db->query("SELECT id, nombre, rut_empresa, rut_contacto, plan, estado FROM empresas ORDER BY id DESC");
        $all = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["success" => true, "data" => $all]);
        exit;
    }

    $stmt = $db->prepare("SELECT id, nombre, ticket_razon_social, ticket_observacion FROM empresas WHERE id = :id");
    $stmt->execute([':id' => $empresa_id]);
    $empresa = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($empresa) {
        echo json_encode(["success" => true, "data" => $empresa]);
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Empresa no encontrada."]);
    }
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    // Crear una nueva empresa si la acción lo determina
    if (isset($data->accion) && $data->accion === 'crear') {
        $query = "INSERT INTO empresas (nombre, rut_empresa, rut_contacto, ticket_razon_social, ticket_observacion) 
                  VALUES (:nombre, :rut_e, :rut_c, :nombre2, 'LUNES A SABADO 09:00 A 20:00 HRS')";
        $stmt = $db->prepare($query);
        $success = $stmt->execute([
            ':nombre' => $data->nombre,
            ':rut_e'  => isset($data->rut_empresa) ? $data->rut_empresa : NULL,
            ':rut_c'  => isset($data->rut_contacto) ? $data->rut_contacto : NULL,
            ':nombre2' => $data->nombre
        ]);
        if ($success) {
            $nuevoId = $db->lastInsertId();
            
            // AHORA SÍ: Crear automáticamente el usuario ADMIN
            $rut = isset($data->rut_contacto) ? $data->rut_contacto : '11111111-1';
            $clave = isset($data->clave_admin) ? $data->clave_admin : 'Admin1234';
            $hash = password_hash($clave, PASSWORD_BCRYPT);
            
            $queryUser = "INSERT INTO usuarios (rut, nombre, clave_hash, perfil, empresa_id, activo) 
                          VALUES (:rut, :nombre, :hash, 'ADMIN', :empresa_id, 1)";
            $stmtUser = $db->prepare($queryUser);
            $stmtUser->execute([
                ':rut' => $rut,
                ':nombre' => 'Dueño ' . $data->nombre,
                ':hash' => $hash,
                ':empresa_id' => $nuevoId
            ]);

            // Crear config base de vehículos 
            $vehiculos = ['Auto', 'Moto', 'Camioneta'];
            foreach ($vehiculos as $vnom) {
                $stmtV = $db->prepare("INSERT INTO tipos_vehiculo (empresa_id, nombre, activo) VALUES (:eid, :nom, 1)");
                $stmtV->execute([':eid' => $nuevoId, ':nom' => $vnom]);
                $vId = $db->lastInsertId();
                
                // Y crearles tarifa en $0 por defecto para que no reviente el cálculo y el admin deba configurarlas
                $stmtT = $db->prepare("INSERT INTO tarifas (empresa_id, tipo_vehiculo_id, cobro_minimo, minutos_minimo, cobro_fraccion, minutos_fraccion) 
                                       VALUES (:eid, :vid, 0, 0, 0, 1)");
                $stmtT->execute([':eid' => $nuevoId, ':vid' => $vId]);
            }

            echo json_encode(["success" => true, "message" => "Empresa creada exitosamente con configuraciones base.", "id" => $nuevoId]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Error al crear la empresa en MySQL."]);
        }
        exit;
    }

    if (!empty($data->id)) {
        $query = "UPDATE empresas SET 
                  ticket_razon_social = :razon, 
                  ticket_observacion = :obs,
                  rut_empresa = :rut_e,
                  rut_contacto = :rut_c 
                  WHERE id = :id";
        
        $stmt = $db->prepare($query);
        $success = $stmt->execute([
            ':razon' => $data->ticket_razon_social,
            ':obs' => $data->ticket_observacion,
            ':rut_e' => isset($data->rut_empresa) ? $data->rut_empresa : NULL,
            ':rut_c' => isset($data->rut_contacto) ? $data->rut_contacto : NULL,
            ':id' => $data->id
        ]);
        
        if ($success) {
            echo json_encode(["success" => true, "message" => "Configuración de ticket actualizada."]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Error al actualizar configuración."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID de empresa no proporcionado."]);
    }
}
?>
