import { Plus, Search, CalendarDays, LogOut, HeartPulse } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVetContext } from '../context/VetContext';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { settings } = useVetContext();
  const { signOut } = useAuth();

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

      {/* Top right floating actions */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-20 flex items-center gap-2">
        <button 
          onClick={() => {
            const coreUrl = import.meta.env.VITE_CORE_URL;
            window.location.href = `${coreUrl}/organization`;
          }} 
          className="p-3 rounded-full bg-surface-container-lowest/50 hover:bg-surface-container shadow-sm hover:shadow text-on-surface-variant hover:text-primary transition-all duration-300 backdrop-blur-md cursor-pointer"
        >
          <span className="text-xs font-semibold px-2">Ajustes</span>
        </button>
        <button 
          onClick={handleSignOut} 
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
            {settings?.doctorName ? `Hola, ${settings.doctorName}` : 'Bienvenido'}
          </h1>
          <p className="font-body-lg text-on-surface-variant max-w-md mx-auto">
            {settings?.clinicName ? `Panel principal de ${settings.clinicName}. ¿Qué haremos hoy?` : 'Tu sistema de gestión clínica veterinaria inteligente.'}
          </p>
        </header>

        {/* Bento Grid Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
          
          {/* Primary Card: Nuevo Paciente (Spans 2 columns on desktop) */}
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
                <h2 className="font-display text-3xl md:text-4xl text-white tracking-tight mb-2">Nuevo Paciente</h2>
                <p className="font-body-md text-white/80 max-w-sm">
                  Registra un nuevo integrante en la clínica y comienza a llevar su historial clínico.
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
                <h2 className="font-headline-lg text-on-surface mb-2">Buscar Paciente</h2>
                <p className="font-body-sm text-on-surface-variant">
                  Accede rápidamente a historiales médicos y evolución de peso.
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
                <h2 className="font-headline-lg text-on-surface mb-2">Próximos Eventos</h2>
                <p className="font-body-sm text-on-surface-variant">
                  Revisa tu agenda y gestiona citas o cirugías agendadas.
                </p>
              </div>
            </div>
          </button>
        </div>
      </main>

    </div>
  );
}
