import React, { useState } from 'react';
import { CarFront, Lock, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { loginUsuario } = await import('../services/api');
      const response = await loginUsuario(rut, password);
      
      if (response.success) {
        // Guardamos la sesión localmente para que la API pueda usar los IDs
        localStorage.setItem('autoticket_user', JSON.stringify(response));
        
        navigate('/caseta');
      } else {
        alert('Credenciales incorrectas');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-blue-950/20 to-slate-950 flex flex-col items-center justify-center text-slate-100 p-4 relative overflow-hidden">
      {/* Background decoration elements (SaaS Premium Feel) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-screen filter blur-[128px] opacity-20"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-700 rounded-full mix-blend-screen filter blur-[128px] opacity-10"></div>
      </div>

      {/* Login Card */}
      <div className="z-10 w-full max-w-md relative">
        <div className="p-10 rounded-3xl w-full border border-slate-700/50 shadow-[0_0_50px_rgba(37,99,235,0.1)] relative overflow-hidden text-center bg-slate-900/60 backdrop-blur-xl">
            
            {/* Top accent line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-600"></div>

            <div className="mx-auto bg-gradient-to-br from-blue-900/60 to-slate-800 p-4 rounded-2xl w-24 h-24 flex items-center justify-center mb-6 shadow-inner border border-blue-500/20">
                <CarFront className="w-12 h-12 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
            </div>

            <h1 className="text-3xl font-bold mb-2 tracking-tight">Auto<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Ticket</span> SaaS</h1>
            <p className="text-slate-400 text-sm mb-8 font-medium">Panel Administrativo y de Control</p>

            <form className="space-y-5" onSubmit={handleLogin}>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                        <User className="w-5 h-5" />
                    </div>
                    <input 
                        type="text" 
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-800/80 border border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all placeholder-slate-500 text-slate-100 font-medium"
                        placeholder="RUT / ID Empleado"
                        value={rut}
                        onChange={(e) => setRut(e.target.value)}
                    />
                </div>

                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                        <Lock className="w-5 h-5" />
                    </div>
                    <input 
                        type="password" 
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-800/80 border border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all placeholder-slate-500 text-slate-100 font-medium"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] transform hover:-translate-y-0.5 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'AUTENTICANDO...' : 'INICIAR SESIÓN'}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
            </form>
            
            <div className="mt-8 text-center border-t border-slate-800 pt-6">
                <p className="text-slate-500 text-xs flex justify-center items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Sistema Multi-tenant Online
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
