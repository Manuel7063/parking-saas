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
  return await fetchAPI(`tickets.php?empresa_id=${user.empresa_id || 1}`, 'GET');
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

export const getEmpresas = async () => {
  return await fetchAPI('empresas.php', 'GET');
};

export const getTarifas = async () => {
  return await fetchAPI('tarifas.php', 'GET');
};

export const saveTarifas = async (tarifas) => {
  return await fetchAPI('tarifas.php', 'POST', { tarifas });
};

export const cambiarPassword = async (rut, claveActual, claveNueva) => {
  return await fetchAPI('change_password.php', 'POST', {
    rut,
    clave_actual: claveActual,
    clave_nueva:  claveNueva
  });
};
