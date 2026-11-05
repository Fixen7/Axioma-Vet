import { useState } from 'react';
import { Sparkles, TrendingDown, TrendingUp, Calendar, Pill, ChevronDown, ChevronUp, AlertCircle, Info, Search } from 'lucide-react';
import type { ClinicalMemoryAnalysis } from '../../utils/clinicalMemory';
import { formatLocalDate } from '../../utils/date';

interface ClinicalMemoryCardProps {
  memory: ClinicalMemoryAnalysis;
  isLoading: boolean;
  onOpenSimilarCases?: () => void;
}

export function ClinicalMemoryCard({ memory, isLoading, onOpenSimilarCases }: ClinicalMemoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (isLoading) {
    return (
      <div className="w-full bg-surface-container-lowest border border-surface-container-high rounded-[28px] p-5 flex items-center gap-3 animate-pulse">
        <div className="w-9 h-9 rounded-2xl bg-surface-container-high"></div>
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="h-3.5 bg-surface-container-high rounded w-48"></div>
          <div className="h-2.5 bg-surface-container-high rounded w-72"></div>
        </div>
      </div>
    );
  }

  const { weightDelta, pendingControl, lastTreatment, importantObservations } = memory;
  const hasFacts = !!weightDelta || !!pendingControl || !!lastTreatment || importantObservations.length > 0;

  return (
    <div className="w-full h-full rounded-[28px] bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-surface-container-high shadow-sm overflow-hidden transition-all duration-300 flex flex-col justify-between">
      
      {/* HEADER DE MEMORIA CLÍNICA */}
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-surface-container-high/20 transition-colors select-none border-b border-slate-200 dark:border-surface-container-high/60"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-headline-sm text-base md:text-lg text-slate-900 dark:text-white m-0 font-bold">
              Memoria Clínica
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 m-0 mt-0.5 font-medium">
              {hasFacts ? 'Hechos y evolución registrados' : 'Sin alertas clínicas activas'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSimilarCases && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSimilarCases();
              }}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-primary/40 bg-primary/5 text-primary hover:bg-primary/15 transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
              title="Buscar antecedentes y casos similares en la clínica"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Casos Similares</span>
            </button>
          )}

          <button 
            type="button"
            className="text-slate-700 dark:text-slate-300 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-surface-container transition-colors"
            aria-label={isExpanded ? 'Colapsar memoria' : 'Expandir memoria'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* CONTENIDO EXPANDIBLE */}
      {isExpanded && (
        <div className="flex-1 p-5 flex flex-col justify-between gap-3 bg-slate-50/50 dark:bg-transparent">
          {!hasFacts ? (
            <div className="py-6 px-4 flex flex-col items-center justify-center text-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs mb-1"></div>
              <p className="font-bold text-slate-900 dark:text-white m-0 text-sm">Historial general estable.</p>
              <p className="text-slate-600 dark:text-slate-300 m-0 font-medium">El paciente no presenta alertas de peso, tratamientos activos ni controles pendientes.</p>
              {onOpenSimilarCases && (
                <button
                  type="button"
                  onClick={onOpenSimilarCases}
                  className="text-primary hover:underline font-bold text-xs mt-2 cursor-pointer"
                >
                  Consultar casos similares de la clínica &rarr;
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* 1. DELTA PONDERAL INFORMATIVO (ALTO CONTRASTE) */}
              {weightDelta && (
                <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                  weightDelta.isSignificantChange
                    ? 'bg-amber-50 border-amber-400/80 shadow-xs dark:bg-amber-950/40 dark:border-amber-700'
                    : 'bg-white border-slate-200 dark:bg-surface-container-low dark:border-outline-variant/40'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        {weightDelta.deltaKg < 0 ? (
                          <TrendingDown className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                        )}
                        Variación de Peso
                      </span>
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-amber-800 text-white shadow-xs">
                        {weightDelta.deltaKg > 0 ? `+${weightDelta.deltaKg}` : weightDelta.deltaKg} kg ({weightDelta.deltaPercentage > 0 ? `+${weightDelta.deltaPercentage}` : weightDelta.deltaPercentage}%)
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed font-semibold text-slate-900 dark:text-slate-100 m-0">
                      De <span className="underline decoration-amber-500 font-black">{weightDelta.previousWeightKg} kg</span> ({formatLocalDate(weightDelta.previousDate)}) a <span className="underline decoration-amber-500 font-black">{weightDelta.currentWeightKg} kg</span> ({formatLocalDate(weightDelta.currentDate)}).
                    </p>
                  </div>
                  {weightDelta.isSignificantChange && (
                    <div className="mt-2.5 pt-2 border-t border-amber-300 dark:border-amber-800/60 text-xs flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                      <Info className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-400" />
                      <span>Variación &ge; 5% registrada entre fechas.</span>
                    </div>
                  )}
                </div>
              )}

              {/* 2. CONTROL PROGRAMADO PREVIO (ALTO CONTRASTE) */}
              {pendingControl && (
                <div className="p-4 rounded-2xl border bg-blue-50 border-blue-400/80 shadow-xs dark:bg-blue-950/40 dark:border-blue-700 flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                        Control Previo
                      </span>
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-blue-800 text-white shadow-xs">
                        {formatLocalDate(pendingControl.scheduledControlDate)}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed font-semibold text-slate-900 dark:text-slate-100 m-0">
                      Programado en consulta del <span className="font-black text-blue-900 dark:text-blue-200">{formatLocalDate(pendingControl.originConsultationDate)}</span> sin registro de consulta posterior a esa fecha.
                    </p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-blue-300 dark:border-blue-800/60 text-xs flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300">
                    <Info className="w-4 h-4 shrink-0 text-blue-700 dark:text-blue-400" />
                    <span>Control clínico pendiente de atención.</span>
                  </div>
                </div>
              )}

              {/* 3. ÚLTIMO TRATAMIENTO REGISTRADO (ALTO CONTRASTE) */}
              {lastTreatment && (
                <div className="p-4 rounded-2xl border bg-white border-slate-200 shadow-xs dark:bg-surface-container-low dark:border-outline-variant/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Pill className="w-4 h-4 text-primary shrink-0" />
                        Último Tratamiento
                      </span>
                    </div>
                    {lastTreatment.hasStructuredPrescription && lastTreatment.prescriptionDetails && (
                      <div className="text-xs mb-2">
                        <span className="text-[10px] font-bold text-primary block uppercase tracking-wider">Receta ({formatLocalDate(lastTreatment.prescriptionDetails.date)})</span>
                        <strong className="text-slate-900 dark:text-white font-bold">{lastTreatment.prescriptionDetails.medication}</strong> - <span className="text-slate-700 dark:text-slate-300 font-medium">{lastTreatment.prescriptionDetails.dosage}</span>
                      </div>
                    )}
                    {lastTreatment.hasFreeTextTreatment && lastTreatment.freeTextTreatment && (
                      <div className="text-xs">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block uppercase tracking-wider">Anotación ({formatLocalDate(lastTreatment.freeTextTreatment.date)})</span>
                        <p className="line-clamp-2 text-slate-800 dark:text-slate-200 font-medium italic mt-1 bg-slate-50 dark:bg-surface-container p-2 rounded-xl border border-slate-200/60 dark:border-outline-variant/30">
                          "{lastTreatment.freeTextTreatment.text}"
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-outline-variant/30 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Documentado en visita previa.
                  </div>
                </div>
              )}

              {/* 4. OBSERVACIONES CLÍNICAS IMPORTANTES (ALTO CONTRASTE) */}
              {importantObservations.length > 0 && (
                <div className="p-4 rounded-2xl border bg-white border-slate-200 shadow-xs dark:bg-surface-container-low dark:border-outline-variant/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                        Observaciones Clínicas
                      </span>
                    </div>
                    <ul className="text-xs space-y-1.5 list-disc list-inside">
                      {importantObservations.map((obs, idx) => (
                        <li key={idx} className="leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
                          <span className="text-slate-900 dark:text-white font-semibold">{obs.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-outline-variant/30 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Notas de manejo documentadas.
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

    </div>
  );
}
