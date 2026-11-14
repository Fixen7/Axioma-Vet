import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  ShieldCheck, 
  Users, 
  Layers, 
  Zap, 
  Languages, 
  CheckCircle2,
  Info,
  Activity
} from 'lucide-react';
import { useTranslation } from '../i18n';

const STORAGE_KEY = 'axioma_vet_release_notes_v2_seen';

// Blinking expires after ~2 months from launch (Active until January 15, 2027)
const BLINK_EXPIRY_DATE = new Date('2027-01-15T23:59:59Z');

/**
 * Inline trigger button for release notes.
 * Placed inline directly next to the "Ajustes" button without floating overlap.
 */
export function ReleaseNotesButton({ className = '' }: { className?: string }) {
  const [hasUnread, setHasUnread] = useState(false);
  const { lang } = useTranslation();
  const isEs = lang === 'es';

  useEffect(() => {
    const checkSeen = () => {
      try {
        const seen = localStorage.getItem(STORAGE_KEY);
        setHasUnread(!seen);
      } catch {
        setHasUnread(false);
      }
    };
    checkSeen();
    window.addEventListener('axioma-release-notes-status', checkSeen);
    return () => window.removeEventListener('axioma-release-notes-status', checkSeen);
  }, []);

  const isBlinkingActive = hasUnread && (new Date() < BLINK_EXPIRY_DATE);

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('axioma-open-release-notes'));
  };

  return (
    <button
      onClick={handleClick}
      title={isEs ? 'Novedades y Actualizaciones del Sistema' : 'System Updates & What\'s New'}
      aria-label="Ver novedades del sistema"
      className={`relative p-3 rounded-full bg-surface-container-lowest/50 hover:bg-surface-container shadow-sm hover:shadow text-amber-600 hover:text-amber-700 transition-all duration-300 backdrop-blur-md cursor-pointer flex items-center justify-center shrink-0 ${
        isBlinkingActive ? 'ring-2 ring-amber-400/80 animate-pulse' : ''
      } ${className}`}
    >
      <span className="font-extrabold text-sm px-1 leading-none select-none">!</span>

      {/* Pulsing notification indicator (active for 1-2 months) */}
      {hasUnread && (
        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
          {isBlinkingActive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          )}
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
        </span>
      )}
    </button>
  );
}

/**
 * Release Notes Modal Dialog.
 * Auto-pops up once on first visit and re-opens when triggered by ReleaseNotesButton.
 */
