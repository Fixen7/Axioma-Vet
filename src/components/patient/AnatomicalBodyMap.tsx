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

      if (!consults && getConsultations) {
        consults = await getConsultations(patient.id);
      }
      if (!surgs && getSurgeries) {
        surgs = await getSurgeries(patient.id);
      }

      const validConsultIds = (consults || []).map(c => c.id);
      const validSurgIds = (surgs || []).map(s => s.id);

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

  const visiblePoints = useMemo(() => {
    if (filterSource === 'all') return points;
    return points.filter(p => p.sourceType === filterSource);
  }, [points, filterSource]);

  const selectedPoint = useMemo(() => {
    return points.find(p => p.id === selectedPointId) || null;
  }, [points, selectedPointId]);

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
          bg: 'bg-[#dc2626]',
          border: 'border-white',
          text: 'text-white',
          ping: 'bg-red-500/50',
          badge: 'bg-[#dc2626] text-white font-black'
        };
      case 'observation':
        return {
          bg: 'bg-[#4f46e5]',
          border: 'border-white',
          text: 'text-white',
          ping: 'bg-indigo-500/40',
          badge: 'bg-[#4f46e5] text-white font-black'
        };
      case 'resolved':
        return {
          bg: 'bg-[#059669]',
          border: 'border-white',
          text: 'text-white',
          ping: 'bg-emerald-500/40',
          badge: 'bg-[#059669] text-white font-black'
        };
    }
  };

  const currentImage = activeSpeciesView === 'feline' 
    ? '/anatomy-feline.jpg' 
    : '/anatomy-canine.jpg';

  return (
    <div className="w-full rounded-[28px] bg-white border-2 border-slate-200 shadow-sm overflow-hidden transition-all duration-300 text-[#131b2e]">
      
      {/* HEADER BENTO (RESUMEN ACUMULADO) */}
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors select-none border-b border-slate-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs shrink-0">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base md:text-lg text-[#131b2e] m-0 font-black">
                Esquema Anatómico del Paciente
              </h3>
              <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-[#131b2e] border-2 border-slate-300 tracking-wider">
                Informativo
              </span>
              {points.length > 0 && (
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-primary text-white shadow-xs">
                  {points.length} {points.length === 1 ? 'punto registrado' : 'puntos acumulados'} ({uniqueQuadrantsCount} {uniqueQuadrantsCount === 1 ? 'cuadrante' : 'cuadrantes'})
                </span>
              )}
            </div>
            <p className="text-xs text-[#4a4455] m-0 mt-0.5 font-bold">
              Suma acumulada de cuadrantes y zonas documentadas en consultas o cirugías
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* Conmutador de Especie Canino / Felino (ALTO CONTRASTE ABSOLUTO) */}
          <div 
            onClick={e => e.stopPropagation()} 
            className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border-2 border-slate-300"
          >
            <button
              type="button"
              onClick={() => setActiveSpeciesView('canine')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSpeciesView === 'canine' 
                  ? 'bg-primary text-white shadow-xs' 
                  : 'text-[#131b2e] hover:text-black'
              }`}
            >
              <Dog className="w-3.5 h-3.5" /> Canino
            </button>
            <button
              type="button"
              onClick={() => setActiveSpeciesView('feline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSpeciesView === 'feline' 
                  ? 'bg-primary text-white shadow-xs' 
                  : 'text-[#131b2e] hover:text-black'
              }`}
            >
              <Cat className="w-3.5 h-3.5" /> Felino
            </button>
          </div>

          <button 
            type="button"
            className="text-[#131b2e] hover:text-black p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label={isExpanded ? 'Colapsar mapa' : 'Expandir mapa'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* CONTENIDO DEL MAPA BENTO */}
      {isExpanded && (
        <div className="p-6 flex flex-col gap-5 bg-slate-50/60">

          {/* BARRA DE FILTROS Y MÉTRICAS ACUMULADAS */}
          {points.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#131b2e] mr-1">
                  Ver:
                </span>
                <button
                  type="button"
                  onClick={() => setFilterSource('all')}
                  className={`text-xs px-3 py-1 rounded-lg font-black transition-colors cursor-pointer ${
                    filterSource === 'all'
                      ? 'bg-primary text-white shadow-2xs'
                      : 'bg-white text-[#131b2e] hover:bg-slate-100 border-2 border-slate-300'
                  }`}
                >
                  Todos ({points.length})
                </button>
                {consultationPointsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterSource('consultation')}
                    className={`text-xs px-3 py-1 rounded-lg font-black transition-colors flex items-center gap-1.5 cursor-pointer ${
                      filterSource === 'consultation'
                        ? 'bg-[#1d4ed8] text-white shadow-2xs'
                        : 'bg-white text-[#131b2e] hover:bg-slate-100 border-2 border-slate-300'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" /> De Consultas ({consultationPointsCount})
                  </button>
                )}
                {surgeryPointsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterSource('surgery')}
                    className={`text-xs px-3 py-1 rounded-lg font-black transition-colors flex items-center gap-1.5 cursor-pointer ${
                      filterSource === 'surgery'
                        ? 'bg-[#be123c] text-white shadow-2xs'
                        : 'bg-white text-[#131b2e] hover:bg-slate-100 border-2 border-slate-300'
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" /> De Cirugías ({surgeryPointsCount})
                  </button>
                )}
              </div>

              {/* Badges de severidad acumulada (ALTO CONTRASTE ABSOLUTO) */}
              <div className="flex items-center gap-2">
                {activeProblemsCount > 0 && (
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#dc2626] text-white shadow-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                    {activeProblemsCount} {activeProblemsCount === 1 ? 'dolencia activa' : 'dolencias activas'}
                  </span>
                )}
                {observationsCount > 0 && (
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#4f46e5] text-white shadow-xs">
                    {observationsCount} obs.
                  </span>
                )}
                {resolvedCount > 0 && (
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#059669] text-white shadow-xs">
                    {resolvedCount} resueltas
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-between">
            
            {/* ÁREA DE VISUALIZACIÓN DE LA SILUETA (SUMA ACUMULADA) */}
            <div className="flex flex-col items-center w-full max-w-[440px]">
              <div className="relative w-full aspect-[16/10] bg-white rounded-2xl p-1.5 border-2 border-slate-300 shadow-xs overflow-hidden select-none">
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
                        isSelected ? 'scale-130 z-30 ring-3 ring-primary ring-offset-2' : 'hover:scale-115 z-20'
                      }`}
                      title={`${p.label} - ${QUADRANT_LABELS[p.quadrant]} (${isSurgery ? 'Cirugía' : 'Consulta'})`}
                    >
                      {p.type === 'problem' && (
                        <span className={`absolute -inset-1 rounded-full animate-ping ${colors.ping}`} />
                      )}

                      <span className={`relative flex items-center justify-center rounded-full border-2 transition-all shadow-md w-5 h-5 ${colors.bg} ${colors.border} ${colors.text} text-[10px] font-black`}>
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between w-full px-2 pt-2.5 text-xs text-[#131b2e] font-bold">
                <span>Haz clic en un punto para inspeccionar</span>
                <span className="text-[#4a4455] font-black uppercase text-[11px]">{activeSpeciesView}</span>
              </div>
            </div>

            {/* PANEL LATERAL: DETALLE O REGISTRO PUNTO POR PUNTO (ALTO CONTRASTE ABSOLUTO) */}
            <div className="flex-1 w-full flex flex-col justify-between min-h-[220px]">
              {selectedPoint ? (
                /* DETALLE DEL PUNTO SELECCIONADO */
                <div className="bg-white rounded-2xl p-5 border-2 border-slate-300 flex flex-col gap-3.5 shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {/* Cuadrante anatómico */}
                      <div className="flex items-center gap-1.5 text-primary text-xs font-black uppercase tracking-wider mb-1">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span>{QUADRANT_LABELS[selectedPoint.quadrant]}</span>
                      </div>
                      <h4 className="text-base font-black text-[#131b2e] m-0">{selectedPoint.label}</h4>
                    </div>

                    <span className={`text-[11px] uppercase font-black tracking-wider px-2.5 py-1 rounded-lg shrink-0 ${getPinColor(selectedPoint.type).badge}`}>
                      {selectedPoint.type === 'problem' ? 'Dolencia Activa' : selectedPoint.type === 'observation' ? 'Observación' : 'Resuelto'}
                    </span>
                  </div>

                  {/* Origen del punto (Consulta o Cirugía específica) */}
                  <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between text-[#4a4455] text-xs font-bold">
                      <span className="font-black text-[#131b2e] flex items-center gap-1.5">
                        {selectedPoint.sourceType === 'surgery' ? (
                          <Scissors className="w-4 h-4 text-rose-600 shrink-0" />
                        ) : (
                          <Stethoscope className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                        {selectedPoint.sourceTitle || (selectedPoint.sourceType === 'surgery' ? 'Registro de Cirugía' : 'Registro de Historia Clínica')}
                      </span>
                      <span className="flex items-center gap-1 font-black text-[#131b2e]">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatLocalDate(selectedPoint.date)}
                      </span>
                    </div>

                    {selectedPoint.notes && (
                      <p className="text-[#131b2e] m-0 mt-1 italic font-bold leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                        "{selectedPoint.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="text-xs text-[#4a4455] font-black">
                      Punto acumulado #{visiblePoints.findIndex(p => p.id === selectedPoint.id) + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPointId(null)}
                      className="text-xs text-primary hover:underline font-black cursor-pointer"
                    >
                      Ver lista completa &rarr;
                    </button>
                  </div>
                </div>
              ) : points.length === 0 ? (
                /* MENSAJE CUANDO AÚN NO TIENE PUNTOS REGISTRADOS (LEGIBILIDAD TOTAL) */
                <div className="h-full py-8 px-6 bg-white rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center gap-2.5 shadow-2xs">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-sm text-[#131b2e] m-0 leading-snug">
                    Aún no hay puntos anatómicos registrados en la historia clínica o cirugías
                  </h4>
                  <p className="text-xs text-[#4a4455] m-0 max-w-sm leading-relaxed font-bold">
                    Al registrar una consulta o cirugía, marca las zonas y cuadrantes correspondientes para llevar un mejor seguimiento visual de la evolución del paciente.
                  </p>
                </div>
              ) : (
                /* REGISTRO ACUMULADO PUNTO POR PUNTO (ALTO CONTRASTE ABSOLUTO) */
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black uppercase tracking-wider text-[#131b2e]">
                      Cuadrantes con Registros ({visiblePoints.length})
                    </span>
                    <span className="text-xs text-[#4a4455] font-bold">
                      Haz clic en un punto para inspeccionar
                    </span>
                  </div>

                  <div className="divide-y divide-slate-200 border-2 border-slate-300 rounded-xl overflow-hidden bg-white max-h-[190px] overflow-y-auto shadow-2xs">
                    {visiblePoints.map((p, idx) => {
                      const colors = getPinColor(p.type);
                      const isSurgery = p.sourceType === 'surgery';

                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPointId(p.id)}
                          className="p-3 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 ${colors.bg}`}>
                              {idx + 1}
                            </span>
                            <div className="truncate">
                              <p className="font-black text-[#131b2e] m-0 truncate leading-tight flex items-center gap-1.5 text-xs">
                                {isSurgery ? (
                                  <Scissors className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                ) : (
                                  <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                )}
                                <span className="truncate">{p.label}</span>
                              </p>
                              <p className="text-[11px] text-primary font-black m-0 truncate mt-0.5">
                                {QUADRANT_LABELS[p.quadrant]}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-xs text-[#4a4455] font-black">
                              {formatLocalDate(p.date)}
                            </span>
                            {p.type === 'resolved' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : p.type === 'problem' ? (
                              <AlertCircle className="w-4 h-4 text-red-600" />
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
