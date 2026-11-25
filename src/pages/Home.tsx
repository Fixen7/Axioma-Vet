import { useState, useEffect } from 'react';
import { Plus, Search, CalendarDays, LogOut, HeartPulse, FileSpreadsheet, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVetContext } from '../context/VetContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n';
import { ReleaseNotesButton } from '../components/ReleaseNotesModal';
import { ExcelMigrationModal } from '../components/patient/ExcelMigrationModal';
import { NotificationSettingsModal } from '../components/NotificationSettingsModal';
import { loadTelegramNotificationConfig } from '../services/vetTelegramNotificationService';

export default function Home() {
  const navigate = useNavigate();
  const { settings } = useVetContext();
  const { signOut, activeWorkspaceId } = useAuth();
  const { t } = useTranslation();
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isTelegramEnabled, setIsTelegramEnabled] = useState(false);

  useEffect(() => {
    const cfg = loadTelegramNotificationConfig(activeWorkspaceId);
    setIsTelegramEnabled(cfg.enabled && !!cfg.chatId);
  }, [activeWorkspaceId, isNotifModalOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col items-center justify-center p-4 md:p-8 antialiased overflow-hidden relative">
      {/* Animated Mesh / Glowing Orbs Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Top right actions (non-overlapping inline flex) */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-20 flex items-center gap-2">
        <ReleaseNotesButton />
        <button 
          onClick={() => setIsNotifModalOpen(true)}
          title={t('Notificaciones en Telegram', 'Telegram Notifications')}
          aria-label="Abrir notificaciones en Telegram"
          className="relative p-3 rounded-full bg-surface-container-lowest/50 hover:bg-blue-500/10 shadow-sm hover:shadow text-on-surface-variant hover:text-blue-600 transition-all duration-300 backdrop-blur-md cursor-pointer flex items-center justify-center"
        >
          <Bell className="w-5 h-5 text-blue-600" />
          {isTelegramEnabled && (
            <span 
              title={t('Notificaciones activas', 'Notifications active')}
              className="absolute top-2 right-2 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" 
            />
          )}
        </button>
        <button 
          onClick={() => setIsExcelModalOpen(true)} 
          title={t('Copia de Seguridad y Migración Excel', 'Backup & Excel Migration')}
          className="p-3 rounded-full bg-surface-container-lowest/50 hover:bg-emerald-500/10 shadow-sm hover:shadow text-on-surface-variant hover:text-emerald-700 transition-all duration-300 backdrop-blur-md cursor-pointer flex items-center gap-1.5"
        >
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-semibold pr-1 hidden sm:inline">{t('Datos / Excel', 'Data / Excel')}</span>
        </button>
        <button 
          onClick={() => {
            const coreUrl = import.meta.env.VITE_CORE_URL;
            window.location.href = `${coreUrl}/organization`;
          }} 
          className="p-3 rounded-full bg-surface-container-lowest/50 hover:bg-surface-container shadow-sm hover:shadow text-on-surface-variant hover:text-primary transition-all duration-300 backdrop-blur-md cursor-pointer"
        >
          <span className="text-xs font-semibold px-2">{t('Ajustes', 'Settings')}</span>
        </button>
        <button 
          onClick={handleSignOut} 
          title={t('Cerrar sesión', 'Sign out')}
          className="p-3 rounded-full bg-surface-container-lowest/50 hover:bg-red-500/10 shadow-sm hover:shadow text-on-surface-variant hover:text-red-500 transition-all duration-300 backdrop-blur-md cursor-pointer"
        >
          <LogOut className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>
      
      <main className="relative z-10 w-full max-w-4xl flex flex-col gap-10 md:gap-14 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header / Greeting */}
        <header className="flex flex-col items-start md:items-center text-left md:text-center w-full gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-label-md mb-2 shadow-sm border border-primary/20">
            <HeartPulse className="w-4 h-4" /> Axioma Vet
          </div>
          <h1 className="font-display text-4xl md:text-display text-on-background tracking-tighter cursor-default">
            {settings?.doctorName ? t(`Hola, ${settings.doctorName}`, `Hello, ${settings.doctorName}`) : t('Bienvenido', 'Welcome')}
          </h1>
          <p className="font-body-lg text-on-surface-variant max-w-md mx-auto">
            {settings?.clinicName
              ? t(`Panel principal de ${settings.clinicName}. ¿Qué haremos hoy?`, `Main dashboard for ${settings.clinicName}. What shall we do today?`)
              : t('Tu sistema de gestión clínica veterinaria inteligente.', 'Your smart veterinary clinical management system.')}
          </p>
        </header>

        {/* Bento Grid Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
          
          {/* Primary Card: Nuevo Paciente */}
          <button
            onClick={() => navigate('/patient/new')}
            className="md:col-span-2 group relative overflow-hidden rounded-[32px] bg-gradient-to-br from-primary to-primary-container p-8 md:p-12 text-left shadow-[0_8px_30px_-10px_rgba(109,40,217,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(109,40,217,0.6)] transition-all duration-500 hover:-translate-y-1 outline-none focus-visible:ring-4 ring-primary-container cursor-pointer"
          >
            <div className="absolute right-[-10%] bottom-[-20%] opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700 pointer-events-none">
              <Plus className="w-64 h-64 text-white" />
            </div>
            <div className="relative z-10 flex flex-col items-start gap-4 h-full justify-between">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <div className="mt-4 md:mt-8">
                <h2 className="font-display text-3xl md:text-4xl text-white tracking-tight mb-2">
                  {t('Nuevo Paciente', 'New Patient')}
                </h2>
                <p className="font-body-md text-white/80 max-w-sm">
                  {t(
                    'Registra un nuevo integrante en la clínica y comienza a llevar su historial clínico.',
                    'Register a new patient in the clinic and start keeping their clinical record.'
                  )}
                </p>
              </div>
            </div>
          </button>

          {/* Secondary Card 1: Buscar Paciente */}
          <button
            onClick={() => navigate('/patient/search')}
            className="group relative overflow-hidden rounded-[32px] bg-surface-container-lowest/80 backdrop-blur-xl border border-surface-container-high p-8 text-left shadow-lg hover:shadow-xl hover:border-outline-variant transition-all duration-500 hover:-translate-y-1 outline-none focus-visible:ring-2 ring-primary cursor-pointer"
          >
            <div className="absolute right-[-5%] bottom-[-5%] opacity-5 group-hover:opacity-10 group-hover:-rotate-12 transition-all duration-500 pointer-events-none">
              <Search className="w-40 h-40 text-primary" />
            </div>
            <div className="relative z-10 flex flex-col items-start gap-4 h-full justify-between">
              <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 shadow-sm">
                <Search className="w-6 h-6" />
              </div>
              <div className="mt-4 md:mt-12">
                <h2 className="font-headline-lg text-on-surface mb-2">
                  {t('Buscar Paciente', 'Search Patient')}
                </h2>
                <p className="font-body-sm text-on-surface-variant">
                  {t(
                    'Accede rápidamente a historiales médicos y evolución de peso.',
                    'Quickly access medical records and weight history.'
                  )}
                </p>
              </div>
            </div>
          </button>

          {/* Secondary Card 2: Eventos */}
          <button
            onClick={() => navigate('/events')}
            className="group relative overflow-hidden rounded-[32px] bg-surface-container-lowest/80 backdrop-blur-xl border border-surface-container-high p-8 text-left shadow-lg hover:shadow-xl hover:border-outline-variant transition-all duration-500 hover:-translate-y-1 outline-none focus-visible:ring-2 ring-primary cursor-pointer"
          >
            <div className="absolute right-[-5%] bottom-[-5%] opacity-5 group-hover:opacity-10 group-hover:rotate-12 transition-all duration-500 pointer-events-none">
              <CalendarDays className="w-40 h-40 text-primary" />
            </div>
            <div className="relative z-10 flex flex-col items-start gap-4 h-full justify-between">
              <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 shadow-sm">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div className="mt-4 md:mt-12">
                <h2 className="font-headline-lg text-on-surface mb-2">
                  {t('Próximos Eventos', 'Upcoming Events')}
                </h2>
                <p className="font-body-sm text-on-surface-variant">
                  {t(
                    'Revisa tu agenda y gestiona citas o cirugías agendadas.',
                    'Review your schedule and manage appointments or scheduled surgeries.'
                  )}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Quick Bar: Centro de Datos y Excel */}
        <div className="w-full p-4 sm:p-5 rounded-[28px] bg-surface-container-lowest/80 backdrop-blur-xl border border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-inner">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base text-on-surface m-0">
                {t('Respaldo y Migración en Excel', 'Excel Backup & Migration')}
              </p>
              <p className="text-xs text-on-surface-variant m-0 mt-0.5">
                {t('Exporta tu historial clínico completo a .xlsx o migra pacientes desde hojas de cálculo.', 'Export your complete clinic history to .xlsx or migrate patients from spreadsheets.')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t('Abrir Centro Excel', 'Open Excel Center')}</span>
          </button>
        </div>
      </main>

      <ExcelMigrationModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
      />

      <NotificationSettingsModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
      />
    </div>
  );
}
