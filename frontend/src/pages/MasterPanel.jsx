import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Users, TicketCheck, TrendingUp, Plus, LogOut,
  ShieldCheck, CheckCircle2, XCircle, Loader2, X, Globe, KeyRound
} from 'lucide-react';
import { getEmpresas, crearEmpresa } from '../services/api';
import CambiarPassword from './CambiarPassword';

const KpiCard = ({ icon: Icon, label, value, color, suffix = '' }) => (
  <div className={`relative overflow-hidden rounded-2xl border bg-slate-900/80 p-5 flex items-center gap-4 backdrop-blur-sm ${color}`}>
    <div className="p-3 rounded-xl bg-white/5">
      <Icon className="w-7 h-7" />
    </div>
    <div>
      <p className="text-sm text-slate-400 font-medium">{label}</p>
      <p className="text-3xl font-black text-white">{value}<span className="text-sm font-normal text-slate-400 ml-1">{suffix}</span></p>
    </div>
    <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/5 blur-xl" />
  </div>
);

const EstadoBadge = ({ estado }) => (
  estado === 'Activo'
    ? <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-900/30 border border-emerald-700/50 text-xs font-bold px-3 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" /> Activo</span>
    : <span className="flex items-center gap-1.5 text-red-400 bg-red-900/30 border border-red-700/50 text-xs font-bold px-3 py-1 rounded-full"><XCircle className="w-3 h-3" /> Suspendido</span>
);

