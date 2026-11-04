import { useState, useMemo } from 'react';
import { Activity, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';
import type { Patient, Consultation } from '../../services/types';
import { analyzeAnatomicalFindings, type AnatomicalRegionId } from '../../utils/anatomyKeywords';
import { formatLocalDate } from '../../utils/date';

interface AnatomicalBodyMapProps {
  patient: Patient;
  consultations: Consultation[];
}

export function AnatomicalBodyMap({ patient, consultations }: AnatomicalBodyMapProps) {
  const [selectedRegionId, setSelectedRegionId] = useState<AnatomicalRegionId | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Analizar hallazgos anatómicos en tiempo real
  const regions = useMemo(() => {
    return analyzeAnatomicalFindings(patient, consultations);
  }, [patient, consultations]);

  const regionsWithFindings = useMemo(() => {
    return regions.filter(r => r.findings.length > 0);
  }, [regions]);

  const selectedRegion = useMemo(() => {
    if (!selectedRegionId) return null;
    return regions.find(r => r.id === selectedRegionId) || null;
  }, [regions, selectedRegionId]);

  // Coordenadas fijas de los puntos interactivos anatómicos en el SVG (viewBox: 0 0 340 200)
  const hotspotCoords: Record<AnatomicalRegionId, { x: number; y: number; label: string }> = {
    head: { x: 74, y: 52, label: 'Cabeza / Sentidos' },
    neck: { x: 110, y: 76, label: 'Cuello' },
    thorax: { x: 155, y: 95, label: 'Tórax / Cardio' },
    spine: { x: 195, y: 64, label: 'Columna / Dorso' },
    abdomen: { x: 215, y: 105, label: 'Abdomen / Digestivo' },
    front_limbs: { x: 145, y: 160, label: 'Miembros Ant.' },
    hind_limbs: { x: 265, y: 155, label: 'Miembros Post.' },
    skin: { x: 210, y: 35, label: 'Dermatología / Piel' }
  };

  return (
    <div className="w-full rounded-[28px] bg-surface-container-lowest/80 backdrop-blur-xl border border-surface-container-high shadow-sm overflow-hidden transition-all duration-300">
      
      {/* HEADER BENTO */}
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
                Mapa Anatómico & Registro de Dolencias
              </h3>
              {regionsWithFindings.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 text-[11px] font-bold">
                  {regionsWithFindings.length} {regionsWithFindings.length === 1 ? 'zona con registros' : 'zonas con registros'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Sin dolencias activas
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant m-0 mt-0.5">
              Referencia visual anatómica para guiar y recordar diagnósticos
            </p>
          </div>
        </div>

        <button 
          type="button"
          className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-xl hover:bg-surface-container transition-colors"
          aria-label={isExpanded ? 'Colapsar mapa' : 'Expandir mapa'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* CONTENIDO DEL MAPA BENTO */}
      {isExpanded && (
        <div className="p-6 flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-between">
          
          {/* SILUETA ANATÓMICA SVG MINIMALISTA */}
          <div className="relative w-full max-w-[380px] bg-gradient-to-b from-surface-container-low/40 to-surface-container-high/20 rounded-2xl p-4 border border-outline-variant/30 flex flex-col items-center">
            
            <svg 
              viewBox="0 0 340 200" 
              className="w-full h-auto drop-shadow-sm select-none"
            >
              <defs>
                <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Silueta universal cuadrúpedo (perro/gato/pequeños animales) estilizada y limpia */}
              <path 
                d="M 52,58 
                   C 48,50 56,36 68,36 
                   C 73,36 78,42 82,45 
                   C 95,44 105,55 115,68 
                   C 140,65 175,60 215,62 
                   C 245,64 265,72 278,92 
                   C 292,85 305,88 312,98 
                   C 314,102 308,106 302,104 
                   C 290,102 284,112 280,122 
                   L 278,172 C 278,178 268,178 268,172 
                   L 266,138 C 262,130 252,126 242,128 
                   C 220,132 195,134 175,124 
                   L 155,172 C 155,178 145,178 145,172 
                   L 142,120 
                   C 132,112 125,98 120,86 
                   C 114,84 105,80 98,82 
                   L 88,96 C 82,100 74,96 76,90 
                   L 80,78 
                   C 72,76 60,72 52,58 Z"
                fill="url(#bodyGradient)"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary transition-all duration-300"
              />

              {/* Ojo y hocico sutiles */}
              <circle cx="64" cy="46" r="2.5" fill="currentColor" className="text-primary/40" />
              <path d="M 52,58 Q 50,62 54,64" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-primary/40" />

              {/* Oreja representativa */}
              <path d="M 72,36 Q 78,24 84,38" stroke="currentColor" strokeWidth="2" fill="none" className="text-primary/40" strokeLinecap="round" />

              {/* Puntos interactivos / Hotspots */}
              {regions.map(r => {
                const coord = hotspotCoords[r.id];
                const hasIssues = r.findings.length > 0;
                const isSelected = selectedRegionId === r.id;

                return (
                  <g 
                    key={r.id}
                    onClick={() => setSelectedRegionId(isSelected ? null : r.id)}
                    className="cursor-pointer group"
                  >
                    {/* Anillo de pulso si tiene dolencias */}
                    {hasIssues && (
                      <circle 
                        cx={coord.x} 
                        cy={coord.y} 
                        r={isSelected ? "14" : "11"} 
                        className="fill-amber-500/20 stroke-amber-500/60 animate-pulse"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Círculo central */}
                    <circle 
                      cx={coord.x} 
                      cy={coord.y} 
                      r={isSelected ? "8" : "6"} 
                      className={`transition-all duration-200 ${
                        hasIssues 
                          ? 'fill-amber-500 stroke-white' 
                          : isSelected 
                            ? 'fill-primary stroke-white' 
                            : 'fill-surface-container-high hover:fill-primary/60 stroke-outline-variant'
                      }`}
                      strokeWidth="2"
                    />

                    {/* Contador si tiene más de 0 hallazgos */}
                    {hasIssues && (
                      <text 
                        x={coord.x} 
                        y={coord.y + 3.5} 
                        textAnchor="middle" 
                        className="text-[9px] font-bold fill-white pointer-events-none select-none"
                      >
                        {r.findings.length}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            <span className="text-[11px] text-on-surface-variant font-medium mt-2 text-center">
              Haz clic en cualquier punto del animal para inspeccionar antecedentes
            </span>
          </div>

          {/* PANEL LATERAL DE DETALLE DE LA ZONA SELECCIONADA */}
          <div className="flex-1 w-full flex flex-col justify-between min-h-[220px]">
            {selectedRegion ? (
              <div className="bg-surface-container-low/60 rounded-2xl p-5 border border-outline-variant/40 flex flex-col gap-3 animate-in fade-in duration-200">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-primary">Zona Anatómica</span>
                    <h4 className="text-lg font-bold text-on-surface m-0">{selectedRegion.label}</h4>
                    <p className="text-xs text-on-surface-variant m-0">{selectedRegion.sublabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRegionId(null)}
                    className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {selectedRegion.findings.length > 0 ? (
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {selectedRegion.findings.length} {selectedRegion.findings.length === 1 ? 'registro encontrado' : 'registros encontrados'}
                    </span>
                    <div className="divide-y divide-surface-container-high border border-surface-container-high rounded-xl overflow-hidden bg-surface-container-lowest max-h-[160px] overflow-y-auto">
                      {selectedRegion.findings.map((f, i) => (
                        <div key={i} className="p-3 text-xs flex flex-col gap-0.5 hover:bg-surface-container-high/20 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-primary">{f.source}</span>
                            {f.date && (
                              <span className="text-[10px] text-outline">{formatLocalDate(f.date)}</span>
                            )}
                          </div>
                          <p className="text-on-surface m-0 leading-relaxed font-medium">"{f.text}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center text-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-80" />
                    <p className="text-xs font-semibold text-on-surface m-0">Sin anomalías ni tratamientos registrados en esta zona.</p>
                    <p className="text-[11px] text-outline m-0">El historial clínico no contiene diagnósticos asociados a {selectedRegion.label.toLowerCase()}.</p>
                  </div>
                )}
              </div>
            ) : (
              /* ESTADO POR DEFECTO: RESUMEN DE ZONAS */
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-outline">
                  Zonas Anatómicas del Paciente
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {regions.map(r => {
                    const hasIssues = r.findings.length > 0;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRegionId(r.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                          hasIssues
                            ? 'bg-amber-50/70 border-amber-300 text-amber-950 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-200 shadow-xs'
                            : 'bg-surface-container-low/50 border-outline-variant/30 text-on-surface hover:bg-surface-container-high/40'
                        }`}
                      >
                        <span className="text-xs font-bold truncate block">{r.label.split(' ')[0]}</span>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] opacity-70 truncate">{r.sublabel.split(',')[0]}</span>
                          {hasIssues && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                              {r.findings.length}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 bg-surface-container-low/50 rounded-xl border border-outline-variant/30 flex items-center gap-2 text-xs text-on-surface-variant">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    El mapa relaciona automáticamente los diagnósticos y consultas pasadas con cada parte del cuerpo del paciente.
                  </span>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
