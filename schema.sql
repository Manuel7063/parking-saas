-- ================================================================
--  AutoTicket SaaS - Esquema de Base de Datos v2.0
--  Arquitectura Multi-Tenant | Importar en phpMyAdmin (cPanel)
-- ================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ===============================================
-- 1. Empresas (Los estacionamientos arrendatarios)
-- ===============================================
CREATE TABLE IF NOT EXISTS empresas (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    nombre               VARCHAR(100) NOT NULL,
    rut_empresa          VARCHAR(20),
    rut_contacto         VARCHAR(20) COMMENT 'RUT de la persona de contacto',
    plan                 ENUM('Básico', 'Premium') DEFAULT 'Básico',
    estado               ENUM('Activo', 'Suspendido') DEFAULT 'Activo' COMMENT 'Controlado desde el Panel Maestro',

    -- Configuración del ticket impreso
    ticket_razon_social  VARCHAR(150),
    ticket_atencion_1    VARCHAR(150),
    ticket_atencion_2    VARCHAR(150),
    ticket_observacion   VARCHAR(150),

    -- Facturación Electrónica (SII Chile)
    sii_emite_boleta      BOOLEAN DEFAULT FALSE,
    sii_rut_emisor        VARCHAR(20) NULL,
    sii_api_key           VARCHAR(255) NULL,

    -- Configuración del parqueo
    usa_patente_obligatoria  BOOLEAN DEFAULT TRUE,
    tolerancia_minutos       INT DEFAULT 0,

    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- 2. Usuarios (SuperAdmin, Admin local y Cajeros)
-- ===============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id  INT NULL COMMENT 'NULL solo para el SUPERADMIN de la plataforma',
    rut         VARCHAR(20) NOT NULL UNIQUE COMMENT 'Usado como usuario de login',
    nombre      VARCHAR(100) NOT NULL,
    perfil      ENUM('SUPERADMIN', 'ADMIN', 'CAJERO') DEFAULT 'CAJERO',
    clave_hash  VARCHAR(255) NOT NULL COMMENT 'Generado con password_hash() de PHP',
    activo      BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- ===============================================
-- 3. Tipos de Vehículos (por empresa)
-- ===============================================
CREATE TABLE IF NOT EXISTS tipos_vehiculo (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id  INT NOT NULL,
    nombre      VARCHAR(50) NOT NULL COMMENT 'Auto, Moto, Camioneta, VIP...',
    activo      BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- ===============================================
-- 4. Tarifas Escalonadas
-- ===============================================
CREATE TABLE IF NOT EXISTS tarifas (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id       INT NOT NULL,
    tipo_vehiculo_id INT NOT NULL,

    cobro_minimo     DECIMAL(10,2) NOT NULL DEFAULT 0,
    minutos_minimo   INT NOT NULL DEFAULT 0,

    cobro_tramo_2    DECIMAL(10,2) DEFAULT 0,
    minutos_tramo_2  INT DEFAULT 0,

    cobro_fraccion   DECIMAL(10,2) DEFAULT 0,
    minutos_fraccion INT DEFAULT 0,

    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_vehiculo_id) REFERENCES tipos_vehiculo(id) ON DELETE CASCADE
);

-- ===============================================
-- 5. Tickets / Historial de Operaciones
-- ===============================================
CREATE TABLE IF NOT EXISTS tickets (
    codigo               VARCHAR(50) PRIMARY KEY COMMENT 'Código de barras único',
    empresa_id           INT NOT NULL,
    usuario_vendedor_id  INT NOT NULL,
    tipo_vehiculo_id     INT NOT NULL,
    patente              VARCHAR(15),

    fecha_entrada        DATETIME NOT NULL,
    fecha_salida         DATETIME NULL,
    minutos_total        INT DEFAULT 0,
    minutos_cobrado      INT DEFAULT 0,

    total_cobrado        DECIMAL(10,2) DEFAULT 0,
    estado               ENUM('pendiente', 'pagado', 'anulado') DEFAULT 'pendiente',

    fecha_anulacion      DATETIME NULL,
    usuario_anula_id     INT NULL,

    folio_sii            INT NULL,
    url_boleta_sii       VARCHAR(255) NULL,

    FOREIGN KEY (empresa_id) REFERENCES empresas(id),
    FOREIGN KEY (usuario_vendedor_id) REFERENCES usuarios(id),
    FOREIGN KEY (tipo_vehiculo_id) REFERENCES tipos_vehiculo(id)
);

SET FOREIGN_KEY_CHECKS = 1;

-- ================================================================
--  DATOS INICIALES (Ejecutar solo la primera vez)
-- ================================================================

-- Empresa Demo
INSERT INTO empresas (nombre, rut_contacto, plan, estado) VALUES
('Parking Demo Central', '12.345.678-9', 'Premium', 'Activo');

-- SuperAdmin (tú, el dueño del software)
-- La clave inicial es: superadmin2024 (puedes cambiarla después)
INSERT INTO usuarios (empresa_id, rut, nombre, perfil, clave_hash, activo) VALUES
(NULL, 'superadmin', 'Dueño de la Plataforma', 'SUPERADMIN',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1);

-- Admin de Empresa Demo
-- La clave inicial es: admin2024
INSERT INTO usuarios (empresa_id, rut, nombre, perfil, clave_hash, activo) VALUES
(1, 'admin', 'Administrador Empresa', 'ADMIN',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1);

-- Cajero de Empresa Demo
-- La clave inicial es: cajero2024
INSERT INTO usuarios (empresa_id, rut, nombre, perfil, clave_hash, activo) VALUES
(1, 'cajero1', 'Juan Cajero', 'CAJERO',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1);

-- Tipos de vehículo para la empresa demo
INSERT INTO tipos_vehiculo (empresa_id, nombre) VALUES (1, 'Auto'), (1, 'Moto'), (1, 'Camioneta');
