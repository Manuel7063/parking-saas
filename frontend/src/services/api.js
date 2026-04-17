const API_BASE_URL = 'https://parking.vigorasa.cl/api'; // Servidor real cPanel
// Para desarrollo local descomenta la línea de abajo:
// const API_BASE_URL = 'http://localhost/parking-saas/backend/api';

/**
 * Función genérica para conectar con PHP.
 * Si falla, retorna una respuesta mock emulada para no romper la web (para desarrollo local sin PHP).
 */
const fetchAPI = async (endpoint, method = 'GET', body = null) => {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {})
    };
    
    // Intentamos la conexion real
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, options);
    return await response.json();
  } catch (error) {
    console.warn(`[Modo Desarrollo] Fallo conexión a ${endpoint}. Usando Mock.`);
    return getMockResponse(endpoint, body);
  }
};

/**
 * Mock Data: Esto emula a tu base de datos cuando no estás conectado a cPanel.
 */
const getMockResponse = (endpoint, body) => {
  if (endpoint === 'login.php') {
    if (body) {
      if (body.rut === 'superadmin') {
        return { success: true, perfil: 'SUPERADMIN', nombre: 'Creador de Plataforma' };
      }
      if (body.rut === 'admin') {
        return { success: true, perfil: 'ADMIN', nombre: 'Administrador Franquicia' };
      }
    }
    return { success: true, perfil: 'CAJERO', nombre: 'Juan Cajero' };
  }
  
  if (endpoint === 'empresas.php') {
    return {
      success: true,
      data: [
        { id: 1, nombre: 'Estacionamiento Mall Central', rut_contacto: '12.345.678-9', plan: 'Premium', estado: 'Activo' },
        { id: 2, nombre: 'Parking Express', rut_contacto: '98.765.432-1', plan: 'Básico', estado: 'Suspendido' }
      ]
    };
  }
  
  if (endpoint === 'tickets.php') {
    return {
      success: true,
      data: [
        { id: '1231224012855', patente: 'MOCKDB1', entrada: '10:05', vehiculo: 'Auto', tarifaCalc: '$1200' },
        { id: '1231224012848', patente: 'MOCKDB2', entrada: '09:42', vehiculo: 'Moto', tarifaCalc: '$800' }
      ]
    };
  }

  return { success: false, message: 'Mock No definido' };
};

export const loginUsuario = async (rut, password) => {
  return await fetchAPI('login.php', 'POST', { rut, password });
};

export const getTicketsPendientes = async () => {
  const user = JSON.parse(localStorage.getItem('autoticket_user') || '{}');
  return await fetchAPI(`tickets.php?empresa_id=${user.empresa_id || 1}&_t=${Date.now()}`, 'GET');
};

export const crearTicket = async (data) => {
  const user = JSON.parse(localStorage.getItem('autoticket_user') || '{}');
  const payload = {
    ...data,
    empresa_id: user.empresa_id || 1,
    usuario_vendedor_id: user.usuario_id || 1
  };
  return await fetchAPI('tickets.php', 'POST', payload);
};

export const getTicketInfo = async (codigo) => {
  return await fetchAPI(`tickets.php?buscar_codigo=${codigo}&_t=${Date.now()}`, 'GET');
};

export const pagarTicket = async (id, total, minutos) => {
  return await fetchAPI('tickets.php', 'PUT', { id, total, minutos });
};

export const getHistorialTickets = async () => {
  const user = JSON.parse(localStorage.getItem('autoticket_user') || '{}');
  const empresaId = user.empresa_id || 1;
  return await fetchAPI(`tickets.php?all_tickets=1&empresa_id=${empresaId}&_t=${Date.now()}`, 'GET');
};

export const deleteTicket = async (id) => {
  return await fetchAPI(`tickets.php?id=${id}`, 'DELETE');
};

export const getReporteDiario = async (desde = '', hasta = '') => {
  const user = JSON.parse(localStorage.getItem('autoticket_user') || '{}');
  const empresaId = user.empresa_id || 1;
  const url = `tickets.php?reporte=daily&empresa_id=${empresaId}&desde=${desde}&hasta=${hasta}&_t=${Date.now()}`;
  return await fetchAPI(url, 'GET');
};

export const getEmpresaConfig = async () => {
  const user = JSON.parse(localStorage.getItem('autoticket_user') || '{}');
  const id = user.empresa_id || 1;
  return await fetchAPI(`empresas.php?id=${id}`, 'GET');
};

export const updateEmpresaConfig = async (config) => {
  const user = JSON.parse(localStorage.getItem('autoticket_user') || '{}');
  const payload = { ...config, id: user.empresa_id || 1 };
  return await fetchAPI('empresas.php', 'POST', payload);
};

export const getEmpresas = async () => {
  return await fetchAPI(`empresas.php?todos=1&_t=${Date.now()}`, 'GET');
};

export const crearEmpresa = async (datos) => {
  return await fetchAPI('empresas.php', 'POST', { accion: 'crear', ...datos });
};

export const getTarifas = async () => {
  const user = JSON.parse(localStorage.getItem('autoticket_user') || '{}');
  return await fetchAPI(`tarifas.php?empresa_id=${user.empresa_id || 1}&_t=${Date.now()}`, 'GET');
};

export const saveTarifas = async (tarifas) => {
  const user = JSON.parse(localStorage.getItem('autoticket_user') || '{}');
  return await fetchAPI('tarifas.php', 'POST', { tarifas, empresa_id: user.empresa_id || 1 });
};

export const cambiarPassword = async (rut, claveActual, claveNueva) => {
  return await fetchAPI('change_password.php', 'POST', {
    rut,
    clave_actual: claveActual,
    clave_nueva:  claveNueva
  });
};

// ==========================================
// MANTENEDOR DE USUARIOS 
// ==========================================

export const getUsuarios = async () => {
  const user = JSON.parse(localStorage.getItem('autoticket_user') || '{}');
  return await fetchAPI(`usuarios.php?empresa_id=${user.empresa_id || 1}&_t=${Date.now()}`, 'GET');
};

export const crearUsuario = async (data) => {
  const user = JSON.parse(localStorage.getItem('autoticket_user') || '{}');
  return await fetchAPI('usuarios.php', 'POST', { ...data, empresa_id: user.empresa_id || 1 });
};

export const eliminarUsuario = async (id) => {
  const user = JSON.parse(localStorage.getItem('autoticket_user') || '{}');
  return await fetchAPI(`usuarios.php?id=${id}&empresa_id=${user.empresa_id || 1}`, 'DELETE');
};
