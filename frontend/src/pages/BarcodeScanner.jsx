import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library';
import { X, Camera, RefreshCw, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

/**
 * BarcodeScanner – Modal para escanear código de barras CODE128 con la cámara.
 *
 * Estrategia de decodificación:
 *  1. Se abre el stream con getUserMedia (cámara trasera, alta resolución).
 *  2. Cada 200 ms se captura un frame en un <canvas> oculto.
 *  3. Se llama a reader.decodeFromCanvas(canvas) — esto SÍ funciona de forma
 *     estable en Android porque el frame ya está en memoria.
 *  4. Si no hay código en el frame → se reintenta en el siguiente tick.
 */
export default function BarcodeScanner({ onResult, onClose }) {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const scanningRef = useRef(false);
  const rafRef      = useRef(null);
  const readerRef   = useRef(null);

  const [status,     setStatus]     = useState('init'); // init|loading|scanning|success|error
  const [errorMsg,   setErrorMsg]   = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [cameras,    setCameras]    = useState([]);
  const [cameraIndex, setCameraIndex] = useState(0);

  // ─── Crea el lector ZXing con hints para formatos comunes de ticket ──────────
  const buildReader = () => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.QR_CODE,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    return new BrowserMultiFormatReader(hints);
  };

  // ─── Detiene todo ────────────────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    scanningRef.current = false;
    if (rafRef.current) clearTimeout(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // ─── Loop: captura frame → decodifica ───────────────────────────────────────
  const scanLoop = useCallback(() => {
    if (!scanningRef.current) return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      // Video todavía no tiene datos; esperar un poco más
      rafRef.current = setTimeout(scanLoop, 150);
      return;
    }

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) {
      rafRef.current = setTimeout(scanLoop, 150);
      return;
    }

    // Dibujar el frame actual en el canvas oculto
    canvas.width  = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, vw, vh);

    try {
      const result = readerRef.current.decodeFromCanvas(canvas);
      if (result && scanningRef.current) {
        const code = result.getText();
        scanningRef.current = false;
        setLastResult(code);
        setStatus('success');
        if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
        setTimeout(() => {
          onResult(code);
          stopAll();
          onClose();
        }, 700);
        return;
      }
    } catch (err) {
      // NotFoundException → no hay código visible, es normal, ignorar
      if (!(err instanceof NotFoundException)) {
        console.warn('[BarcodeScanner] decode error:', err?.name, err?.message);
      }
    }

    // Reintentar en 200 ms
    if (scanningRef.current) {
      rafRef.current = setTimeout(scanLoop, 200);
    }
  }, [onResult, onClose, stopAll]);

  // ─── Abre la cámara ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async (devId) => {
    stopAll();
    setStatus('loading');
    setErrorMsg('');
    readerRef.current = buildReader();

    // Constraints: preferir cámara trasera, alta resolución
    const videoConstraints = devId
      ? { deviceId: { exact: devId }, width: { ideal: 1280 }, height: { ideal: 720 } }
      : {
          facingMode: { ideal: 'environment' },
          width:  { ideal: 1280 },
          height: { ideal: 720 },
        };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true'); // crucial iOS
      video.muted = true;

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = reject;
        setTimeout(reject, 8000); // timeout de seguridad
      });

      await video.play();

      scanningRef.current = true;
      setStatus('scanning');
      scanLoop();
    } catch (e) {
      console.error('[BarcodeScanner] Camera error:', e.name, e.message);
      let msg = 'No se pudo acceder a la cámara.';
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        msg = 'Permiso de cámara denegado.\n\nVaya a Configuración del navegador → Permisos del sitio → Cámara → Permitir.';
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        msg = 'No se encontró cámara disponible en este dispositivo.';
      } else if (e.name === 'NotReadableError' || e.name === 'TrackStartError') {
        msg = 'La cámara está en uso por otra app. Ciérrela e intente de nuevo.';
      } else if (e.name === 'OverconstrainedError') {
        if (devId) return startCamera(null); // retry sin constraint de deviceId
        // retry sin resolución alta
        return startCamera_lowres(null);
      }
      setErrorMsg(msg);
      setStatus('error');
    }
  }, [stopAll, scanLoop]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fallback: si falla OverconstrainedError sin deviceId
  const startCamera_lowres = useCallback(async (devId) => {
    stopAll();
    setStatus('loading');
    setErrorMsg('');
    readerRef.current = buildReader();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: devId ? { deviceId: { exact: devId } } : true,
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.muted = true;
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = reject;
        setTimeout(reject, 8000);
      });
      await video.play();
      scanningRef.current = true;
      setStatus('scanning');
      scanLoop();
    } catch (e) {
      setErrorMsg('No se pudo acceder a la cámara: ' + e.message);
      setStatus('error');
    }
  }, [stopAll, scanLoop]);

  // ─── Inicialización: pedir permisos y listar cámaras ────────────────────────
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Primer getUserMedia → dispara el diálogo de permisos en Android
        const tempStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        tempStream.getTracks().forEach(t => t.stop());

        if (!mounted) return;

        // Listar cámaras (ya tenemos permiso)
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoCams = devices.filter(d => d.kind === 'videoinput');

        if (mounted && videoCams.length > 0) {
          setCameras(videoCams);
          // Preferir cámara marcada como trasera
          const backIdx = videoCams.findIndex(d =>
            /back|trasera|rear|environment|0/i.test(d.label)
          );
          const idx = backIdx >= 0 ? backIdx : videoCams.length - 1;
          setCameraIndex(idx);
          if (mounted) await startCamera(videoCams[idx].deviceId);
        } else {
          if (mounted) await startCamera(null);
        }
      } catch (_) {
        if (mounted) await startCamera(null);
      }
    };

    init();
    return () => { mounted = false; stopAll(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Cambiar cámara ──────────────────────────────────────────────────────────
  const handleSwitchCamera = async () => {
    if (cameras.length <= 1) return;
    const nextIdx = (cameraIndex + 1) % cameras.length;
    setCameraIndex(nextIdx);
    await startCamera(cameras[nextIdx].deviceId);
  };

  const handleClose = () => { stopAll(); onClose(); };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="relative bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col"
        style={{ maxHeight: '92dvh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500/20 p-1.5 rounded-lg">
              <Camera className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">Billete de Escanear</span>
              <p className="text-[10px] text-slate-400 leading-tight">Apunte el código de barras a la cámara</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visor cámara */}
        <div
          className="relative bg-black flex items-center justify-center overflow-hidden"
          style={{ height: '56vw', maxHeight: '310px', minHeight: '200px' }}
        >
          {/* Video — siempre en DOM para que videoRef sea válido */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: (status === 'scanning' || status === 'success') ? 1 : 0 }}
            autoPlay
            playsInline
            muted
          />

          {/* Canvas oculto para captura de frames */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Cargando */}
          {(status === 'init' || status === 'loading') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950">
              <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
              <span className="text-slate-400 text-sm">Iniciando cámara...</span>
            </div>
          )}

          {/* Marco de escaneo animado */}
          {status === 'scanning' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Vignette lateral para guiar encuadre */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.55) 100%)'
              }} />
              {/* Recuadro guía */}
              <div className="relative w-64 h-28 z-10">
                <span className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-amber-400 rounded-tl" />
                <span className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-amber-400 rounded-tr" />
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-amber-400 rounded-bl" />
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-amber-400 rounded-br" />
                {/* Línea de escaneo */}
                <div
                  className="absolute left-1 right-1 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent"
                  style={{
                    boxShadow: '0 0 8px rgba(251,191,36,0.9)',
                    animation: 'scanLine 1.8s ease-in-out infinite',
                  }}
                />
              </div>
              <div className="absolute bottom-3 left-0 right-0 text-center">
                <span className="text-[11px] text-white/80 bg-black/50 px-3 py-1 rounded-full">
                  Centre el código de barras en el recuadro
                </span>
              </div>
            </div>
          )}

          {/* Éxito */}
          {status === 'success' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-900/90 gap-2">
              <CheckCircle2 className="w-14 h-14 text-emerald-300" style={{ animation: 'popIn 0.3s ease-out both' }} />
              <span className="text-emerald-200 font-bold text-sm">¡Código detectado!</span>
              <span className="text-white font-mono text-sm bg-black/30 px-3 py-1 rounded-lg mt-1">{lastResult}</span>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/98 p-6 text-center gap-4">
              <AlertTriangle className="w-10 h-10 text-amber-400 flex-shrink-0" />
              <p className="text-amber-300 text-xs font-medium leading-relaxed whitespace-pre-line">{errorMsg}</p>
              <button
                onClick={() => startCamera(cameras[cameraIndex]?.deviceId ?? null)}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Reintentar
              </button>
            </div>
          )}
        </div>

        {/* Controles */}
        <div className="px-4 py-3 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between">
          <div>
            {status === 'scanning' && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Buscando código...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {cameras.length > 1 && status === 'scanning' && (
              <button
                onClick={handleSwitchCamera}
                className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-300 px-3 py-2 rounded-lg transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Voltear
              </button>
            )}
            <button
              onClick={handleClose}
              className="text-xs bg-slate-700 hover:bg-red-600/30 hover:text-red-300 active:scale-95 text-slate-300 px-4 py-2 rounded-lg transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0%   { top: 4px;  opacity: 0.6; }
          50%  { top: calc(100% - 6px); opacity: 1; }
          100% { top: 4px;  opacity: 0.6; }
        }
        @keyframes popIn {
          0%   { transform: scale(0.3); opacity: 0; }
          70%  { transform: scale(1.15); }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
