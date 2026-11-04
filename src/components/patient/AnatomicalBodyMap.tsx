import { useState, useEffect, useMemo } from 'react';
import { Activity, ChevronDown, ChevronUp, Dog, Cat, MapPin, Calendar, Stethoscope, Scissors } from 'lucide-react';
import type { Patient, Consultation } from '../../services/types';
import { 
  getCustomAnatomyPoints, 
  type CustomAnatomicalPoint, 
  type PointSeverity,
  QUADRANT_LABELS 
} from '../../utils/customAnatomyPoints';
import { formatLocalDate } from '../../utils/date';

interface AnatomicalBodyMapProps {
  patient: Patient;
  consultations: Consultation[];
}

export function AnatomicalBodyMap({ patient }: AnatomicalBodyMapProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Detección de especie: Canino vs Felino
  const isDefaultFeline = useMemo(() => {
    const s = (patient.species || '').toLowerCase();
    return s.includes('gato') || s.includes('felin') || s.includes('cat');
  }, [patient.species]);

  const [activeSpeciesView, setActiveSpeciesView] = useState<'canine' | 'feline'>(
    isDefaultFeline ? 'feline' : 'canine'
  );

  useEffect(() => {
    setActiveSpeciesView(isDefaultFeline ? 'feline' : 'canine');
  }, [isDefaultFeline, patient.id]);

  // Cargar todos los puntos registrados en consultas y cirugías
  const [points, setPoints] = useState<CustomAnatomicalPoint[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  useEffect(() => {
    const loaded = getCustomAnatomyPoints(patient.id);
    setPoints(loaded);
    setSelectedPointId(null);
  }, [patient.id]);

  const selectedPoint = useMemo(() => {
    return points.find(p => p.id === selectedPointId) || null;
  }, [points, selectedPointId]);

  const activeProblemsCount = points.filter(p => p.type === 'problem').length;

  const getPinColor = (type: PointSeverity) => {
    switch (type) {
      case 'problem':
        return {
          bg: 'bg-red-500',
          border: 'border-white',
          text: 'text-white',
          ping: 'bg-red-500/40',
          badge: 'bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-300'
        };
      case 'observation':
        return {
          bg: 'bg-primary',
          border: 'border-white',
          text: 'text-white',
          ping: 'bg-primary/40',
          badge: 'bg-primary/10 text-primary'
        };
      case 'resolved':
        return {
          bg: 'bg-emerald-500',
          border: 'border-white',
          text: 'text-white',
          ping: 'bg-emerald-500/40',
          badge: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
        };
    }
  };

  const currentImage = activeSpeciesView === 'feline' 
    ? '/anatomy-feline.jpg' 
    : '/anatomy-canine.jpg';

  return (
    <div className="w-full rounded-[28px] bg-surface-container-lowest/80 backdrop-blur-xl border border-surface-container-high shadow-sm overflow-hidden transition-all duration-300">
      
      {/* HEADER BENTO (SOLO LECTURA) */}
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-surface-container-high/20 transition-colors select-none border-b border-surface-container-high/60"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-headline-sm text-base md:text-lg text-on-surface m-0 font-bold">
                Esquema Anatómico del Paciente
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-surface-container-high text-outline">
                Informativo
              </span>
              {activeProblemsCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-300 text-[11px] font-bold">
                  {activeProblemsCount} {activeProblemsCount === 1 ? 'dolencia activa' : 'dolencias activas'}
                </span>
              ) : points.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-bold">
                  {points.length} {points.length === 1 ? 'zona registrada' : 'zonas registradas'}
                </span>
              ) : null}
            </div>
            <p className="text-xs text-on-surface-variant m-0 mt-0.5">
              Resumen visual de cuadrantes y zonas documentadas en consultas o cirugías
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Conmutador de Especie Canino / Felino */}
          <div 
            onClick={e => e.stopPropagation()} 
            className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/40"
          >
            <button
              type="button"
              onClick={() => setActiveSpeciesView('canine')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSpeciesView === 'canine' 
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-bold' 
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              <Dog className="w-3.5 h-3.5" /> Canino
            </button>
            <button
              type="button"
              onClick={() => setActiveSpeciesView('feline')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSpeciesView === 'feline' 
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-bold' 
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              <Cat className="w-3.5 h-3.5" /> Felino
            </button>
          </div>

          <button 
            type="button"
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-xl hover:bg-surface-container transition-colors"
            aria-label={isExpanded ? 'Colapsar mapa' : 'Expandir mapa'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* CONTENIDO DEL MAPA BENTO */}
      {isExpanded && (
        <div className="p-6 flex flex-col gap-5">
          
          <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-between">
            
            {/* ÁREA DE VISUALIZACIÓN DE LA SILUETA (SOLO LECTURA) */}
            <div className="flex flex-col items-center w-full max-w-[440px]">
              <div className="relative w-full aspect-[16/10] bg-white rounded-2xl p-1 border border-outline-variant/40 shadow-xs overflow-hidden select-none">
                <img 
                  src={currentImage} 
                  alt={`Silueta zoomorfa ${activeSpeciesView}`} 
                  className="w-full h-full object-contain pointer-events-none select-none transition-opacity duration-300"
                />

                {/* Puntos registrados en historia o cirugías */}
                {points.map((p, idx) => {
                  const colors = getPinColor(p.type);
                  const isSelected = selectedPointId === p.id;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPointId(isSelected ? null : p.id)}
                      style={{ top: `${p.y}%`, left: `${p.x}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                        isSelected ? 'scale-130 z-30' : 'hover:scale-115 z-20'
                      }`}
                      title={`${p.label} - ${QUADRANT_LABELS[p.quadrant]}`}
                    >
                      {p.type === 'problem' && (
                        <span className={`absolute -inset-1 rounded-full animate-ping ${colors.ping}`} />
                      )}

                      <span className={`relative flex items-center justify-center rounded-full border-2 transition-all shadow-md w-5 h-5 ${colors.bg} ${colors.border} ${colors.text} text-[10px] font-bold`}>
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between w-full px-2 pt-2 text-[11px] text-on-surface-variant font-medium">
                <span>Haz clic en un punto para ver su cuadrante y detalle</span>
                <span className="text-outline text-[10px] capitalize">{activeSpeciesView}</span>
              </div>
            </div>

            {/* PANEL LATERAL INFORMATIVO Y DETALLE DE CUADRANTE */}
            <div className="flex-1 w-full flex flex-col justify-between min-h-[200px]">
              {selectedPoint ? (
                /* DETALLE DEL PUNTO SELECCIONADO CON INDICACIÓN DE CUADRANTE */
                <div className="bg-surface-container-low/70 rounded-2xl p-5 border border-outline-variant/40 flex flex-col gap-3 animate-in fade-in duration-200">
                  <div className="flex items-start justify-between">
                    <div>
                      {/* Cuadrante anatómico */}
                      <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{QUADRANT_LABELS[selectedPoint.quadrant]}</span>
                      </div>
                      <h4 className="text-lg font-bold text-on-surface m-0">{selectedPoint.label}</h4>
                    </div>

                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${getPinColor(selectedPoint.type).badge}`}>
                      {selectedPoint.type === 'problem' ? 'Dolencia Activa' : selectedPoint.type === 'observation' ? 'Observación' : 'Resuelto'}
                    </span>
                  </div>

                  {/* Origen del punto (Consulta o Cirugía) */}
                  <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center justify-between text-outline text-[11px]">
                      <span className="font-semibold text-on-surface flex items-center gap-1">
                        {selectedPoint.sourceType === 'surgery' ? (
                          <Scissors className="w-3.5 h-3.5 text-rose-500" />
                        ) : (
                          <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                        )}
                        {selectedPoint.sourceTitle || (selectedPoint.sourceType === 'surgery' ? 'Registro de Cirugía' : 'Registro de Historia Clínica')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatLocalDate(selectedPoint.date)}
                      </span>
                    </div>

                    {selectedPoint.notes && (
                      <p className="text-on-surface-variant m-0 mt-1 italic leading-relaxed">
                        "{selectedPoint.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedPointId(null)}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Cerrar detalle &rarr;
                    </button>
                  </div>
                </div>
              ) : points.length === 0 ? (
                /* MENSAJE CUANDO AÚN NO TIENE PUNTOS REGISTRADOS */
                <div className="h-full py-8 px-6 bg-surface-container-low/40 rounded-2xl border border-dashed border-outline-variant/60 flex flex-col items-center justify-center text-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-on-surface m-0">
                    Aún no hay puntos anatómicos registrados en la historia clínica o cirugías
                  </h4>
                  <p className="text-xs text-on-surface-variant m-0 max-w-sm leading-relaxed">
                    Al registrar una consulta o cirugía, marca las zonas y cuadrantes correspondientes para llevar un mejor seguimiento visual de la evolución del paciente.
                  </p>
                </div>
              ) : (
                /* LISTA DE PUNTOS REGISTRADOS */
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-outline">
                      Cuadrantes con registros ({points.length})
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Haz clic en un punto para inspeccionar
                    </span>
                  </div>

                  <div className="divide-y divide-surface-container-high border border-surface-container-high rounded-xl overflow-hidden bg-surface-container-lowest max-h-[170px] overflow-y-auto">
                    {points.map((p, idx) => {
                      const colors = getPinColor(p.type);
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPointId(p.id)}
                          className="p-2.5 text-xs flex items-center justify-between hover:bg-surface-container-high/30 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${colors.bg}`}>
                              {idx + 1}
                            </span>
                            <div className="truncate">
                              <p className="font-semibold text-on-surface m-0 truncate leading-tight">{p.label}</p>
                              <p className="text-[10px] text-primary font-medium m-0 truncate">
                                {QUADRANT_LABELS[p.quadrant]}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] text-outline shrink-0 ml-2">
                            {formatLocalDate(p.date)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
