import React, { useState, useEffect } from 'react';
import { LogOut, Save, Settings, Users, Percent, FileText, KeyRound, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTarifas, saveTarifas } from '../services/api';
import CambiarPassword from './CambiarPassword';

export default function Configuracion() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tarifas');
  const [showCambiarPass, setShowCambiarPass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  
  // Estado para las tarifas
  const [tarifas, setTarifas] = useState([]);

  useEffect(() => {
    cargarTarifas();
  }, []);

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
                  <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-4">Mantenedor Usuarios</h2>
                  <p className="text-slate-400 italic">Módulo de gestión de personal - Próximamente en v3.0</p>
               </div>
            )}
            
            {activeTab === 'ticket' && (
               <div className="animate-in fade-in duration-300">
                  <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-4">Ajustes de Impresión (Ticket)</h2>
                  <div className="max-w-md bg-slate-900 border border-slate-700 p-6 rounded-2xl space-y-4">
                     <div>
                        <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Razón Social</label>
                        <input type="text" defaultValue="VIGORASA PARKING SERVICE" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 transition-all" />
                     </div>
                     <div>
                        <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Eslogan o Mensaje de Bienvenida</label>
                        <input type="text" defaultValue="¡Gracias por preferirnos!" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 transition-all" />
                     </div>
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
