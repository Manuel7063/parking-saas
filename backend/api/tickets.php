<?php
// backend/api/tickets.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
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
                    "success" => true, 
                    "data" => ["codigo" => $codigo],
                    "message" => "Vehículo y ticket ingresados exitosamente."
                ]);
            } else {
                http_response_code(503);
                echo json_encode(["success" => false, "message" => "Database exception. No se pudo ingresar."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Faltan parámetros críticos (empresa_id, tipo_vehiculo_id)."]);
        }
        break;

    case 'GET':
        // 1. BUSCAR TICKET ESPECÍFICO PARA COBRO (SALIDA)
        $buscar_codigo = isset($_GET['buscar_codigo']) ? $_GET['buscar_codigo'] : null;
        if ($buscar_codigo) {
            $query = "SELECT t.*, v.nombre as tipo_vehiculo_nombre, 
                             tar.cobro_minimo, tar.minutos_minimo, tar.cobro_fraccion, tar.minutos_fraccion,
                             TIMESTAMPDIFF(SECOND, t.fecha_entrada, NOW()) as segundos_res
                      FROM tickets t
                      LEFT JOIN tipos_vehiculo v ON t.tipo_vehiculo_id = v.id
                      LEFT JOIN tarifas tar ON t.tipo_vehiculo_id = tar.tipo_vehiculo_id AND t.empresa_id = tar.empresa_id
                      WHERE t.codigo = :codigo AND t.estado = 'pendiente'
                      LIMIT 1";
            
            $stmt = $db->prepare($query);
            $stmt->execute([':codigo' => $buscar_codigo]);
            $ticket = $stmt->fetch();
            
            if ($ticket) {
                // Usamos los segundos calculados y redondeamos siempre hacia arriba. Establecemos al menos 1 minuto si se lee rápido = $0.
                $minutos_totales = max(1, (int)ceil(intval($ticket['segundos_res']) / 60));
                
                // Zona horaria para la hora de salida visual
                $tz = new DateTimeZone('America/Santiago');
                $ahora = new DateTime('now', $tz);
                
                // Cálculo de tarifa
                $cobro = floatval($ticket['cobro_minimo'] ?? 0);
                $min_minimo = intval($ticket['minutos_minimo'] ?? 0);
                $min_fraccion = intval($ticket['minutos_fraccion'] ?? 1);
                $val_fraccion = floatval($ticket['cobro_fraccion'] ?? 0);

                if ($minutos_totales > $min_minimo) {
                    $minutos_extra = $minutos_totales - $min_minimo;
                    $fracciones = ceil($minutos_extra / ($min_fraccion ?: 1));
                    $cobro += ($fracciones * $val_fraccion);
                }
                
                echo json_encode([
                    "success" => true,
                    "data" => [
                        "id" => $ticket['codigo'],
                        "patente" => $ticket['patente'],
                        "entrada" => $ticket['fecha_entrada'],
                        "salida" => $ahora->format('Y-m-d H:i:s'),
                        "minutos" => $minutos_totales,
                        "tipo_vehiculo" => $ticket['tipo_vehiculo_nombre'],
                        "total" => $cobro,
                        "debug" => [
                            "segundos_db" => $ticket['segundos_res'],
                            "minutos_db" => $minutos_totales,
                            "empresa_ticket" => $ticket['empresa_id'],
                            "tipo_vehiculo_id" => $ticket['tipo_vehiculo_id'],
                            "tarifa_encontrada" => !empty($ticket['cobro_minimo'])
                        ]
                    ]
                ]);
            } else {
                http_response_code(404);
                echo json_encode(["success" => false, "message" => "Ticket no encontrado o ya procesado."]);
            }
            break;
        }

        // 2. LISTAR TODOS LOS PENDIENTES (PANEL DERECHO)
        $empresa_id = isset($_GET['empresa_id']) ? $_GET['empresa_id'] : null;
        
        // 3. LISTAR TODO EL HISTORIAL (PAGADOS Y PENDIENTES PARA GESTIÓN)
        $all_tickets = isset($_GET['all_tickets']) ? $_GET['all_tickets'] : null;
        if ($all_tickets && $empresa_id) {
            $query = "SELECT t.codigo as id, t.patente, t.fecha_entrada as entrada, t.fecha_salida as salida, 
                             t.total_cobrado, t.estado, v.nombre as tipo_vehiculo 
                      FROM tickets t 
                      LEFT JOIN tipos_vehiculo v ON t.tipo_vehiculo_id = v.id 
                      WHERE t.empresa_id = :empresa 
                      ORDER BY t.fecha_entrada DESC LIMIT 100";
            
            $stmt = $db->prepare($query);
            $stmt->execute([':empresa' => $empresa_id]);
            $tickets = $stmt->fetchAll();
            
            echo json_encode(["success" => true, "data" => $tickets]);
            break;
        }

        // 4. REPORTE DE CAJA (POR RANGO)
        $reporte = isset($_GET['reporte']) ? $_GET['reporte'] : null;
        if ($reporte === 'daily' && $empresa_id) {
            $desde = isset($_GET['desde']) && !empty($_GET['desde']) ? $_GET['desde'] : date('Y-m-d');
            $hasta = isset($_GET['hasta']) && !empty($_GET['hasta']) ? $_GET['hasta'] : date('Y-m-d');

            $query = "SELECT 
                        COALESCE(SUM(total_cobrado), 0) as total_dinero, 
                        COUNT(*) as total_vehiculos,
                        COALESCE(SUM(CASE WHEN estado = 'pagado' THEN 1 ELSE 0 END), 0) as pagados,
                        COALESCE(SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END), 0) as pendientes
                      FROM tickets 
                      WHERE empresa_id = :empresa 
                      AND (
                        (estado = 'pagado' AND DATE(fecha_salida) >= :desde AND DATE(fecha_salida) <= :hasta)
                        OR
                        (estado = 'pendiente' AND DATE(fecha_entrada) >= :desde AND DATE(fecha_entrada) <= :hasta)
                      )";
            
            $stmt = $db->prepare($query);
            $stmt->execute([
                ':empresa' => $empresa_id,
                ':desde' => $desde,
                ':hasta' => $hasta
            ]);
            $res = $stmt->fetch();
            
            // Debug: Contar todos los registros de la empresa para ver si hay algo
            $stmtCheck = $db->prepare("SELECT COUNT(*) as total FROM tickets WHERE empresa_id = :empresa");
            $stmtCheck->execute([':empresa' => $empresa_id]);
            $debugCount = $stmtCheck->fetch();

            echo json_encode([
                "success" => true, 
                "data" => $res, 
                "debug" => [
                    "desde" => $desde, 
                    "hasta" => $hasta,
                    "empresa_id" => $empresa_id,
                    "total_tickets_empresa" => $debugCount['total'],
                    "php_time" => date('Y-m-d H:i:s')
                ]
            ]);
            break;
        }

        if ($empresa_id) {
            $query = "SELECT t.codigo as id, t.patente, DATE_FORMAT(t.fecha_entrada, '%H:%i') as entrada, v.nombre as tipo_vehiculo, '$0' as tarifaCalc 
                      FROM tickets t 
                      LEFT JOIN tipos_vehiculo v ON t.tipo_vehiculo_id = v.id 
                      WHERE t.empresa_id = :empresa AND t.estado = 'pendiente' 
                      ORDER BY t.fecha_entrada DESC";
            
            $stmt = $db->prepare($query);
            $stmt->execute([':empresa' => $empresa_id]);
            $tickets = $stmt->fetchAll();
            
            echo json_encode(["success" => true, "data" => $tickets]);
        } else {
             http_response_code(400);
             echo json_encode(["success" => false, "message" => "Es obligatorio enviar ?empresa_id=X para el modelo SaaS."]);
        }
        break;
        
    case 'PUT':
        // Procesar Pago y Salida
        $data = json_decode(file_get_contents("php://input"));
        
        if (!empty($data->id) && isset($data->total) && isset($data->minutos)) {
            $query = "UPDATE tickets SET 
                      estado = 'pagado', 
                      fecha_salida = NOW(), 
                      minutos_total = :minutos, 
                      total_cobrado = :total 
                      WHERE codigo = :codigo AND estado = 'pendiente'";
            
            $stmt = $db->prepare($query);
            
            if ($stmt->execute([
                ':minutos' => $data->minutos,
                ':total' => $data->total,
                ':codigo' => $data->id
            ])) {
                echo json_encode(["success" => true, "message" => "Pago procesado y registro de salida exitoso."]);
            } else {
                http_response_code(503);
                echo json_encode(["success" => false, "message" => "No se pudo procesar el pago en la base de datos."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Faltan datos críticos para el pago (id, total, minutos)."]);
        }
        break;

    case 'DELETE':
        // Borrar Ticket (Anular permanentemente)
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        
        if ($id) {
            $query = "DELETE FROM tickets WHERE codigo = :codigo";
            $stmt = $db->prepare($query);
            if ($stmt->execute([':codigo' => $id])) {
                echo json_encode(["success" => true, "message" => "Ticket eliminado permanentemente."]);
            } else {
                http_response_code(503);
                echo json_encode(["success" => false, "message" => "No se pudo eliminar el ticket en la base de datos."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "ID de ticket no proporcionado."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Método no soportado en esta API."]);
        break;
}
?>
