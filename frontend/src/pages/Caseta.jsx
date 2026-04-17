import React, { useState, useEffect } from 'react';
import { LogOut, Printer, Search, Car, Bike, Truck, Calculator, Clock, CheckCircle2, AlertCircle, Loader2, KeyRound, MapPin, CreditCard, Banknote, Menu, X, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTicketsPendientes, crearTicket, getTicketInfo, pagarTicket, getEmpresaConfig, getTarifas } from '../services/api';
import CambiarPassword from './CambiarPassword';
import BarcodeScanner from './BarcodeScanner';

export default function Caseta() {
  const navigate = useNavigate();
  // Estado local para simulaciones
  const [patente, setPatente] = useState('');
  const [tiposVehiculos, setTiposVehiculos] = useState([]);
  const [tipoVehiculoId, setTipoVehiculoId] = useState(null);
  const [codigoBarraSalida, setCodigoBarraSalida] = useState('');
  const [loadingGrid, setLoadingGrid] = useState(true);
  const [imprimiendo, setImprimiendo] = useState(false);
  const [showCambiarPass, setShowCambiarPass] = useState(false);
  const [ticketEncontrado, setTicketEncontrado] = useState(null);
  const [reloj, setReloj] = useState(new Date().toLocaleTimeString());
  const [empresa, setEmpresa] = useState(null);
  const [lastTicket, setLastTicket] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Detectar si es dispositivo móvil o tablet
  const isMobile = /Android|iPhone|iPad|iPod|Tablet|Mobile/i.test(navigator.userAgent)
    || window.matchMedia('(pointer: coarse)').matches;

  // Datos reales del usuario y pendientes
  const user = JSON.parse(localStorage.getItem('autoticket_user') || '{}');
  const [pendientes, setPendientes] = useState([]);

  useEffect(() => {
    cargarPendientes();
    cargarConfig();
    const timer = setInterval(() => {
      setReloj(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (lastTicket && window.JsBarcode) {
      setTimeout(() => {
        const elem = document.getElementById('barcode-elem');
        if (elem) {
          window.JsBarcode("#barcode-elem", lastTicket.codigo, {
            format: "CODE128",
            width: 2,
            height: 40,
            displayValue: false,
            margin: 0
          });
        }
      }, 50);
    }
  }, [lastTicket]);

  const cargarConfig = async () => {
    const resp = await getEmpresaConfig();
    if (resp.success) {
      setEmpresa(resp.data);
    }
    const ts = await getTarifas();
    if (ts.success && ts.data && ts.data.length > 0) {
      setTiposVehiculos(ts.data);
      if (!tipoVehiculoId) setTipoVehiculoId(ts.data[0].vehicle_type_id);
    }
  };

  const cargarPendientes = async () => {
    setLoadingGrid(true);
    const resp = await getTicketsPendientes();
    if (resp.success && resp.data) {
      setPendientes(resp.data);
    }
    setLoadingGrid(false);
  };

  const handleEntrada = async () => {
    if (!patente && !window.confirm('¿Desea ingresar vehículo sin patente?')) return;

    setImprimiendo(true);
    try {
      const result = await crearTicket({ patente, tipo_vehiculo_id: tipoVehiculoId });
      
      if (result.success) {
        // Información para el ticket impreso
        const vNombre = tiposVehiculos.find(t => t.vehicle_type_id === tipoVehiculoId)?.nombre || 'Vehículo';
        const infoTicket = {
          codigo: result.data.codigo,
          patente: patente || 'S/PATENTE',
          tipo_vehiculo: vNombre,
          fecha: new Date().toLocaleDateString('es-CL'),
          hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          operador: user.nombre || 'Operador'
        };
        
        setLastTicket(infoTicket);
        setPatente('');
        await cargarPendientes();
        
        // Lanzar impresión tras breve delay para renderizado
        setTimeout(() => {
          window.print();
          setLastTicket(null);
        }, 500);
      } else {
         alert(result.message || 'Error al procesar entrada. Verifique conexión.');
      }
    } catch (err) {
      console.error(err);
      alert('Error crítico de red. El ticket fue creado en nube? Reintente o refresque.');
    } finally {
      setImprimiendo(false);
    }
  };

  const efectuarBusqueda = async (codigo) => {
    if (!codigo) return;
    setLoadingGrid(true); // Reusamos el estado de carga o uno nuevo para feedback
    try {
      const resp = await getTicketInfo(codigo);
      if (resp.success) {
        setTicketEncontrado(resp.data);
        setCodigoBarraSalida(codigo);
      } else {
        alert(resp.message || 'Ticket no válido o ya pagado');
        setTicketEncontrado(null);
      }
    } catch (err) {
      console.error(err);
      alert('Error al consultar el ticket');
    } finally {
      setLoadingGrid(false);
    }
  };

  const handleBuscarTicket = async (e) => {
    if (e.key === 'Enter' && codigoBarraSalida) {
      efectuarBusqueda(codigoBarraSalida);
    }
  };

  // Auto-búsqueda para escáneres físicos que no mandan "Enter"
  useEffect(() => {
    const timer = setTimeout(() => {
      // Si el código tiene longitud de barcode típica (8-16 chars) y no hay ticket cargado
      if (codigoBarraSalida.length >= 8 && !ticketEncontrado) {
        efectuarBusqueda(codigoBarraSalida);
      }
    }, 600); // 600ms de calma tras terminar de "teclear/escanear"
    return () => clearTimeout(timer);
  }, [codigoBarraSalida]);

  const handlePagar = async (metodo) => {
    if (!ticketEncontrado) return;
    
    const resp = await pagarTicket(ticketEncontrado.id, ticketEncontrado.total, ticketEncontrado.minutos);
    if (resp.success) {
      alert(`Pago exitoso (${metodo}). Registrando salida...`);
      setTicketEncontrado(null);
      setCodigoBarraSalida('');
      await cargarPendientes();
    } else {
      alert(resp.message || 'Error al procesar el pago');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col font-sans">
      {/* Header Corporativo (Menú Superior) */}
      <header className="bg-slate-950 border-b border-slate-800 p-4 flex justify-between items-center shadow-md print:hidden relative z-50">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-2 rounded-lg">
            <Car className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Caja Web
          </h1>
        </div>
        
        {/* Navegación Desktop */}
        <nav className="hidden md:flex flex-1 mx-8 justify-center gap-6">
          <button className="text-cyan-400 font-semibold border-b-2 border-cyan-400 pb-1 px-2">Caja Principal</button>
          <button onClick={() => navigate('/config')} className="text-slate-400 hover:text-white transition-colors px-2">Ajustes & Tarifas</button>
          <button className="text-slate-400 hover:text-white transition-colors px-2">Reportes (SII)</button>
          <button className="text-slate-400 hover:text-white transition-colors px-2">Audit. Borrados</button>
          {user.perfil === 'SUPERADMIN' && (
             <button onClick={() => navigate('/master')} className="text-purple-400 hover:text-white transition-colors px-2 font-bold flex items-center gap-1">👑 Panel Master SaaS</button>
          )}
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-white">{user.nombre || 'Admin'}</p>
            <p className="text-xs text-slate-400 capitalize">{user.rol || 'Operador'}</p>
          </div>
          <button 
            onClick={() => setShowCambiarPass(true)}
            title="Cambiar contraseña"
            className="hidden sm:block p-2 bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 rounded-lg transition-all border border-slate-700"
          >
            <KeyRound className="w-5 h-5" />
          </button>
          <button onClick={() => { localStorage.removeItem('autoticket_user'); navigate('/'); }} className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all border border-slate-700" title="Cerrar Sessión">
            <LogOut className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowMenu(!showMenu)} 
            className="md:hidden p-2 bg-slate-800 hover:bg-cyan-500/20 text-slate-300 rounded-lg border border-slate-700 transition-all"
          >
            {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Menú Móvil */}
      {showMenu && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 absolute w-full top-[73px] z-40 shadow-xl print:hidden">
          <nav className="flex flex-col px-4 py-4 gap-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-cyan-500 flex items-center justify-center font-bold text-cyan-400 uppercase">
                    {(user.nombre || 'A').charAt(0)}
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white">{user.nombre || 'Admin'}</h3>
                    <p className="text-xs text-cyan-400 uppercase tracking-widest">{user.perfil || 'Operador'}</p>
                </div>
            </div>
            <button onClick={() => { setShowMenu(false); }} className="text-cyan-400 font-bold text-left px-2 py-2 bg-cyan-900/20 rounded-lg border border-cyan-900/50">Caja Principal</button>
            <button onClick={() => { setShowMenu(false); navigate('/config'); }} className="text-slate-400 hover:text-white font-medium text-left px-2 py-2 transition-colors">Ajustes & Tarifas</button>
            <button className="text-slate-400 hover:text-white font-medium text-left px-2 py-2 transition-colors">Reportes Diarios (Cierre)</button>
            <button onClick={() => setShowCambiarPass(true)} className="text-slate-400 hover:text-white font-medium text-left px-2 py-2 transition-colors flex items-center gap-2"><KeyRound className="w-4 h-4" /> Cambiar Contraseña</button>
            {user.perfil === 'SUPERADMIN' && (
               <button onClick={() => navigate('/master')} className="text-purple-400 hover:text-purple-300 font-bold text-left px-2 py-2 transition-colors bg-purple-900/10 rounded-lg border border-purple-900/30">👑 Ir Panel Master SaaS</button>
            )}
          </nav>
        </div>
      )}

      {/* Grid Principal de 3 Columnas Exactamente como lo pidió el usuario */}
      <main className="flex-1 p-2 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 h-full print:hidden">

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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {tiposVehiculos.length === 0 ? (
                  <div className="col-span-3 text-center text-slate-500 py-4"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-500" /> Cargando categorías...</div>
                ) : (
                  tiposVehiculos.filter(tv => tv.vehicle_active !== 0).slice(0,3).map(tv => (
                    <button 
                      key={tv.vehicle_type_id}
                      onClick={() => setTipoVehiculoId(tv.vehicle_type_id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border ${tipoVehiculoId === tv.vehicle_type_id ? 'bg-cyan-900/50 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)] scale-[1.02] transition-transform' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors'}`}
                    >
                      {tv.nombre.toLowerCase().includes('moto') ? <Bike className="w-8 h-8 mb-1" /> : (tv.nombre.toLowerCase().includes('3/4') || tv.nombre.toLowerCase().includes('camioneta')) ? <Truck className="w-8 h-8 mb-1" /> : <Car className="w-8 h-8 mb-1" />}
                      <span className="text-xs font-bold leading-tight">{tv.nombre}</span>
                    </button>
                  ))
                )}
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
              <div className="relative flex gap-2 items-center">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    className="w-full pl-4 pr-12 py-4 text-lg md:text-xl font-mono bg-amber-950/20 border-2 border-amber-600/50 rounded-xl focus:outline-none focus:border-amber-500 transition-all text-amber-100 placeholder-amber-900/50 shadow-inner"
                    placeholder="Escanee o escriba..."
                    value={codigoBarraSalida}
                    onChange={(e) => setCodigoBarraSalida(e.target.value)}
                    onKeyDown={handleBuscarTicket}
                  />
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-amber-600/50" />
                </div>
                {/* Botón Cámara — Solo en móvil/tablet */}
                {isMobile && (
                  <button
                    onClick={() => setShowScanner(true)}
                    title="Escanear con cámara del celular"
                    className="flex-shrink-0 flex flex-col items-center justify-center gap-0.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold rounded-xl px-3 py-4 shadow-lg shadow-amber-900/40 transition-all"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-[10px] leading-none">Cámara</span>
                  </button>
                )}
              </div>
            </div>

            {/* Modal escáner de cámara */}
            {showScanner && (
              <BarcodeScanner
                onResult={(codigo) => {
                  efectuarBusqueda(codigo);
                }}
                onClose={() => setShowScanner(false)}
              />
            )}

            {/* Simulación de Desglose de Tarifa */}
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-4 space-y-3">
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                <span className="text-slate-400">Entrada:</span>
                <span className="font-mono text-white text-lg">
                  {ticketEncontrado ? new Date(ticketEncontrado.entrada).toLocaleTimeString() : '--:--:--'}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                <span className="text-slate-400">Salida Local:</span>
                <span className="font-mono text-cyan-400 text-lg">
                  {ticketEncontrado ? new Date(ticketEncontrado.salida).toLocaleTimeString() : reloj}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                <span className="text-slate-400">T. Transcurrido:</span>
                <span className="font-mono font-bold text-amber-400 text-lg flex items-center">
                  <Clock className="w-4 h-4 mr-1"/> {ticketEncontrado ? ticketEncontrado.minutos : '0'} Mins
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-700/80">
                <span className="text-slate-400">Vehículo:</span>
                <span className="text-emerald-400 text-sm uppercase font-bold">
                  {ticketEncontrado ? ticketEncontrado.tipo_vehiculo : '---'}
                </span>
              </div>
            </div>

            {/* Total Cobro Gigante */}
            <div className="mt-auto items-center flex flex-col gap-2">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 w-full rounded-2xl border-2 border-cyan-500/30 p-6 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                  <span className="text-slate-400 text-sm font-semibold mb-1 uppercase tracking-widest">Total a Pagar</span>
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                    $ {ticketEncontrado ? Math.round(ticketEncontrado.total).toLocaleString('es-CL') : '0'}
                  </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full mt-2">
                <button 
                  onClick={() => handlePagar('Efectivo')}
                  disabled={!ticketEncontrado}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all"
                >
                  Efectivo (+ Boleta)
                </button>
                <button 
                  onClick={() => handlePagar('Tarjeta')}
                  disabled={!ticketEncontrado}
                  className="bg-transparent border-2 border-slate-600 hover:border-slate-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all"
                >
                  Cobro Tarjeta
                </button>
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

          <div className="flex-1 overflow-x-auto">
            {loadingGrid ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-cyan-500" />
                <p>Sincronizando con cPanel...</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-[10px] md:text-xs uppercase text-slate-500 sticky top-0 whitespace-nowrap">
                  <tr>
                    <th className="px-3 md:px-4 py-3">Ticket</th>
                    <th className="px-3 md:px-4 py-3">Patente</th>
                    <th className="px-3 md:px-4 py-3">Entrada</th>
                    <th className="px-3 md:px-4 py-3 text-right">Tarifa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-xs md:text-sm whitespace-nowrap">
                  {pendientes.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-6 text-slate-500">No hay autos pendientes</td>
                    </tr>
                  )}
                  {pendientes.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/80 transition-colors cursor-pointer group">
                      <td className="px-3 md:px-4 py-3 text-cyan-400">{p.id}</td>
                      <td className="px-3 md:px-4 py-3">{p.patente || 'S/P'}</td>
                      <td className="px-3 md:px-4 py-3 text-slate-400">{p.entrada}</td>
                      <td className="px-3 md:px-4 py-3 text-right text-emerald-400/70 group-hover:text-emerald-400">{p.tarifaCalc}</td>
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
        <CambiarPassword rut={user.rut} onClose={() => setShowCambiarPass(false)} />
      )}

      {/* TICKET IMPRIMIBLE (OCULTO EN PANTALLA, ACTIVO EN IMPRESORA) */}
      {lastTicket && (
        <div id="ticket-print" className="fixed top-0 left-0 bg-white text-black p-4 w-[58mm] md:w-[80mm] hidden print:block font-mono border border-black shadow-none">
            <div className="text-center mb-2">
                <h1 className="text-sm font-black uppercase leading-tight">{empresa?.ticket_razon_social || 'PARKING SYSTEM'}</h1>
                <div className="flex justify-center my-2">
                    <Car className="w-10 h-10" />
                </div>
                <h2 className="text-[10px] font-bold border-y border-dashed border-black py-1 my-1">TICKET DE INGRESO</h2>
            </div>

            <div className="text-[10px] space-y-1 mb-4">
                <div className="flex justify-between font-bold text-sm">
                    <span>PATENTE:</span>
                    <span>{lastTicket.patente}</span>
                </div>
                <div className="flex justify-between">
                    <span>VEHÍCULO:</span>
                    <span>{lastTicket.tipo_vehiculo}</span>
                </div>
                <div className="flex justify-between">
                    <span>FECHA:</span>
                    <span>{lastTicket.fecha}</span>
                </div>
                <div className="flex justify-between">
                    <span>HORA ENTRADA:</span>
                    <span>{lastTicket.hora}</span>
                </div>
                <div className="flex justify-between border-t border-dotted border-black pt-1 mt-1 text-[8px]">
                    <span>CAJERO:</span>
                    <span>{lastTicket.operador}</span>
                </div>
            </div>

            <div className="flex flex-col items-center mb-4">
                <svg id="barcode-elem" className="w-full h-12"></svg>
                <span className="text-[9px] mt-1 font-bold">{lastTicket.codigo}</span>
            </div>

            <div className="text-center text-[9px] border-t border-dashed border-black pt-2">
                <p className="whitespace-pre-line leading-snug">
                    {empresa?.ticket_observacion || 'Gracias por su preferencia.'}
                </p>
                <div className="mt-4 border-2 border-black inline-block px-4 py-1 font-black text-xs">
                   DOCUMENTO NO VÁLIDO COMO BOLETA
                </div>
            </div>
            
        </div>
      )}

      <style>{`
        @media print {
            body {
                margin: 0;
                padding: 0;
                background: white !important;
            }
            #ticket-print {
                display: block !important;
                position: static !important;
                width: 100% !important;
                max-width: 80mm;
                margin: 0 auto;
                padding: 5mm;
                visibility: visible !important;
            }
            #ticket-print * {
                visibility: visible !important;
            }
            @page {
                margin: 0;
                size: auto;
            }
        }
      `}</style>

    </div>
  );
}
