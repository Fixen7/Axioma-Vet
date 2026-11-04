import { useState, useMemo } from 'react';
import { Activity, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Sparkles, X, Eye } from 'lucide-react';
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
  const [activeImageVariant, setActiveImageVariant] = useState<'clean' | 'ui' | 'translucent'>('clean');

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

  // Posiciones porcentuales relativas sobre la imagen anatómica zoomorfa lateral
  const hotspotPositions: Record<AnatomicalRegionId, { top: number; left: number; label: string }> = {
    head: { top: 26, left: 21, label: 'Cabeza / Sentidos' },
    neck: { top: 36, left: 32, label: 'Cuello' },
    thorax: { top: 48, left: 44, label: 'Tórax / Cardio' },
    spine: { top: 33, left: 56, label: 'Columna / Dorso' },
    abdomen: { top: 55, left: 62, label: 'Abdomen / Digestivo' },
    front_limbs: { top: 72, left: 40, label: 'Extremidades Ant.' },
    hind_limbs: { top: 70, left: 78, label: 'Extremidades Post.' },
    skin: { top: 18, left: 62, label: 'Dermatología / Piel' }
  };

  const imageSrc = activeImageVariant === 'ui'
    ? '/anatomy-animal-ui.jpg'
    : activeImageVariant === 'translucent'
      ? '/anatomy-animal-translucent.jpg'
      : '/anatomy-animal-clean.jpg';

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
                Esquema Anatómico Zoomorfo & Dolencias
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
              Ilustración zoomorfa con memoria de antecedentes clínicos por zona
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Conmutador sutil de estilo de ilustración para que el doctor elija el que más le guste */}
          <div 
            onClick={e => e.stopPropagation()} 
            className="hidden sm:flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/40"
          >
            <button
              type="button"
              onClick={() => setActiveImageVariant('clean')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors ${
                activeImageVariant === 'clean' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-outline hover:text-on-surface'
              }`}
            >
              Limpia
            </button>
            <button
              type="button"
              onClick={() => setActiveImageVariant('ui')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors ${
                activeImageVariant === 'ui' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-outline hover:text-on-surface'
              }`}
            >
              Cian/UI
            </button>
            <button
              type="button"
              onClick={() => setActiveImageVariant('translucent')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors ${
                activeImageVariant === 'translucent' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-outline hover:text-on-surface'
              }`}
            >
              Suave
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
        <div className="p-6 flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-between">
          
          {/* ILUSTRACIÓN ZOOMORFA CON PUNTOS INTERACTIVOS */}
          <div className="relative w-full max-w-[420px] bg-surface-container-lowest rounded-2xl p-2.5 border border-outline-variant/40 flex flex-col items-center shadow-xs overflow-hidden">
            
            <div className="relative w-full aspect-[16/10] overflow-hidden rounded-xl bg-white flex items-center justify-center">
              <img 
                src={imageSrc} 
                alt="Silueta zoomorfa anatómica veterinaria" 
                className="w-full h-full object-contain pointer-events-none select-none transition-all duration-300"
              />

              {/* Capa de Hotspots Interactivos calibrados sobre la silueta */}
              {regions.map(r => {
                const pos = hotspotPositions[r.id];
                const hasIssues = r.findings.length > 0;
                const isSelected = selectedRegionId === r.id;

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRegionId(isSelected ? null : r.id)}
                    style={{ top: `${pos.top}%`, left: `${pos.left}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 group ${
                      isSelected ? 'scale-125 z-30' : 'hover:scale-115 z-20'
                    }`}
                    title={`${r.label}: ${hasIssues ? `${r.findings.length} antecedentes` : 'Sin antecedentes'}`}
                  >
                    {/* Anillo de pulso si tiene hallazgos */}
                    {hasIssues && (
                      <span className="absolute -inset-1 rounded-full bg-amber-500/40 animate-ping" />
                    )}

                    <span className={`relative flex items-center justify-center rounded-full border-2 transition-all shadow-md ${
                      hasIssues
                        ? 'w-6 h-6 bg-amber-500 border-white text-white font-bold text-[10px]'
                        : isSelected
                          ? 'w-5 h-5 bg-primary border-white text-white text-[9px] font-bold'
                          : 'w-4 h-4 bg-white/95 border-outline-variant hover:border-primary hover:bg-primary/20 shadow-xs'
                    }`}>
                      {hasIssues ? r.findings.length : isSelected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between w-full px-2 pt-2 text-[11px] text-on-surface-variant font-medium">
              <span>Haz clic en los puntos del animal para ver dolencias</span>
              <span className="text-outline text-[10px]">{regionsWithFindings.length} con antecedentes</span>
            </div>
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
              /* ESTADO POR DEFECTO: BOTONES DE ACCESO RÁPIDO A ZONAS */
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-outline">
                    Zonas Anatómicas del Animal
                  </span>
                  <span className="text-[11px] text-primary flex items-center gap-1 font-medium">
                    <Eye className="w-3.5 h-3.5" /> Inspección rápida
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {regions.map(r => {
                    const hasIssues = r.findings.length > 0;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRegionId(r.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                          hasIssues
                            ? 'bg-amber-50/80 border-amber-300 text-amber-950 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-200 shadow-xs'
                            : 'bg-surface-container-low/50 border-outline-variant/30 text-on-surface hover:bg-surface-container-high/50'
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