export function ReleaseNotesModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { t, lang } = useTranslation();
  const isEs = lang === 'es';

  useEffect(() => {
    // 1. Auto-show on first visit
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore in private browsing
    }
  }, []);

  useEffect(() => {
    // 2. Listen to custom event to re-open from the button
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('axioma-open-release-notes', handleOpen);
    return () => window.removeEventListener('axioma-open-release-notes', handleOpen);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
      window.dispatchEvent(new CustomEvent('axioma-release-notes-status'));
    } catch {
      // Ignore
    }
  };

  const features = [
    {
      icon: <Activity className="w-5 h-5 text-rose-500" />,
      title: isEs ? 'Selector Anatómico Interactivo (Esquema Corporal)' : 'Interactive Anatomy Selector (Body Map)',
      desc: isEs
        ? 'Marca lesiones, puntos de dolor, cirugías y áreas de tratamiento directamente sobre la silueta corporal de caninos y felinos con un solo toque, asociando diagnósticos visuales a la historia médica.'
        : 'Pin lesions, pain points, surgeries, and treatment zones directly onto the interactive body map of canines and felines with a single tap, linking visual findings to the clinical history.',
      tag: isEs ? 'Examen Físico' : 'Physical Exam'
    },
    {
      icon: <Users className="w-5 h-5 text-indigo-500" />,
      title: isEs ? 'Atribución Clínica por Miembro del Equipo' : 'Clinical Attribution by Team Member',
      desc: isEs
        ? 'Ahora cada consulta, vacuna, cirugía y nota médica identifica con nombre y cargo al profesional que realizó o editó el registro, con filtros dedicados en la línea de tiempo.'
        : 'Consultations, vaccines, surgeries, and notes now record the staff member who performed or updated the record, with dedicated timeline filters.',
      tag: isEs ? 'Gestión de Equipo' : 'Team Management'
    },
    {
      icon: <Layers className="w-5 h-5 text-sky-500" />,
      title: isEs ? 'Módulos Clínicos en Ventanas Emergentes' : 'Clinical Modules in Responsive Popups',
      desc: isEs
        ? 'Registra vacunas, desparasitaciones, recetas y cirugías sin perder tu posición en la ficha médica ni recargar la pantalla.'
        : 'Log vaccines, deworming, prescriptions, and surgeries in sleek popups without losing your place in the patient record.',
      tag: isEs ? 'Flujo de Trabajo' : 'Workflow'
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
      title: isEs ? 'Autoguardado y Rescate Clínico Ante Cortes' : 'Autosave & Offline Session Recovery',
      desc: isEs
        ? 'Si se cierra la pestaña o se cae el internet mientras redactas una consulta médica, el sistema protege tu borrador y te permite restaurarlo con un solo toque.'
        : 'If the browser closes or internet drops while typing, your draft is safely protected with one-tap instant recovery.',
      tag: isEs ? 'Seguridad de Datos' : 'Data Safety'
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      title: isEs ? 'Rendimiento Ultra Rápido y Carga Ligera' : 'Lightning-Fast Performance & Low Data',
      desc: isEs
        ? 'Arquitectura modular optimizada para abrir historias clínicas y emitir recetas en menos de un segundo, incluso en tablets y conexiones móviles.'
        : 'Lightweight modular architecture opens patient records and prescriptions in under a second, optimized for mobile and tablets.',
      tag: isEs ? 'Velocidad' : 'Speed'
    },
    {
      icon: <Languages className="w-5 h-5 text-purple-500" />,
      title: isEs ? 'Soporte Bilingüe y Preferencias Automáticas' : 'Bilingual Support & Core Preferences',
      desc: isEs
        ? 'Sincronización instantánea de idioma (Español / English) basada en las preferencias de tu organización en Axioma Core.'
        : 'Instant language synchronization (Spanish / English) tailored to your organization preferences in Axioma Core.',
      tag: isEs ? 'Internacional' : 'Language'
    }
  ];

  if (!isOpen) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 md:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white relative">
          <button
            onClick={handleClose}
            aria-label={t('Cerrar', 'Close')}
            className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEs ? 'Versión Oficial 2.4 — Producción' : 'Official Release 2.4 — Production'}</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {isEs ? '¿Qué hay de nuevo en Axioma Vet?' : 'What\'s new in Axioma Vet?'}
          </h2>
          <p className="text-sm text-slate-300 mt-2 max-w-lg leading-relaxed">
            {isEs
              ? 'Hemos desplegado nuevas funciones clínicas diseñadas para ahorrar tiempo en cada consulta y proteger la información médica de tus pacientes.'
              : 'We have rolled out new clinical capabilities built to save time during consultations and safeguard your patients\' records.'}
          </p>
        </div>

        {/* Features List (Scrollable) */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-4 divide-y divide-slate-100">
          {features.map((feat, idx) => (
            <div key={idx} className={`flex items-start gap-4 ${idx > 0 ? 'pt-4' : ''}`}>
              <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                {feat.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-sm md:text-base font-bold text-slate-900">
                    {feat.title}
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {feat.tag}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 text-center sm:text-left">
            <Info className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              {isEs 
                ? 'Puedes volver a abrir este panel con el botón (!) al lado de Ajustes.'
                : 'You can reopen this panel anytime using the (!) button next to Settings.'}
            </span>
          </div>
          
          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isEs ? 'Entendido y Comenzar' : 'Got it, let\'s start'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
