import { useState, useMemo } from 'react';
import { ArrowLeft, Search, Dog, Cat, Bird, PersonStanding, Phone, Calendar, HeartPulse, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVetContext } from '../context/VetContext';
import type { Patient } from '../services/types';

export default function SearchPatient() {
  const navigate = useNavigate();
  const { patients } = useVetContext();
  const [query, setQuery] = useState('');

  const filteredPatients = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return patients;
    return patients.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.ownerName.toLowerCase().includes(q) ||
      p.ownerPhone.includes(q) ||
      (p.ownerId && p.ownerId.includes(q))
    );
  }, [query, patients]);

  const getSpeciesIcon = (species: string) => {
    const s = species.toLowerCase();
    if (s.includes('perro')) return <Dog className="w-8 h-8" />;
    if (s.includes('gato')) return <Cat className="w-8 h-8" />;
    if (s.includes('ave') || s.includes('loro')) return <Bird className="w-8 h-8" />;
    return <HeartPulse className="w-8 h-8" />; // Default fallback
  };

function PatientCard({ patient, navigate, getSpeciesIcon }: { patient: Patient, navigate: (path: string) => void, getSpeciesIcon: (species: string) => React.ReactNode }) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  
  const isDeceased = patient.status === 'DECEASED';

  let statusColor = 'bg-green-500';
  let statusBg = 'bg-surface-container-high';
  let statusText = 'text-on-surface-variant';
  let statusLabel = 'NORMAL';

  if (patient.status === 'PRECAUTION') {
    statusColor = 'bg-yellow-500';
    statusBg = 'bg-yellow-100';
    statusText = 'text-yellow-800';
    statusLabel = 'PRECAUCIÓN';
  } else if (patient.status === 'HIGH_RISK') {
    statusColor = 'bg-red-500';
    statusBg = 'bg-red-100';
    statusText = 'text-red-800';
    statusLabel = 'ALTO RIESGO';
  } else if (isDeceased) {
    statusColor = 'bg-outline-variant';
    statusBg = 'bg-surface-container-high';
    statusText = 'text-on-surface-variant';
    statusLabel = 'FALLECIDO';
  }

  const toggleTooltip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTooltipOpen(!isTooltipOpen);
  };

  if (isDeceased) {
    return (
      <article 
        className={`relative flex flex-col bg-surface-container-lowest rounded-[24px] overflow-visible shadow-md border border-surface-container-high grayscale opacity-75 group cursor-pointer ${isTooltipOpen ? 'z-50' : 'z-10 hover:z-50'}`}
      >
        <button 
          onClick={toggleTooltip}
          className={`h-6 w-full ${statusColor} rounded-t-[24px] relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center justify-center transition-colors hover:brightness-110`}
          aria-label="Ver notas del paciente"
        >
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest flex items-center gap-1 drop-shadow-md">
            <Info className="w-3 h-3" /> Notas
          </span>
          {/* Tooltip for Deceased */}
          <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[280px] md:max-w-sm transition-all duration-200 z-50 pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible ${isTooltipOpen ? '!opacity-100 !visible' : ''}`}>
            <div className="bg-surface-container-lowest text-on-surface shadow-2xl rounded-2xl p-4 border-2 border-surface-container-high flex flex-col gap-2 text-left">
              <div className={`text-sm font-bold uppercase tracking-wider ${statusText}`}>
                {statusLabel}
              </div>
              {patient.deceasedReason && (
                <p className="text-sm m-0 text-on-surface-variant font-body-sm">
                  {patient.deceasedReason}
                </p>
              )}
              {patient.behaviorObservation && (
                <p className="text-sm m-0 text-on-surface-variant font-body-sm mt-1 border-t border-outline-variant pt-2">
                  Notas previas: {patient.behaviorObservation}
                </p>
              )}
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] border-[8px] border-transparent border-t-surface-container-high"></div>
          </div>
        </button>
        <div 
          onClick={() => navigate(`/patient/${patient.id}`)}
          className="p-6 flex flex-col gap-6 rounded-b-[24px] overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline">
                {getSpeciesIcon(patient.species)}
              </div>
              <div>
                <h3 className="font-headline-lg text-on-surface m-0">{patient.name}</h3>
                <p className="font-label-md text-outline m-0">{patient.species} {patient.breed ? `• ${patient.breed}` : ''}</p>
              </div>
            </div>
            <div className={`px-3 py-1 ${statusBg} ${statusText} rounded-full font-label-sm uppercase tracking-wide`}>
              {statusLabel}
            </div>
          </div>
          <div className="w-full h-px bg-surface-variant"></div>
          <div className="flex flex-col gap-1">
            <span className="font-label-sm text-outline uppercase tracking-wider">Fallecimiento</span>
            <span className="font-body-md text-on-surface flex items-center gap-2">
              <Calendar className="w-5 h-5 text-outline" />
              {patient.deceasedDate || 'Fecha no registrada'}
            </span>
          </div>
          <button className="w-full py-3 mt-2 rounded-xl bg-surface-container-low text-outline font-label-md hover:bg-surface-container transition-colors border border-outline-variant">
            Ver Histórico
          </button>
        </div>
      </article>
    );
  }

  return (
    <article 
      className={`relative flex flex-col bg-surface-container-lowest rounded-[24px] overflow-visible shadow-[0_4px_20px_-4px_rgba(109,40,217,0.1)] hover:shadow-[0_10px_30px_-5px_rgba(109,40,217,0.2)] transition-all duration-300 border border-surface-container-high group cursor-pointer ${isTooltipOpen ? 'z-50' : 'z-10 hover:z-50'}`}
    >
      <button 
        onClick={toggleTooltip}
        className={`h-6 w-full ${statusColor} rounded-t-[24px] relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center justify-center transition-colors hover:brightness-110`}
        aria-label="Ver notas del paciente"
      >
        <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest flex items-center gap-1 drop-shadow-md">
          <Info className="w-3 h-3" /> Notas
        </span>
        {/* Custom Tooltip */}
        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[280px] md:max-w-sm transition-all duration-200 z-50 pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible ${isTooltipOpen ? '!opacity-100 !visible' : ''}`}>
          <div className="bg-surface-container-lowest text-on-surface shadow-2xl rounded-2xl p-4 border-2 border-surface-container-high flex flex-col gap-2 text-left">
            <div className={`text-sm font-bold uppercase tracking-wider ${statusText}`}>
              {statusLabel}
            </div>
            {patient.behaviorObservation ? (
              <p className="text-sm m-0 text-on-surface-variant font-body-sm">
                {patient.behaviorObservation}
              </p>
            ) : (
              <p className="text-sm m-0 text-on-surface-variant font-body-sm italic opacity-75">
                Sin observaciones adicionales
              </p>
            )}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] border-[8px] border-transparent border-t-surface-container-high"></div>
        </div>
      </button>
      <div 
        onClick={() => navigate(`/patient/${patient.id}`)}
        className="p-6 flex flex-col gap-6 rounded-b-[24px] overflow-hidden"
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary">
              {getSpeciesIcon(patient.species)}
            </div>
            <div>
              <h3 className="font-headline-lg text-on-surface m-0">{patient.name}</h3>
              <p className="font-label-md text-outline m-0">{patient.species} {patient.breed ? `• ${patient.breed}` : ''}</p>
            </div>
          </div>
          <div className={`px-3 py-1 ${statusBg} ${statusText} rounded-full font-label-sm uppercase tracking-wide`}>
            {statusLabel}
          </div>
        </div>
        <div className="w-full h-px bg-surface-variant"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-label-sm text-outline uppercase tracking-wider">Dueño</span>
            <span className="font-body-md text-on-surface flex items-center gap-2 truncate">
              <PersonStanding className="w-5 h-5 text-outline shrink-0" />
              <span className="truncate">{patient.ownerName}</span>
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-label-sm text-outline uppercase tracking-wider">Contacto</span>
            <span className="font-body-md text-on-surface flex items-center gap-2">
              <Phone className="w-5 h-5 text-outline shrink-0" />
              <span className="truncate">{patient.ownerPhone}</span>
            </span>
          </div>
        </div>
        <button className="w-full py-3 mt-2 rounded-xl bg-surface-container text-primary font-label-md group-hover:bg-primary group-hover:text-on-primary transition-colors">
          Ver expediente
        </button>
      </div>
    </article>
  );
}

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col items-center p-4 md:p-container-padding antialiased">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-surface-container-high via-background to-background"></div>
      
      <header className="relative z-10 w-full max-w-7xl flex items-center justify-between mb-6 md:mb-12">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary font-label-md hover:text-primary-container transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>
        <div className="font-headline-md text-on-background cursor-default">
          Axioma Vet
        </div>
        <div className="w-20"></div>
      </header>

      <main className="relative z-10 w-full max-w-7xl flex flex-col items-center gap-12">
        <div className="w-full max-w-3xl flex flex-col items-center gap-6">
          <h1 className="font-display text-4xl md:text-display text-on-background tracking-tighter text-center m-0">
            Buscar paciente
          </h1>
          <div className="w-full relative group">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Search className="text-outline w-8 h-8 group-focus-within:text-primary transition-colors" />
            </div>
            <input 
              autoFocus 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-surface-container-lowest text-on-surface font-body-lg h-14 md:h-20 pl-14 md:pl-20 pr-6 rounded-full border-2 border-outline-variant outline-none transition-all duration-300 hover:border-outline focus:border-primary shadow-[0_8px_30px_-10px_rgba(109,40,217,0.15)] placeholder:text-outline-variant" 
              placeholder="Nombre, dueño, teléfono, identificación..." 
              type="text" 
            />
          </div>
        </div>

        <div className="w-full flex items-center justify-between mt-4">
          <h2 className="font-headline-md text-on-surface-variant m-0">
            {query ? `Resultados para "${query}"` : 'Todos los pacientes'} 
            <span className="font-body-md text-outline ml-2">({filteredPatients.length})</span>
          </h2>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="w-full py-12 flex flex-col items-center justify-center text-outline">
            <Search className="w-16 h-16 mb-4 opacity-50" />
            <p className="font-headline-md m-0">No se encontraron pacientes.</p>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPatients.map(patient => (
              <PatientCard 
                key={patient.id} 
                patient={patient} 
                navigate={navigate} 
                getSpeciesIcon={getSpeciesIcon} 
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
