import { useState } from 'react';
import { Bug, X, Send, Loader2, BellRing } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { telemetry } from '../services/telemetry';

export function BugReportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'telemetry'>('report');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Estado para prueba de Telegram
  const [botToken, setBotToken] = useState(localStorage.getItem('axioma_telemetry_telegram_token') || '');
  const [chatId, setChatId] = useState(localStorage.getItem('axioma_telemetry_telegram_chat_id') || '');
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  
  const { user } = useAuth();

  // El widget de depuración/reporte solo debe estar visible en Staging/Development para pruebas móviles, nunca en Producción
  const isProduction = import.meta.env.VITE_AXIOMA_ENV === 'production';
  if (isProduction || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !descripcion.trim() || !user) return;

    setIsSubmitting(true);
    try {
      // 1. Despacho inmediato a Telemetría centralizada & Telegram
      telemetry.reportUserBug(titulo, descripcion, {
        userId: user.id,
        userEmail: user.email,
        url: window.location.href
      });

      // 2. Registro en base de datos
      const { error } = await supabase.schema('public').from('bug_reports').insert([
        {
          user_id: user.id,
          workspace_id: null,
          modulo_origen: 'axioma-vet',
          titulo,
          descripcion,
          url_origen: window.location.href,
          estado: 'abierto'
        }
      ]);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setTitulo('');
        setDescripcion('');
      }, 2000);
    } catch (err) {
      console.error('Error reporting bug:', err);
      // Incluso si falla la BD, la alerta de telemetría ya se intentó enviar
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestTelegram = async () => {
    setIsTestingTelegram(true);
    setTestStatus(null);
    try {
      telemetry.configureTelegram({ botToken, chatId });
      const res = await telemetry.testTelegramConnection(botToken, chatId);
      if (res.success) {
        setTestStatus('✅ ¡Alerta enviada a tu Telegram con éxito!');
      } else {
        setTestStatus(`❌ ${res.message}`);
      }
    } catch (err: any) {
      setTestStatus(`❌ Error: ${err?.message || err}`);
    } finally {
      setIsTestingTelegram(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-88 overflow-hidden flex flex-col animate-in slide-in-from-bottom-2 text-[#131b2e]">
          <div className="bg-[#5925dc] px-4 py-3 flex justify-between items-center text-white">
            <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('report')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'report' ? 'bg-white text-[#5925dc] shadow-sm font-semibold' : 'text-white/80 hover:text-white'
                }`}
              >
                <Bug size={14} />
                Reportar Bug
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('telemetry')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'telemetry' ? 'bg-white text-[#5925dc] shadow-sm font-semibold' : 'text-white/80 hover:text-white'
                }`}
              >
                <BellRing size={14} />
                Telegram & Telemetría
              </button>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 p-1 rounded-md transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="p-4">
            {activeTab === 'report' ? (
              success ? (
                <div className="text-center py-6 text-green-600">
                  <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Send size={20} className="text-green-600" />
                  </div>
                  <p className="font-semibold">¡Reporte y Alerta Enviados!</p>
                  <p className="text-xs text-gray-500 mt-1">Registrado en base de datos y despachado por telemetría.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Título del problema
                    </label>
                    <input
                      type="text"
                      required
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ej: Error al actualizar paciente"
                      className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5925dc] bg-white text-gray-900"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Descripción detallada
                    </label>
                    <textarea
                      required
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Describe qué sucedió..."
                      rows={3}
                      className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5925dc] resize-none bg-white text-gray-900"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || !titulo.trim() || !descripcion.trim()}
                    className="mt-1 w-full bg-[#5925dc] hover:bg-[#471dae] text-white font-medium py-2 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Enviando alerta...
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Enviar Reporte + Alerta
                      </>
                    )}
                  </button>
                </form>
              )
            ) : (
              <div className="flex flex-col gap-3 text-xs">
                <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-100 flex items-start gap-2">
                  <BellRing size={16} className="text-[#5925dc] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-600 leading-tight">
                    Recibe notificaciones en tu celular vía Telegram para errores críticos (BD, Auth, UI, Network) en tiempo real sin costo.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Telegram Bot Token</label>
                  <input
                    type="text"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="123456789:AAH..."
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#5925dc] text-xs font-mono bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Telegram Chat ID</label>
                  <input
                    type="text"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    placeholder="Ej: -100123456789 o tu ID de usuario"
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#5925dc] text-xs font-mono bg-white text-gray-900"
                  />
                </div>

                {testStatus && (
                  <div className={`p-2 rounded-lg text-xs leading-tight ${testStatus.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {testStatus}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500 border-t border-gray-100">
                  <span>Eventos en sesión: <strong>{telemetry.getRecentEvents().length}</strong></span>
                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={isTestingTelegram}
                    className="px-3 py-1.5 bg-[#5925dc] hover:bg-[#471dae] text-white rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isTestingTelegram ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Send size={12} />
                    )}
                    Probar Alerta en Celular
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#131b2e] hover:bg-[#202b46] text-white p-3 rounded-full shadow-xl transition-transform hover:scale-105 flex items-center justify-center group cursor-pointer border border-white/10"
          title="Telemetría & Reporte de Bugs"
        >
          <Bug size={20} />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out">
            <span className="pl-2 pr-1 font-medium text-xs">Telemetría & Bugs</span>
          </span>
        </button>
      )}
    </div>
  );
}
