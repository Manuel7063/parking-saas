import React, { useState, useEffect } from 'react';
import { LogOut, Printer, Search, Car, Bike, Truck, Calculator, Clock, CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTicketsPendientes, crearTicket } from '../services/api';
import CambiarPassword from './CambiarPassword';

export default function Caseta() {
  const navigate = useNavigate();
  // Estado local para simulaciones
  const [patente, setPatente] = useState('');
  const [tipoVehiculoId, setTipoVehiculoId] = useState(1); // 1 = Auto, 2 = Moto, 3 = 3/4
  const [codigoBarraSalida, setCodigoBarraSalida] = useState('');
  const [loadingGrid, setLoadingGrid] = useState(true);
  const [imprimiendo, setImprimiendo] = useState(false);
  const [showCambiarPass, setShowCambiarPass] = useState(false);

  // Datos reales desde la API
  const [pendientes, setPendientes] = useState([]);

  useEffect(() => {
    cargarPendientes();
  }, []);

  const cargarPendientes = async () => {
    setLoadingGrid(true);
    const resp = await getTicketsPendientes();
    if (resp.success && resp.data) {
      setPendientes(resp.data);
    }
    setLoadingGrid(false);
  };

  const handleEntrada = async () => {
    setImprimiendo(true);
    const result = await crearTicket({ patente, tipo_vehiculo_id: tipoVehiculoId });
    if (result.success) {
      setPatente('');
      await cargarPendientes();
    }
    setImprimiendo(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col font-sans">
      {/* Header Corporativo (Menú Superior) */}
      <header className="bg-slate-950 border-b border-slate-800 p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-2 rounded-lg">
            <Car className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Caja Web Central
          </h1>
        </div>
        
        <nav className="hidden md:flex flex-1 mx-8 justify-center gap-6">
          <button className="text-cyan-400 font-semibold border-b-2 border-cyan-400 pb-1 px-2">Caja Principal</button>
          <button onClick={() => navigate('/config')} className="text-slate-400 hover:text-white transition-colors px-2">Ajustes & Tarifas</button>
          <button className="text-slate-400 hover:text-white transition-colors px-2">Reportes (SII)</button>
          <button className="text-slate-400 hover:text-white transition-colors px-2">Audit. Borrados</button>
        </nav>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-white">Juan Cajero</p>
            <p className="text-xs text-slate-400">Turno Mañana</p>
          </div>
          <button 
            onClick={() => setShowCambiarPass(true)}
            title="Cambiar contraseña"
            className="p-2 bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 rounded-lg transition-all border border-slate-700"
          >
            <KeyRound className="w-5 h-5" />
          </button>
          <button onClick={() => { localStorage.removeItem('autoticket_user'); navigate('/'); }} className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all border border-slate-700">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Grid Principal de 3 Columnas Exactamente como lo pidió el usuario */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">

        {/* ----------------- COLUMNA 1: ENTRADAS ----------------- */}
        <section className="lg:col-span-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl flex flex-col overflow-hidden backdrop-blur-sm">
          <div className="bg-slate-800/80 p-3 border-b border-slate-700">
            <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Acceso / Entrada
            </h2>
          </div>
          
          <div className="p-5 flex-1 flex flex-col gap-5">
            <div>
              <label className="block text-sm text-slate-400 mb-1 font-medium">Patente (Opcional/Obligatorio)</label>
              <input 
                type="text" 
                className="w-full text-center text-3xl font-mono uppercase bg-slate-900 border-2 border-slate-700 rounded-xl py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-white placeholder-slate-600"
                placeholder="AAAA11"
                value={patente}
                onChange={(e) => setPatente(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2 font-medium">Tipo de Vehículo</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setTipoVehiculoId(1)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border ${tipoVehiculoId === 1 ? 'bg-cyan-900/50 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                >
                  <Car className="w-8 h-8 mb-1" />
                  <span className="text-xs font-bold">Auto</span>
                </button>
                <button 
                  onClick={() => setTipoVehiculoId(2)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border ${tipoVehiculoId === 2 ? 'bg-cyan-900/50 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                >
                  <Bike className="w-8 h-8 mb-1" />
                  <span className="text-xs font-bold">Moto</span>
                </button>
                <button 
                  onClick={() => setTipoVehiculoId(3)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border ${tipoVehiculoId === 3 ? 'bg-cyan-900/50 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                >
                  <Truck className="w-8 h-8 mb-1" />
                  <span className="text-xs font-bold">3/4</span>
                </button>
              </div>
            </div>

            <div className="mt-auto">
              <button 
                onClick={handleEntrada}
                disabled={imprimiendo}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-xl shadow-lg shadow-emerald-900/50 flex flex-col items-center gap-1 transition-transform active:scale-95 disabled:opacity-50"
              >
                {imprimiendo ? <Loader2 className="w-6 h-6 animate-spin" /> : <Printer className="w-6 h-6" />}
                <span>{imprimiendo ? 'ENVIANDO A NUBE...' : 'IMPRIMIR TICKET DE INGRESO'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* ----------------- COLUMNA 2: SALIDAS Y COBRO ----------------- */}
        <section className="lg:col-span-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl flex flex-col overflow-hidden backdrop-blur-sm relative">
          
          <div className="bg-slate-800/80 p-3 border-b border-slate-700">
            <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Salida y Facturación
            </h2>
          </div>

          <div className="p-5 flex flex-col gap-6 flex-1">
            
            {/* Lector de Codigo */}
            <div>
              <label className="block text-sm text-slate-400 mb-1 font-medium">Lector. Código de Barras (Ticket)</label>
              <div className="relative">
                <input 
                  type="text" 
                  autoFocus
                  className="w-full pl-4 pr-12 py-4 text-xl font-mono bg-amber-950/20 border-2 border-amber-600/50 rounded-xl focus:outline-none focus:border-amber-500 transition-all text-amber-100 placeholder-amber-900/50 shadow-inner"
                  placeholder="Escanee ticket..."
                  value={codigoBarraSalida}
                  onChange={(e) => setCodigoBarraSalida(e.target.value)}
                />
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-amber-600/50" />
              </div>
            </div>

            {/* Simulación de Desglose de Tarifa */}
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-4 space-y-3">
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                <span className="text-slate-400">Entrada:</span>
                <span className="font-mono text-white text-lg">10:05:00</span>
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                <span className="text-slate-400">Salida Local:</span>
                <span className="font-mono text-cyan-400 text-lg">11:15:30</span>
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                <span className="text-slate-400">T. Transcurrido:</span>
                <span className="font-mono font-bold text-amber-400 text-lg flex items-center"><Clock className="w-4 h-4 mr-1"/> 70 Mins</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-700/80">
                <span className="text-slate-400">Tolerancia Aplicada:</span>
                <span className="text-emerald-400 text-sm">0 Minutos</span>
              </div>
            </div>

            {/* Total Cobro Gigante */}
            <div className="mt-auto items-center flex flex-col gap-2">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 w-full rounded-2xl border-2 border-cyan-500/30 p-6 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                  <span className="text-slate-400 text-sm font-semibold mb-1 uppercase tracking-widest">Total a Pagar</span>
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                    $ 3.500
                  </span>
              </div>

              <div className="grid grid-cols-2 gap-2 w-full mt-2">
                <button className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl">Efectivo (+ Boleta)</button>
                <button className="bg-transparent border-2 border-slate-600 hover:border-slate-400 text-white font-bold py-3 rounded-xl transition-colors">Cobro Tarjeta</button>
              </div>
            </div>

          </div>
        </section>

        {/* ----------------- COLUMNA 3: PENDIENTES (DATAGRID) ----------------- */}
        <section className="lg:col-span-5 bg-slate-800/40 border border-slate-700/50 rounded-2xl flex flex-col overflow-hidden backdrop-blur-sm">
          <div className="bg-slate-800/80 p-3 border-b border-slate-700 flex justify-between items-center">
             <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Autos Pendientes
            </h2>
            <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow">
              {pendientes.length} Registros
            </div>
          </div>

          <div className="p-3 border-b border-slate-700">
             <div className="relative">
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-slate-500"
                  placeholder="Filtrar por patente o ticket..."
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
              </div>
          </div>

          <div className="flex-1 overflow-auto">
            {loadingGrid ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-cyan-500" />
                <p>Sincronizando con cPanel...</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs uppercase text-slate-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Ticket</th>
                    <th className="px-4 py-3">Patente</th>
                    <th className="px-4 py-3">Entrada</th>
                    <th className="px-4 py-3 text-right">Tarifa (Ref)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {pendientes.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-6 text-slate-500">No hay autos pendientes</td>
                    </tr>
                  )}
                  {pendientes.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/80 transition-colors cursor-pointer group">
                      <td className="px-4 py-3 text-cyan-400">{p.id}</td>
                      <td className="px-4 py-3">{p.patente || 'S/P'}</td>
                      <td className="px-4 py-3 text-slate-400">{p.entrada}</td>
                      <td className="px-4 py-3 text-right text-emerald-400/70 group-hover:text-emerald-400">{p.tarifaCalc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="p-3 bg-slate-900/50 border-t border-slate-800 text-xs text-slate-500 text-center flex justify-between items-center">
             <span>Sincronización API MySQL Local OK</span>
             <span className="text-emerald-500 font-bold">SII ACTIVO</span>
          </div>
        </section>

      </main>

      {/* Modal: Cambiar Contraseña */}
      {showCambiarPass && (
        <CambiarPassword rut="cajero1" onClose={() => setShowCambiarPass(false)} />
      )}
    </div>
  );
}
