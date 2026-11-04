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
      <div className="w-full bg-surface-container-lowest/80 backdrop-blur-xl border border-surface-container-high rounded-[28px] p-5 flex items-center gap-3 animate-pulse">
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
    <div className="w-full h-full rounded-[28px] bg-surface-container-lowest/80 backdrop-blur-xl border border-surface-container-high shadow-sm overflow-hidden transition-all duration-300 flex flex-col justify-between">
      
      {/* HEADER DE MEMORIA CLÍNICA */}
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-surface-container-high/20 transition-colors select-none border-b border-surface-container-high/60"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-headline-sm text-base md:text-lg text-on-surface m-0 font-bold">
              Memoria Clínica
            </h3>
            <p className="text-xs text-on-surface-variant m-0 mt-0.5">
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
              className="text-xs px-2.5 py-1 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5 font-medium"
              title="Buscar antecedentes y casos similares en la clínica"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Casos Similares</span>
            </button>
          )}

          <button 
            type="button"
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-xl hover:bg-surface-container transition-colors"
            aria-label={isExpanded ? 'Colapsar memoria' : 'Expandir memoria'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* CONTENIDO EXPANDIBLE */}
      {isExpanded && (
        <div className="flex-1 p-5 flex flex-col justify-between gap-3">
          {!hasFacts ? (
            <div className="py-6 px-4 flex flex-col items-center justify-center text-center gap-2 text-xs text-on-surface-variant">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs mb-1"></div>
              <p className="font-semibold text-on-surface m-0">Historial general estable.</p>
              <p className="text-outline m-0">El paciente no presenta alertas de peso, tratamientos activos ni controles pendientes.</p>
              {onOpenSimilarCases && (
                <button
                  type="button"
                  onClick={onOpenSimilarCases}
                  className="text-primary hover:underline font-medium text-xs mt-2"
                >
                  Consultar casos similares de la clínica &rarr;
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* 1. DELTA PONDERAL INFORMATIVO */}
              {weightDelta && (
                <div className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                  weightDelta.isSignificantChange
                    ? 'bg-amber-50/70 border-amber-300 text-amber-950 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-200 shadow-xs'
                    : 'bg-surface-container-low/60 border-outline-variant/40 text-on-surface'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 flex items-center gap-1">
                        {weightDelta.deltaKg < 0 ? (
                          <TrendingDown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        )}
                        Variación de Peso
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        weightDelta.isSignificantChange
                          ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {weightDelta.deltaKg > 0 ? `+${weightDelta.deltaKg}` : weightDelta.deltaKg} kg ({weightDelta.deltaPercentage > 0 ? `+${weightDelta.deltaPercentage}` : weightDelta.deltaPercentage}%)
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed font-medium">
                      De <strong>{weightDelta.previousWeightKg} kg</strong> ({formatLocalDate(weightDelta.previousDate)}) a <strong>{weightDelta.currentWeightKg} kg</strong> ({formatLocalDate(weightDelta.currentDate)}).
                    </p>
                  </div>
                  {weightDelta.isSignificantChange && (
                    <div className="mt-2 pt-2 border-t border-amber-200/80 dark:border-amber-800/40 text-[11px] flex items-center gap-1.5 opacity-90">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>Variación &ge; 5% registrada entre fechas.</span>
                    </div>
                  )}
                </div>
              )}

              {/* 2. CONTROL PROGRAMADO PREVIO */}
              {pendingControl && (
                <div className="p-3.5 rounded-2xl border bg-blue-50/60 border-blue-200/80 text-blue-950 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        Control Previo
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-200/80 text-blue-900 dark:bg-blue-800 dark:text-blue-100">
                        {formatLocalDate(pendingControl.scheduledControlDate)}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed">
                      Programado en consulta del {formatLocalDate(pendingControl.originConsultationDate)} sin consulta posterior a esa fecha.
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-blue-200/60 dark:border-blue-800/40 text-[11px] flex items-center gap-1.5 opacity-90">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>Control clínico pendiente de atención.</span>
                  </div>
                </div>
              )}

              {/* 3. ÚLTIMO TRATAMIENTO REGISTRADO */}
              {lastTreatment && (
                <div className="p-3.5 rounded-2xl border bg-surface-container-low/60 border-outline-variant/40 text-on-surface flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 flex items-center gap-1">
                        <Pill className="w-3.5 h-3.5 text-primary" />
                        Último Tratamiento
                      </span>
                    </div>
                    {lastTreatment.hasStructuredPrescription && lastTreatment.prescriptionDetails && (
                      <div className="text-xs mb-1.5">
                        <span className="text-[10px] font-semibold text-primary block uppercase">Receta ({formatLocalDate(lastTreatment.prescriptionDetails.date)})</span>
                        <strong className="text-on-surface">{lastTreatment.prescriptionDetails.medication}</strong> - {lastTreatment.prescriptionDetails.dosage}
                      </div>
                    )}
                    {lastTreatment.hasFreeTextTreatment && lastTreatment.freeTextTreatment && (
                      <div className="text-xs">
                        <span className="text-[10px] font-semibold text-outline block uppercase">Anotación ({formatLocalDate(lastTreatment.freeTextTreatment.date)})</span>
                        <p className="line-clamp-2 text-on-surface-variant italic mt-0.5">"{lastTreatment.freeTextTreatment.text}"</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-t border-outline-variant/30 text-[10px] text-outline">
                    Documentado en visita previa.
                  </div>
                </div>
              )}

              {/* 4. OBSERVACIONES CLÍNICAS IMPORTANTES */}
              {importantObservations.length > 0 && (
                <div className="p-3.5 rounded-2xl border bg-surface-container-low/60 border-outline-variant/40 text-on-surface flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-primary" />
                        Observaciones Clínicas
                      </span>
                    </div>
                    <ul className="text-xs space-y-1 text-on-surface-variant list-disc list-inside">
                      {importantObservations.map((obs, idx) => (
                        <li key={idx} className="leading-relaxed">
                          <span className="text-on-surface font-medium">{obs.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-2 pt-2 border-t border-outline-variant/30 text-[10px] text-outline">
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
