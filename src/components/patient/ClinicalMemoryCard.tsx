import { useState } from 'react';
import { Sparkles, TrendingDown, TrendingUp, Calendar, Pill, ChevronDown, ChevronUp, AlertCircle, Info } from 'lucide-react';
import type { ClinicalMemoryAnalysis } from '../../utils/clinicalMemory';
import { formatLocalDate } from '../../utils/date';

interface ClinicalMemoryCardProps {
  memory: ClinicalMemoryAnalysis;
  isLoading: boolean;
}

export function ClinicalMemoryCard({ memory, isLoading }: ClinicalMemoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (isLoading) {
    return (
      <div className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
        <div className="w-8 h-8 rounded-xl bg-surface-container-high"></div>
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="h-3 bg-surface-container-high rounded w-48"></div>
          <div className="h-2.5 bg-surface-container-high rounded w-72"></div>
        </div>
      </div>
    );
  }

  const { weightDelta, pendingControl, lastTreatment, importantObservations } = memory;

  // Si no hay hechos documentados que reportar, no mostramos nada para no saturar la pantalla
  const hasFacts = !!weightDelta || !!pendingControl || !!lastTreatment || importantObservations.length > 0;
  if (!hasFacts) return null;

  return (
    <div className="w-full bg-gradient-to-r from-surface-container-lowest via-surface-container-low to-surface-container-lowest border border-primary/20 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
      
      {/* HEADER DE MEMORIA CLÍNICA */}
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-surface-container-high/30 transition-colors select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary-container text-primary flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-label-caps text-xs tracking-wider text-primary font-bold uppercase">
              Memoria Clínica del Paciente
            </span>
            <span className="text-[11px] text-on-surface-variant hidden sm:inline">
              · Hechos documentados en visitas previas
            </span>
          </div>
        </div>

        <button 
          type="button"
          className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors"
          aria-label={isExpanded ? 'Colapsar memoria' : 'Expandir memoria'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* CONTENIDO EXPANDIBLE */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-outline-variant/30">
          
          {/* 1. DELTA PONDERAL INFORMATIVO */}
          {weightDelta && (
            <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              weightDelta.isSignificantChange
                ? 'bg-amber-50/60 border-amber-200/80 text-amber-950 dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-200'
                : 'bg-surface-container-lowest border-outline-variant/50 text-on-surface'
            }`}>
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
                    ? 'bg-amber-200/80 text-amber-900 dark:bg-amber-800/60 dark:text-amber-100'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  {weightDelta.deltaKg > 0 ? `+${weightDelta.deltaKg}` : weightDelta.deltaKg} kg ({weightDelta.deltaPercentage > 0 ? `+${weightDelta.deltaPercentage}` : weightDelta.deltaPercentage}%)
                </span>
              </div>
              <p className="text-xs leading-relaxed">
                De <strong>{weightDelta.previousWeightKg} kg</strong> ({formatLocalDate(weightDelta.previousDate)}) a <strong>{weightDelta.currentWeightKg} kg</strong> ({formatLocalDate(weightDelta.currentDate)}).
              </p>
              {weightDelta.isSignificantChange && (
                <div className="mt-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/40 text-[11px] flex items-center gap-1.5 opacity-90">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Variación &ge; 5% registrada entre fechas.</span>
                </div>
              )}
            </div>
          )}

          {/* 2. CONTROL PROGRAMADO DOCUMENTADO */}
          {pendingControl && (
            <div className="p-3.5 rounded-xl border bg-surface-container-lowest border-outline-variant/50 text-on-surface flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Control Programado Previo
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                    {formatLocalDate(pendingControl.scheduledControlDate)}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Consulta del {formatLocalDate(pendingControl.originConsultationDate)}: Se registró fecha de control programada para el <strong>{formatLocalDate(pendingControl.scheduledControlDate)}</strong> sin registro de consulta posterior a esa fecha.
                </p>
              </div>
            </div>
          )}

          {/* 3. ÚLTIMO TRATAMIENTO DOCUMENTADO */}
          {lastTreatment && (
            <div className="p-3.5 rounded-xl border bg-surface-container-lowest border-outline-variant/50 text-on-surface flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                    <Pill className="w-3.5 h-3.5" />
                    Último Tratamiento Registrado
                  </span>
                  <span className="text-[10px] text-on-surface-variant">
                    {formatLocalDate(
                      lastTreatment.prescriptionDetails?.date || lastTreatment.freeTextTreatment?.date || ''
                    )}
                  </span>
                </div>

                {lastTreatment.hasStructuredPrescription && lastTreatment.prescriptionDetails && (
                  <div className="text-xs">
                    <p className="font-bold text-on-surface">
                      {lastTreatment.prescriptionDetails.medication}
                    </p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {lastTreatment.prescriptionDetails.dosage} · cada {lastTreatment.prescriptionDetails.frequency} por {lastTreatment.prescriptionDetails.duration}
                    </p>
                  </div>
                )}

                {lastTreatment.hasFreeTextTreatment && lastTreatment.freeTextTreatment && !lastTreatment.hasStructuredPrescription && (
                  <div className="text-xs">
                    <span className="text-[10px] font-bold uppercase text-outline block mb-0.5">
                      Indicación en Consulta (Texto Original)
                    </span>
                    <p className="text-on-surface-variant italic line-clamp-3">
                      "{lastTreatment.freeTextTreatment.text}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. OBSERVACIONES CLÍNICAS IMPORTANTES (TEXTO ORIGINAL) */}
          {importantObservations.map((obs, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border bg-surface-container-lowest border-outline-variant/50 text-on-surface flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-outline flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-primary" />
                    {obs.source}
                  </span>
                  {obs.date && <span className="text-[10px] text-on-surface-variant">{formatLocalDate(obs.date)}</span>}
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  "{obs.text}"
                </p>
              </div>
            </div>
          ))}

        </div>
      )}

    </div>
  );
}
