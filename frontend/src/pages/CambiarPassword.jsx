import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cambiarPassword } from '../services/api';

export default function CambiarPassword({ rut, onClose }) {
  const [claveActual, setClaveActual] = useState('');
  const [claveNueva, setClaveNueva] = useState('');
  const [claveConfirm, setClaveConfirm] = useState('');
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null); // { tipo: 'ok'|'error', texto: '' }

  const fortaleza = () => {
    if (claveNueva.length === 0) return null;
    if (claveNueva.length < 8) return { nivel: 'Débil', color: 'bg-red-500', w: 'w-1/3' };
    if (claveNueva.length < 12 || !/[0-9]/.test(claveNueva)) return { nivel: 'Media', color: 'bg-amber-400', w: 'w-2/3' };
    return { nivel: 'Fuerte', color: 'bg-emerald-400', w: 'w-full' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);

    if (claveNueva !== claveConfirm) {
      setMensaje({ tipo: 'error', texto: 'Las contraseñas nuevas no coinciden.' });
      return;
    }
    if (claveNueva.length < 8) {
      setMensaje({ tipo: 'error', texto: 'La nueva contraseña debe tener al menos 8 caracteres.' });
      return;
    }

    setLoading(true);
    const resp = await cambiarPassword(rut, claveActual, claveNueva);
    setLoading(false);

    if (resp.success) {
      setMensaje({ tipo: 'ok', texto: '¡Contraseña actualizada exitosamente!' });
      setClaveActual(''); setClaveNueva(''); setClaveConfirm('');
    } else {
      setMensaje({ tipo: 'error', texto: resp.message || 'Error al cambiar la contraseña.' });
    }
  };

  const f = fortaleza();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f0f1e] border border-slate-700/50 rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
        {/* Línea decorativa superior */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r from-cyan-500 to-blue-600" />

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Cambiar Contraseña</h2>
            <p className="text-xs text-slate-500">Usuario: <span className="text-cyan-400 font-mono">{rut}</span></p>
          </div>
        </div>

        {/* Mensaje de éxito/error */}
        {mensaje && (
          <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-sm font-medium ${mensaje.tipo === 'ok' ? 'bg-emerald-900/40 border border-emerald-600/50 text-emerald-300' : 'bg-red-900/40 border border-red-600/50 text-red-300'}`}>
            {mensaje.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Clave actual */}
          <div>
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1 block">Contraseña Actual</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                required
                type={showActual ? 'text' : 'password'}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all"
                placeholder="Tu contraseña actual"
                value={claveActual}
                onChange={e => setClaveActual(e.target.value)}
              />
              <button type="button" onClick={() => setShowActual(!showActual)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                {showActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Clave nueva */}
          <div>
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1 block">Nueva Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                required
                type={showNueva ? 'text' : 'password'}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all"
                placeholder="Mínimo 8 caracteres"
                value={claveNueva}
                onChange={e => setClaveNueva(e.target.value)}
              />
              <button type="button" onClick={() => setShowNueva(!showNueva)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                {showNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Barra de fortaleza */}
            {f && (
              <div className="mt-2">
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${f.color} ${f.w}`} />
                </div>
                <p className={`text-xs mt-1 font-semibold ${f.nivel === 'Fuerte' ? 'text-emerald-400' : f.nivel === 'Media' ? 'text-amber-400' : 'text-red-400'}`}>
                  Fortaleza: {f.nivel}
                </p>
              </div>
            )}
          </div>

          {/* Confirmar clave */}
          <div>
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1 block">Confirmar Nueva Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                required
                type="password"
                className={`w-full bg-slate-800/80 border rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none transition-all ${claveConfirm && claveNueva !== claveConfirm ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-cyan-500'}`}
                placeholder="Repite la nueva contraseña"
                value={claveConfirm}
                onChange={e => setClaveConfirm(e.target.value)}
              />
            </div>
            {claveConfirm && claveNueva !== claveConfirm && (
              <p className="text-xs text-red-400 mt-1">Las contraseñas no coinciden</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : 'Actualizar Clave'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
