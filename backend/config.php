<?php
// =============================================================
//  CONFIGURACIÓN DE BASE DE DATOS - AUTOTICKET SAAS
//  *** EDITA SOLO LAS 4 LÍNEAS DE ABAJO CON TUS DATOS DE CPANEL ***
// =============================================================

define('DB_HOST', 'localhost');
define('DB_USER', 'fgpebtzv_parking_user');
define('DB_PASS', 'parking2026+');
define('DB_NAME', 'fgpebtzv_parking_saas');

// =============================================================
//  NO EDITES NADA ABAJO DE ESTA LÍNEA
// =============================================================
// Configuración de Zona Horaria (Chile)
date_default_timezone_set('America/Santiago');

function getDB() {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8",
            DB_USER,
            DB_PASS
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        
        // Sincronizar zona horaria con MySQL
        $pdo->exec("SET time_zone = '-04:00'");
        
        return $pdo;
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error de base de datos: " . $e->getMessage()]);
        exit;
    }
}
?>
