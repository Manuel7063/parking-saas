import React, { useState, useEffect } from 'react';
import { LogOut, Save, Settings, Users, Percent, FileText, KeyRound, Loader2, CheckCircle2, AlertCircle, History, Trash2, BarChart3, TrendingUp, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTarifas, saveTarifas, getHistorialTickets, deleteTicket, getReporteDiario, getEmpresaConfig, updateEmpresaConfig, getUsuarios, crearUsuario, eliminarUsuario } from '../services/api';
import CambiarPassword from './CambiarPassword';

export default function Configuracion() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tarifas');
  const [showCambiarPass, setShowCambiarPass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  
  // Estado general
  const [tarifas, setTarifas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [reporte, setReporte] = useState(null);

  // Estado de Usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [formUsuario, setFormUsuario] = useState({ rut: '', nombre: '', perfil: 'CAJERO', password: '' });

  
  // Obtener fecha local en formato YYYY-MM-DD
  const hoyLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [filtrosReporte, setFiltrosReporte] = useState({
    desde: hoyLocal(),
    hasta: hoyLocal()
  });
  const [configTicket, setConfigTicket] = useState({
    ticket_razon_social: '',
    ticket_observacion: ''
  });

  useEffect(() => {
    cargarTarifas();
    cargarHistorial();
    cargarReporte();
    cargarConfigTicket();
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    const resp = await getUsuarios();
    if (resp.success && resp.data) {
      setUsuarios(resp.data);
    }
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setGuardando(true);
    const resp = await crearUsuario(formUsuario);
    if (resp.success) {
      setMensaje({ tipo: 'ok', texto: 'Usuario creado exitosamente.' });
      setFormUsuario({ rut: '', nombre: '', perfil: 'CAJERO', password: '' });
      await cargarUsuarios();
    } else {
      setMensaje({ tipo: 'error', texto: resp.message || 'Error al crear.' });
    }
    setGuardando(false);
    setTimeout(() => setMensaje(null), 3000);
  };

  const handleDesactivarUsuario = async (id) => {
    if (window.confirm('¿Desactivar este usuario de la empresa?')) {
      const resp = await eliminarUsuario(id);
      if (resp.success) {
        setMensaje({ tipo: 'ok', texto: 'Usuario desactivado.' });
        await cargarUsuarios();
      } else {
        setMensaje({ tipo: 'error', texto: resp.message || 'Error al desactivar.' });
      }
      setTimeout(() => setMensaje(null), 3000);
    }
  };

  const cargarTarifas = async () => {
    setLoading(true);
    const resp = await getTarifas();
    if (resp.success && resp.data) {
      // Normalizamos los datos para que sean fáciles de editar
      const dataNormalizada = resp.data.map(t => ({
        vehicle_type_id: t.vehicle_type_id,
        nombre: t.nombre,
        activo: t.vehicle_active == 1,
        cobro_minimo: t.cobro_minimo || 0,
        minutos_minimo: t.minutos_minimo || 0,
        cobro_fraccion: t.cobro_fraccion || 0,
        minutos_fraccion: t.minutos_fraccion || 0
      }));
      setTarifas(dataNormalizada);
    }
    setLoading(false);
  };

  const cargarHistorial = async () => {
    const resp = await getHistorialTickets();
    if (resp.success && resp.data) {
      setHistorial(resp.data);
    }
  };

  const cargarReporte = async () => {
    setLoading(true);
    const resp = await getReporteDiario(filtrosReporte.desde, filtrosReporte.hasta);
    if (resp.success) {
      setReporte(resp.data);
    }
    setLoading(false);
  };

  const cargarConfigTicket = async () => {
    const resp = await getEmpresaConfig();
    if (resp.success) {
      setConfigTicket(resp.data);
    }
  };

  const guardarConfigTicket = async () => {
    setLoading(true);
    const resp = await updateEmpresaConfig(configTicket);
    if (resp.success) {
      setMensaje({ tipo: 'ok', texto: 'Configuración de ticket guardada.' });
    } else {
      setMensaje({ tipo: 'error', texto: 'No se pudo guardar la configuración.' });
    }
    setLoading(false);
    setTimeout(() => setMensaje(null), 3000);
  };

  const handleBorrarTicket = async (id) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el ticket ${id}?\nEsta acción no se puede deshacer.`)) {
      const resp = await deleteTicket(id);
      if (resp.success) {
        setMensaje({ tipo: 'ok', texto: 'Ticket eliminado correctamente.' });
        await cargarHistorial();
        await cargarReporte();
      } else {
        setMensaje({ tipo: 'error', texto: resp.message || 'Error al eliminar.' });
      }
      setTimeout(() => setMensaje(null), 3000);
    }
  };

  const handleInputChange = (id, field, value) => {
    setTarifas(prev => prev.map(t => 
      t.vehicle_type_id === id ? { ...t, [field]: value } : t
    ));
  };

  const handleSave = async () => {
    setGuardando(true);
    setMensaje(null);
    const resp = await saveTarifas(tarifas);
    if (resp.success) {
      setMensaje({ tipo: 'ok', texto: '¡Tarifas guardadas exitosamente!' });
    } else {
      setMensaje({ tipo: 'error', texto: resp.message || 'Error al guardar tarifas.' });
    }
    setGuardando(false);
    setTimeout(() => setMensaje(null), 3000);
  };

  const user = JSON.parse(localStorage.getItem('autoticket_user') || '{}');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col font-sans">
      {/* Header Corporativo */}
      <header className="bg-slate-950 border-b border-slate-800 p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-2 rounded-lg">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Administración SaaS
          </h1>
        </div>
        
        <nav className="hidden md:flex flex-1 mx-8 justify-center gap-6">
          <button onClick={() => navigate('/caseta')} className="text-slate-400 hover:text-white transition-colors px-2">Caja Principal</button>
          <button className="text-cyan-400 font-semibold border-b-2 border-cyan-400 pb-1 px-2">Ajustes & Tarifas</button>
          <button className="text-slate-400 hover:text-white transition-colors px-2">Reportes (SII)</button>
          {user.perfil === 'SUPERADMIN' && (
             <button onClick={() => navigate('/master')} className="text-purple-400 hover:text-white transition-colors px-2 font-bold">👑 Panel Master SaaS</button>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowCambiarPass(true)}
            title="Cambiar contraseña"
            className="p-2 bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 rounded-lg transition-all border border-slate-700"
          >
            <KeyRound className="w-5 h-5" />
          </button>
          <button onClick={() => navigate('/')} className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all border border-slate-700">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {mensaje && (
          <div className={`flex items-center gap-2 p-4 rounded-xl mb-6 text-sm font-bold shadow-lg animate-in slide-in-from-top duration-300 ${mensaje.tipo === 'ok' ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400' : 'bg-red-500/20 border border-red-500/50 text-red-400'}`}>
            {mensaje.tipo === 'ok' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {mensaje.texto}
          </div>
        )}

        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm flex min-h-[700px]">
          
          {/* Sidebar Tabs */}
          <aside className="w-64 border-r border-slate-700 bg-slate-900/50">
            <nav className="flex flex-col p-4 gap-2">
              <button onClick={() => setActiveTab('tarifas')} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'tarifas' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
                <Percent className="w-5 h-5" />
                <span className="font-medium">Tarifario de Vehículos</span>
              </button>
              <button onClick={() => setActiveTab('usuarios')} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'usuarios' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
                <Users className="w-5 h-5" />
                <span className="font-medium">Mantenedor Usuarios</span>
              </button>
              <button onClick={() => setActiveTab('historial')} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'historial' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
                <History className="w-5 h-5" />
                <span className="font-medium">Historial y Borrados</span>
              </button>
              <button onClick={() => setActiveTab('reportes')} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'reportes' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">Cierre de Caja / Hoy</span>
              </button>
              <button onClick={() => setActiveTab('ticket')} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'ticket' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
                <FileText className="w-5 h-5" />
                <span className="font-medium">Diseño de Ticket</span>
              </button>
            </nav>
          </aside>

          {/* Tab Content */}
          <section className="flex-1 p-8 bg-slate-800/20">
            {activeTab === 'tarifas' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                  <h2 className="text-2xl font-bold text-white">Tarifas por Categoría</h2>
                  <button 
                    onClick={handleSave}
                    disabled={guardando || loading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white flex gap-2 items-center px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-900/40 disabled:opacity-50"
                  >
                    {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {guardando ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
                
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-cyan-500" />
                    <p>Obteniendo tarifas de cPanel...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {tarifas.map(t => (
                      <div key={t.vehicle_type_id} className={`bg-slate-900/80 border transition-all p-6 rounded-2xl relative ${t.activo ? 'border-slate-700 shadow-xl shadow-black/20' : 'border-slate-800 opacity-60 grayscale'}`}>
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Activo</span>
                          <input 
                            type="checkbox" 
                            checked={t.activo} 
                            onChange={e => handleInputChange(t.vehicle_type_id, 'activo', e.target.checked)}
                            className="w-5 h-5 accent-cyan-500 rounded-md cursor-pointer" 
                          />
                        </div>
                        
                        <h3 className="text-xl font-black text-cyan-400 mb-6 border-b border-slate-800 pb-2 flex items-center gap-2">
                          {t.nombre}
                        </h3>
                        
                        <div className="space-y-5">
                          <div>
                            <label className="text-xs text-slate-500 font-black uppercase tracking-wider mb-2 block">Tramo Inicial</label>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <span className="text-[10px] text-slate-600 block mb-1">Monto ($)</span>
                                <input 
                                  type="number" 
                                  value={t.cobro_minimo} 
                                  onChange={e => handleInputChange(t.vehicle_type_id, 'cobro_minimo', e.target.value)}
                                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-white font-mono focus:border-cyan-500 transition-all" 
                                />
                              </div>
                              <div className="flex-1">
                                <span className="text-[10px] text-slate-600 block mb-1">Minutos</span>
                                <input 
                                  type="number" 
                                  value={t.minutos_minimo} 
                                  onChange={e => handleInputChange(t.vehicle_type_id, 'minutos_minimo', e.target.value)}
                                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-white font-mono focus:border-cyan-500 transition-all" 
                                />
                              </div>
                            </div>
                          </div>

                          <div className="pt-2">
                            <label className="text-xs text-slate-500 font-black uppercase tracking-wider mb-2 block">Fracción Adicional (Post-mínimo)</label>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <span className="text-[10px] text-slate-600 block mb-1">Monto ($)</span>
                                <input 
                                  type="number" 
                                  value={t.cobro_fraccion} 
                                  onChange={e => handleInputChange(t.vehicle_type_id, 'cobro_fraccion', e.target.value)}
                                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-white font-mono focus:border-cyan-500 transition-all" 
                                />
                              </div>
                              <div className="flex-1">
                                <span className="text-[10px] text-slate-600 block mb-1">Cada (Min)</span>
                                <input 
                                  type="number" 
                                  value={t.minutos_fraccion} 
                                  onChange={e => handleInputChange(t.vehicle_type_id, 'minutos_fraccion', e.target.value)}
                                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-white font-mono focus:border-cyan-500 transition-all" 
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'usuarios' && (
               <div className="animate-in fade-in duration-300">
                  <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-4">Mantenedor Usuarios Cajeros</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-1 bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl h-fit">
                        <h3 className="text-md font-bold text-cyan-400 mb-4 border-b border-slate-800 pb-2">Crear Nuevo Usuario</h3>
                        <form onSubmit={handleCrearUsuario} className="space-y-4">
                           <div>
                              <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">RUT Usuario</label>
                              <input 
                                type="text" 
                                required placeholder="12345678-9"
                                value={formUsuario.rut} onChange={e => setFormUsuario({...formUsuario, rut: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500 outline-none" 
                              />
                           </div>
                           <div>
                              <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Nombre Completo</label>
                              <input 
                                type="text" 
                                required placeholder="Juan Pérez"
                                value={formUsuario.nombre} onChange={e => setFormUsuario({...formUsuario, nombre: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500 outline-none" 
                              />
                           </div>
                           <div>
                              <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Contraseña (Mín 6)</label>
                              <input 
                                type="password" 
                                required placeholder="••••••" minLength={6}
                                value={formUsuario.password} onChange={e => setFormUsuario({...formUsuario, password: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500 outline-none" 
                              />
                           </div>
                           <button 
                             type="submit" disabled={guardando}
                             className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-lg text-sm mt-2 disabled:opacity-50"
                           >
                             {guardando ? 'Guardando...' : 'Registrar Cajero'}
                           </button>
                        </form>
                     </div>

                     <div className="lg:col-span-2">
                        <div className="bg-slate-900 border border-slate-700 overflow-hidden rounded-2xl shadow-xl">
                           <table className="w-full text-left text-sm text-slate-300">
                             <thead className="bg-slate-950/50 text-slate-500 uppercase text-[10px] font-bold">
                               <tr>
                                 <th className="px-4 py-3">RUT</th>
                                 <th className="px-4 py-3">Nombre</th>
                                 <th className="px-4 py-3">Perfil</th>
                                 <th className="px-4 py-3 text-center">Estado</th>
                                 <th className="px-4 py-3 text-center">Acción</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-800">
                               {usuarios.map(u => (
                                 <tr key={u.id} className={`hover:bg-slate-800/50 ${u.activo == 0 ? 'opacity-50' : ''}`}>
                                   <td className="px-4 py-3 font-mono">{u.rut}</td>
                                   <td className="px-4 py-3">{u.nombre}</td>
                                   <td className="px-4 py-3 text-[10px] font-bold">
                                     <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700">{u.perfil}</span>
                                   </td>
                                   <td className="px-4 py-3 text-center">
                                     {u.activo == 1 ? <span className="text-emerald-400 text-xs font-bold">Activo</span> : <span className="text-red-400 text-xs font-bold">Inactivo</span>}
                                   </td>
                                   <td className="px-4 py-3 text-center">
                                      {u.activo == 1 && u.perfil !== 'SUPERADMIN' && (
                                         <button 
                                           onClick={() => handleDesactivarUsuario(u.id)}
                                           className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded transition-colors text-xs inline-flex items-center gap-1"
                                           title="Desactivar"
                                         >
                                           <Trash2 className="w-3 h-3" /> Suspender
                                         </button>
                                      )}
                                   </td>
                                 </tr>
                               ))}
                               {usuarios.length === 0 && (
                                 <tr><td colSpan="5" className="text-center py-6 text-slate-500 text-xs">No hay usuarios cargados.</td></tr>
                               )}
                             </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'reportes' && (
               <div className="animate-in fade-in duration-300">
                  <div className="mb-8 border-b border-slate-700 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Resumen de Caja</h2>
                      <p className="text-slate-400 text-sm">Resumen de ingresos y movimientos del período seleccionado.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 p-3 rounded-2xl border border-slate-700">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Desde</label>
                        <input 
                          type="date" 
                          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500 transition-all"
                          value={filtrosReporte.desde}
                          onChange={(e) => setFiltrosReporte(prev => ({ ...prev, desde: e.target.value }))}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Hasta</label>
                        <input 
                          type="date" 
                          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500 transition-all"
                          value={filtrosReporte.hasta}
                          onChange={(e) => setFiltrosReporte(prev => ({ ...prev, hasta: e.target.value }))}
                        />
                      </div>
                      <button 
                        onClick={cargarReporte}
                        disabled={loading}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 self-end"
                      >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />}
                        Consultar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-slate-900/80 border border-slate-700 p-6 rounded-2xl shadow-xl">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl">
                          <TrendingUp className="w-6 h-6 text-emerald-400" />
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">Hoy</span>
                      </div>
                      <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total Recaudado</p>
                      <h3 className="text-3xl font-black text-white">$ {reporte ? Math.round(reporte.total_dinero).toLocaleString('es-CL') : '0'}</h3>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-700 p-6 rounded-2xl shadow-xl">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-cyan-500/10 rounded-xl">
                          <Users className="w-6 h-6 text-cyan-400" />
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs font-bold uppercase mb-1">Vehículos Totales</p>
                      <h3 className="text-3xl font-black text-white">{reporte ? reporte.total_vehiculos : '0'}</h3>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-700 p-6 rounded-2xl shadow-xl">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                          <Wallet className="w-6 h-6 text-blue-400" />
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs font-bold uppercase mb-1">Ventas Finalizadas</p>
                      <h3 className="text-3xl font-black text-white">{reporte ? reporte.pagados : '0'}</h3>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-700 p-6 rounded-2xl shadow-xl">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl">
                          <History className="w-6 h-6 text-amber-400" />
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs font-bold uppercase mb-1">Autos en Patio</p>
                      <h3 className="text-3xl font-black text-white">{reporte ? reporte.pendientes : '0'}</h3>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-700 p-6 rounded-2xl">
                     <h4 className="text-sm font-bold text-slate-300 mb-4 border-b border-slate-800 pb-2">Información de Cierre</h4>
                     <p className="text-xs text-slate-500 leading-relaxed">
                        Este reporte muestra la suma de todos los tickets con estado <strong>'pagado'</strong> cuya fecha de salida sea el día de hoy. 
                        Los ingresos se calculan automáticamente basándose en las tarifas configuradas al momento del cobro.
                     </p>
                  </div>
               </div>
            )}
            
            {activeTab === 'ticket' && (
               <div className="animate-in fade-in duration-300">
                  <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-4">Ajustes de Impresión (Ticket)</h2>
                  <div className="max-w-md bg-slate-900 border border-slate-700 p-8 rounded-2xl space-y-6 shadow-2xl">
                     <div>
                        <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Razón Social o Nombre Fantasía</label>
                        <input 
                          type="text" 
                          placeholder="Ej: ESTACIONAMIENTO CENTRAL"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 transition-all outline-none" 
                          value={configTicket.ticket_razon_social}
                          onChange={(e) => setConfigTicket(prev => ({ ...prev, ticket_razon_social: e.target.value }))}
                        />
                        <p className="text-[10px] text-slate-600 mt-1">Este nombre aparecerá en la parte superior del ticket.</p>
                     </div>
                     <div>
                        <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Observación Administrador (Horarios, Glosa)</label>
                        <textarea 
                          rows="4"
                          placeholder="Ej: Horario 8:00 a 22:00. No se responde por objetos de valor."
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 transition-all outline-none resize-none" 
                          value={configTicket.ticket_observacion}
                          onChange={(e) => setConfigTicket(prev => ({ ...prev, ticket_observacion: e.target.value }))}
                        />
                        <p className="text-[10px] text-slate-600 mt-1">Texto fijo que aparecerá al final del ticket.</p>
                     </div>

                     <button 
                        onClick={guardarConfigTicket}
                        disabled={loading}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                     >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Guardar Cambios
                     </button>
                  </div>
               </div>
            )}

            {activeTab === 'historial' && (
               <div className="animate-in fade-in duration-300 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                    <h2 className="text-2xl font-bold text-white">Auditoría / Borrado de Tickets</h2>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Buscar por patente o ID..."
                        className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                        value={busquedaHistorial}
                        onChange={(e) => setBusquedaHistorial(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto bg-slate-900/50 rounded-2xl border border-slate-700/50 min-h-[400px]">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-slate-950/50 text-slate-500 uppercase text-[10px] font-bold sticky top-0">
                        <tr>
                          <th className="px-6 py-4">ID Ticket</th>
                          <th className="px-6 py-4">Patente</th>
                          <th className="px-6 py-4">Tipo</th>
                          <th className="px-6 py-4">Entrada</th>
                          <th className="px-6 py-4">Salida</th>
                          <th className="px-6 py-4">Total</th>
                          <th className="px-6 py-4">Estado</th>
                          <th className="px-6 py-4 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {historial
                          .filter(t => 
                            t.id.toLowerCase().includes(busquedaHistorial.toLowerCase()) || 
                            (t.patente && t.patente.toLowerCase().includes(busquedaHistorial.toLowerCase()))
                          )
                          .map(t => (
                          <tr key={t.id} className="hover:bg-slate-800/30 transition-colors group">
                            <td className="px-6 py-4 font-mono text-cyan-400">{t.id}</td>
                            <td className="px-6 py-4 font-bold">{t.patente || 'S/P'}</td>
                            <td className="px-6 py-4 text-slate-400 text-xs">{t.tipo_vehiculo}</td>
                            <td className="px-6 py-4 text-[10px] font-mono">{t.entrada}</td>
                            <td className="px-6 py-4 text-[10px] font-mono">{t.salida || '--:--'}</td>
                            <td className="px-6 py-4 font-bold text-emerald-400">${Math.round(t.total_cobrado).toLocaleString('es-CL')}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.estado === 'pagado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                {t.estado}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button 
                                onClick={() => handleBorrarTicket(t.id)}
                                className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                title="Eliminar definitivamente"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {historial.length === 0 && (
                          <tr><td colSpan="8" className="text-center py-20 text-slate-500 italic">No hay registros históricos aún.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>
            )}
          </section>

        </div>
      </main>

      {/* Modal: Cambiar Contraseña */}
      {showCambiarPass && (
        <CambiarPassword rut="admin" onClose={() => setShowCambiarPass(false)} />
      )}
    </div>
  );
}
