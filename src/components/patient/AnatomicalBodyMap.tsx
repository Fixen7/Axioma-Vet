import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  Dog, 
  Cat, 
  MapPin, 
  Calendar, 
  Stethoscope, 
  Scissors,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { Patient, Consultation, Surgery } from '../../services/types';
import { useVetContext } from '../../context/VetContext';
import { 
  getAccumulatedPointsForPatient,
  ANATOMY_UPDATE_EVENT,
  type CustomAnatomicalPoint, 
  type PointSeverity,
  QUADRANT_LABELS 
} from '../../utils/customAnatomyPoints';
import { formatLocalDate } from '../../utils/date';

interface AnatomicalBodyMapProps {
  patient: Patient;
  consultations?: Consultation[];
  surgeries?: Surgery[];
}

export function AnatomicalBodyMap({ 
  patient, 
  consultations: initialConsultations,
  surgeries: initialSurgeries 
}: AnatomicalBodyMapProps) {
  const { getConsultations, getSurgeries } = useVetContext();
  const [isExpanded, setIsExpanded] = useState(true);

  // Especie: Canino vs Felino
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

  // Lista acumulada de puntos y selección
  const [points, setPoints] = useState<CustomAnatomicalPoint[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<'all' | 'consultation' | 'surgery'>('all');

  // Función para cargar y validar los puntos estrictamente pertenecientes a consultas o cirugías reales
  const loadAndValidatePoints = useCallback(async () => {
    try {
      let consults = initialConsultations;
      let surgs = initialSurgeries;

      // Si no vienen por props, los consultamos directamente del contexto
      if (!consults && getConsultations) {
        consults = await getConsultations(patient.id);
      }
      if (!surgs && getSurgeries) {
        surgs = await getSurgeries(patient.id);
      }

      const validConsultIds = (consults || []).map(c => c.id);
      const validSurgIds = (surgs || []).map(s => s.id);

      // Obtener la suma acumulada descartando huérfanos
      const accumulated = getAccumulatedPointsForPatient(
        patient.id,
        validConsultIds,
        validSurgIds
      );

      setPoints(accumulated);
    } catch (err) {
      console.error('Error al cargar puntos anatómicos acumulados:', err);
    }
  }, [patient.id, initialConsultations, initialSurgeries, getConsultations, getSurgeries]);

  useEffect(() => {
    loadAndValidatePoints();
    setSelectedPointId(null);
  }, [loadAndValidatePoints]);

  // Escuchar eventos en tiempo real de creación/edición/eliminación de consultas o cirugías
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail || customEvent.detail.patientId === patient.id) {
        loadAndValidatePoints();
      }
    };

    window.addEventListener(ANATOMY_UPDATE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(ANATOMY_UPDATE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [patient.id, loadAndValidatePoints]);

  // Puntos visibles según filtro seleccionado
  const visiblePoints = useMemo(() => {
    if (filterSource === 'all') return points;
    return points.filter(p => p.sourceType === filterSource);
  }, [points, filterSource]);

  const selectedPoint = useMemo(() => {
    return points.find(p => p.id === selectedPointId) || null;
  }, [points, selectedPointId]);

  // Conteo métrico acumulado
  const activeProblemsCount = points.filter(p => p.type === 'problem').length;
  const observationsCount = points.filter(p => p.type === 'observation').length;
  const resolvedCount = points.filter(p => p.type === 'resolved').length;
  const uniqueQuadrantsCount = new Set(points.map(p => p.quadrant)).size;

  const consultationPointsCount = points.filter(p => p.sourceType === 'consultation').length;
  const surgeryPointsCount = points.filter(p => p.sourceType === 'surgery').length;

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
      
      {/* HEADER BENTO (RESUMEN ACUMULADO) */}
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-surface-container-high/20 transition-colors select-none border-b border-surface-container-high/60"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-headline-sm text-base md:text-lg text-on-surface m-0 font-bold">
                Resumen Anatómico Acumulado
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-surface-container-high text-outline">
                Informativo
              </span>
              {points.length > 0 && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {points.length} {points.length === 1 ? 'punto registrado' : 'puntos acumulados'} ({uniqueQuadrantsCount} {uniqueQuadrantsCount === 1 ? 'cuadrante' : 'cuadrantes'})
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant m-0 mt-0.5">
              Suma consolidada de hallazgos y cuadrantes registrados en consultas y cirugías
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
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

          {/* BARRA DE FILTROS Y MÉTRICAS ACUMULADAS */}
          {points.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-surface-container-high/40">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-outline mr-1">
                  Ver:
                </span>
                <button
                  type="button"
                  onClick={() => setFilterSource('all')}
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    filterSource === 'all'
                      ? 'bg-primary text-white shadow-2xs'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  Todos ({points.length})
                </button>
                {consultationPointsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterSource('consultation')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                      filterSource === 'consultation'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <Stethoscope className="w-3 h-3" /> De Consultas ({consultationPointsCount})
                  </button>
                )}
                {surgeryPointsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterSource('surgery')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                      filterSource === 'surgery'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <Scissors className="w-3 h-3" /> De Cirugías ({surgeryPointsCount})
                  </button>
                )}
              </div>

              {/* Badges de severidad acumulada */}
              <div className="flex items-center gap-2">
                {activeProblemsCount > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    {activeProblemsCount} {activeProblemsCount === 1 ? 'activa' : 'activas'}
                  </span>
                )}
                {observationsCount > 0 && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {observationsCount} obs.
                  </span>
                )}
                {resolvedCount > 0 && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {resolvedCount} resueltas
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-between">
            
            {/* ÁREA DE VISUALIZACIÓN DE LA SILUETA (SUMA ACUMULADA) */}
            <div className="flex flex-col items-center w-full max-w-[440px]">
              <div className="relative w-full aspect-[16/10] bg-white rounded-2xl p-1 border border-outline-variant/40 shadow-xs overflow-hidden select-none">
                <img 
                  src={currentImage} 
                  alt={`Silueta zoomorfa ${activeSpeciesView}`} 
                  className="w-full h-full object-contain pointer-events-none select-none transition-opacity duration-300"
                />

                {/* Suma acumulada de puntos de consultas y cirugías */}
                {visiblePoints.map((p, idx) => {
                  const colors = getPinColor(p.type);
                  const isSelected = selectedPointId === p.id;
                  const isSurgery = p.sourceType === 'surgery';

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPointId(isSelected ? null : p.id)}
                      style={{ top: `${p.y}%`, left: `${p.x}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                        isSelected ? 'scale-130 z-30 ring-2 ring-primary ring-offset-2' : 'hover:scale-115 z-20'
                      }`}
                      title={`${p.label} - ${QUADRANT_LABELS[p.quadrant]} (${isSurgery ? 'Cirugía' : 'Consulta'})`}
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
                <span>Haz clic en un punto para inspeccionar su registro</span>
                <span className="text-outline text-[10px] capitalize">{activeSpeciesView}</span>
              </div>
            </div>

            {/* PANEL LATERAL: DETALLE O REGISTRO PUNTO POR PUNTO */}
            <div className="flex-1 w-full flex flex-col justify-between min-h-[220px]">
              {selectedPoint ? (
                /* DETALLE DEL PUNTO SELECCIONADO */
                <div className="bg-surface-container-low/70 rounded-2xl p-5 border border-outline-variant/40 flex flex-col gap-3 animate-in fade-in duration-200">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {/* Cuadrante anatómico */}
                      <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{QUADRANT_LABELS[selectedPoint.quadrant]}</span>
                      </div>
                      <h4 className="text-base font-bold text-on-surface m-0">{selectedPoint.label}</h4>
                    </div>

                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shrink-0 ${getPinColor(selectedPoint.type).badge}`}>
                      {selectedPoint.type === 'problem' ? 'Dolencia Activa' : selectedPoint.type === 'observation' ? 'Observación' : 'Resuelto'}
                    </span>
                  </div>

                  {/* Origen del punto (Consulta o Cirugía específica) */}
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

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[11px] text-outline">
                      Punto acumulado #{visiblePoints.findIndex(p => p.id === selectedPoint.id) + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPointId(null)}
                      className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Ver lista completa &rarr;
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
                /* REGISTRO ACUMULADO PUNTO POR PUNTO */
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-outline">
                      Registro Acumulado Punto por Punto ({visiblePoints.length})
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Haz clic en un registro para ubicarlo
                    </span>
                  </div>

                  <div className="divide-y divide-surface-container-high border border-surface-container-high rounded-xl overflow-hidden bg-surface-container-lowest max-h-[190px] overflow-y-auto">
                    {visiblePoints.map((p, idx) => {
                      const colors = getPinColor(p.type);
                      const isSurgery = p.sourceType === 'surgery';

                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPointId(p.id)}
                          className="p-2.5 text-xs flex items-center justify-between hover:bg-surface-container-high/30 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${colors.bg}`}>
                              {idx + 1}
                            </span>
                            <div className="truncate">
                              <p className="font-semibold text-on-surface m-0 truncate leading-tight flex items-center gap-1.5">
                                {isSurgery ? (
                                  <Scissors className="w-3 h-3 text-rose-500 shrink-0" />
                                ) : (
                                  <Stethoscope className="w-3 h-3 text-blue-500 shrink-0" />
                                )}
                                <span className="truncate">{p.label}</span>
                              </p>
                              <p className="text-[10px] text-primary font-medium m-0 truncate">
                                {QUADRANT_LABELS[p.quadrant]}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-[10px] text-outline">
                              {formatLocalDate(p.date)}
                            </span>
                            {p.type === 'resolved' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : p.type === 'problem' ? (
                              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                            ) : null}
                          </div>
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
