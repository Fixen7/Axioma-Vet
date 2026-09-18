import { useState } from 'react';
import { Bug, X, Send, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

export function BugReportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { user } = useAuth();

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !descripcion.trim() || !user) return;

    setIsSubmitting(true);
    try {
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
      alert('Hubo un error al enviar el reporte. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-80 overflow-hidden flex flex-col animate-in slide-in-from-bottom-2">
          <div className="bg-blue-600 px-4 py-3 flex justify-between items-center text-white">
            <h3 className="font-semibold flex items-center gap-2">
              <Bug size={18} />
              Reportar un Bug
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-blue-700 p-1 rounded-md transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="p-4">
            {success ? (
              <div className="text-center py-6 text-green-600">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Send size={20} className="text-green-600" />
                </div>
                <p className="font-medium">¡Reporte enviado!</p>
                <p className="text-sm text-gray-500 mt-1">Gracias por ayudarnos a mejorar.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    required
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej: El botón de guardar no funciona"
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción detallada
                  </label>
                  <textarea
                    required
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Describe los pasos para reproducir el problema..."
                    rows={4}
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    disabled={isSubmitting}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting || !titulo.trim() || !descripcion.trim()}
                  className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Enviar Reporte
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gray-800 hover:bg-gray-900 text-white p-3 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center group"
          title="Reportar un problema"
        >
          <Bug size={24} />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out">
            <span className="pl-2 pr-1 font-medium text-sm">Reportar Bug</span>
          </span>
        </button>
      )}
    </div>
  );
}