export default function MasterPanel() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCambiarPass, setShowCambiarPass] = useState(false);
  const [nuevaEmpresa, setNuevaEmpresa] = useState({ nombre: '', rut_contacto: '', plan: 'Básico' });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarEmpresas();
  }, []);

  const cargarEmpresas = async () => {
    setLoading(true);
    try {
      const resp = await getEmpresas();
      if (resp.success && resp.data) {
        const rawData = Array.isArray(resp.data) ? resp.data : [resp.data];
        const dataSegura = rawData.map(e => ({
          ...e,
          rut_contacto: e.rut_contacto || 'No especificado',
          plan: e.plan || 'Premium',
          estado: e.estado || 'Activo'
        }));
        setEmpresas(dataSegura);
      }
    } catch (error) {
      console.error(error);
      setEmpresas([]);
    }
    setLoading(false);
  };

  const handleCrearEmpresa = async (e) => {
    e.preventDefault();
    setGuardando(true);
    const resp = await crearEmpresa(nuevaEmpresa);
    if (resp.success) {
      await cargarEmpresas();
      setNuevaEmpresa({ nombre: '', rut_contacto: '', plan: 'Básico' });
      setShowModal(false);
    } else {
      alert("Error al crear empresa: " + (resp.message || ""));
    }
    setGuardando(false);
  };

  const handleToggleEstado = (id) => {
    setEmpresas(prev => prev.map(e =>
      e.id === id ? { ...e, estado: e.estado === 'Activo' ? 'Suspendido' : 'Activo' } : e
    ));
  };

  const activas = empresas.filter(e => e.estado === 'Activo').length;

  return (
    <div className="min-h-screen bg-[#0a0a14] text-slate-200 flex flex-col font-sans">

      {/* Header Maestro */}
      <header className="border-b border-purple-900/40 bg-[#0d0d1f]/90 backdrop-blur-xl p-4 flex justify-between items-center shadow-[0_4px_40px_rgba(139,92,246,0.08)]">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-600 to-amber-500 p-2.5 rounded-xl shadow-lg shadow-purple-900/50">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-amber-400">AutoTicket</span>
              <span className="text-white ml-1">MASTER</span>
            </h1>
            <p className="text-xs text-purple-400/70 font-medium tracking-wider uppercase">Centro de Control SaaS</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5">
            <Globe className="w-4 h-4 text-amber-400" />
            <span className="text-amber-300 text-xs font-bold">Creador de Plataforma</span>
          </div>
          <button
            onClick={() => setShowCambiarPass(true)}
            title="Cambiar contraseña"
            className="p-2 bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 rounded-lg transition-all border border-slate-700"
          >
            <KeyRound className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all border border-slate-700"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard icon={Building2} label="Empresas Registradas" value={empresas.length} color="border-purple-700/40 text-purple-400" />
          <KpiCard icon={CheckCircle2} label="Empresas Activas" value={activas} color="border-emerald-700/40 text-emerald-400" />
          <KpiCard icon={TicketCheck} label="Tickets Globales (Mock)" value="8.412" color="border-cyan-700/40 text-cyan-400" />
          <KpiCard icon={TrendingUp} label="Ingreso Proyectado" value="$240.000" suffix="/ mes" color="border-amber-700/40 text-amber-400" />
        </section>

        {/* Panel de Empresas */}
        <section className="bg-slate-900/60 border border-purple-900/30 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-5 border-b border-purple-900/30 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Registro de Inquilinos (Estacionamientos)
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">Empresas que arriendan tu plataforma SaaS</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-purple-900/40 text-sm"
            >
              <Plus className="w-4 h-4" />
              Nueva Empresa
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-purple-500" />
              <p>Cargando empresas desde cPanel...</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-900/80 text-xs uppercase text-slate-500 border-b border-slate-800">
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Nombre de la Empresa</th>
                    <th className="px-6 py-3">RUT Contacto</th>
                    <th className="px-6 py-3">Plan</th>
                    <th className="px-6 py-3 text-center">Estado</th>
                    <th className="px-6 py-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {empresas.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-500">
                        No hay empresas registradas. ¡Agrega la primera!
                      </td>
                    </tr>
                  )}
                  {empresas.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-6 py-4 text-purple-400 font-bold">#{String(emp.id).padStart(3, '0')}</td>
                      <td className="px-6 py-4 text-white font-semibold font-sans">{emp.nombre}</td>
                      <td className="px-6 py-4 text-slate-400">{emp.rut_contacto}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${emp.plan === 'Premium' ? 'bg-amber-900/30 text-amber-400 border-amber-700/50' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {emp.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <EstadoBadge estado={emp.estado} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleEstado(emp.id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${emp.estado === 'Activo' ? 'border-red-700/50 text-red-400 hover:bg-red-900/30' : 'border-emerald-700/50 text-emerald-400 hover:bg-emerald-900/30'}`}
                        >
                          {emp.estado === 'Activo' ? 'Suspender' : 'Reactivar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Modal: Nueva Empresa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0f0f20] border border-purple-800/50 rounded-3xl shadow-2xl shadow-purple-900/40 w-full max-w-md p-8 relative animate-fadeIn">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r from-purple-600 to-amber-500" />
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-black text-white mb-1">Registrar Nueva Empresa</h2>
            <p className="text-slate-500 text-sm mb-6">Se creará un inquilino nuevo en tu plataforma SaaS.</p>

            <form onSubmit={handleCrearEmpresa} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1 block">Nombre del Estacionamiento</label>
                <input
                  required
                  type="text"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all placeholder-slate-600"
                  placeholder="Ej: Parking Las Condes"
                  value={nuevaEmpresa.nombre}
                  onChange={e => setNuevaEmpresa(p => ({ ...p, nombre: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1 block">RUT Contacto</label>
                <input
                  required
                  type="text"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all placeholder-slate-600"
                  placeholder="Ej: 12.345.678-9"
                  value={nuevaEmpresa.rut_contacto}
                  onChange={e => setNuevaEmpresa(p => ({ ...p, rut_contacto: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1 block">Plan Contratado</label>
                <select
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all"
                  value={nuevaEmpresa.plan}
                  onChange={e => setNuevaEmpresa(p => ({ ...p, plan: e.target.value }))}
                >
                  <option value="Básico">Básico</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={guardando}
                className="w-full bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-black py-3.5 rounded-xl mt-2 transition-all shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {guardando ? <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</> : <><Plus className="w-5 h-5" /> Crear Empresa</>}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Cambiar Contraseña */}
      {showCambiarPass && (
        <CambiarPassword rut="superadmin" onClose={() => setShowCambiarPass(false)} />
      )}
    </div>
  );
}
