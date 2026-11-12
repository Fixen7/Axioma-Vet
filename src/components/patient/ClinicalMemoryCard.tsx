import { useState } from 'react';
import { Sparkles, TrendingDown, TrendingUp, Calendar, Pill, ChevronDown, ChevronUp, AlertCircle, Info, Search } from 'lucide-react';
import type { ClinicalMemoryAnalysis } from '../../utils/clinicalMemory';
import { formatLocalDate } from '../../utils/date';
import { useTranslation } from '../../i18n';

interface ClinicalMemoryCardProps {
  memory: ClinicalMemoryAnalysis;
  isLoading: boolean;
  onOpenSimilarCases?: () => void;
}

export function ClinicalMemoryCard({ memory, isLoading, onOpenSimilarCases }: ClinicalMemoryCardProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);

  if (isLoading) {
    return (
      <div className="w-full bg-white border border-slate-200 rounded-[28px] p-5 flex items-center gap-3 animate-pulse">
        <div className="w-9 h-9 rounded-2xl bg-slate-100"></div>
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="h-3.5 bg-slate-200 rounded w-48"></div>
          <div className="h-2.5 bg-slate-100 rounded w-72"></div>
        </div>
      </div>
    );
  }

  const { weightDelta, pendingControl, lastTreatment, importantObservations } = memory;
  const hasFacts = !!weightDelta || !!pendingControl || !!lastTreatment || importantObservations.length > 0;

  return (
    <div className="w-full h-full rounded-[28px] bg-white border-2 border-slate-200 shadow-sm overflow-hidden transition-all duration-300 flex flex-col justify-between text-[#131b2e]">
      
      {/* HEADER DE MEMORIA CLÍNICA */}
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors select-none border-b border-slate-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base md:text-lg text-[#131b2e] m-0 font-black">
              {t('Memoria Clínica', 'Clinical Memory')}
            </h3>
            <p className="text-xs text-[#4a4455] m-0 mt-0.5 font-bold">
              {hasFacts ? t('Hechos y evolución registrados', 'Recorded facts & evolution') : t('Sin alertas clínicas activas', 'No active clinical alerts')}
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
              className="text-xs px-2.5 py-1.5 rounded-xl border-2 border-primary/40 bg-primary/5 text-primary hover:bg-primary/15 transition-colors flex items-center gap-1.5 font-black cursor-pointer shadow-2xs"
              title={t('Buscar antecedentes y casos similares en la clínica', 'Search medical history and similar cases in the clinic')}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('Casos Similares', 'Similar Cases')}</span>
            </button>
          )}

          <button 
            type="button"
            className="text-[#131b2e] hover:text-black p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label={isExpanded ? t('Colapsar memoria', 'Collapse memory') : t('Expandir memoria', 'Expand memory')}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* CONTENIDO EXPANDIBLE */}
      {isExpanded && (
        <div className="flex-1 p-5 flex flex-col justify-between gap-3 bg-slate-50/60">
          {!hasFacts ? (
            <div className="py-6 px-4 flex flex-col items-center justify-center text-center gap-2 text-xs text-[#4a4455]">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs mb-1"></div>
              <p className="font-black text-[#131b2e] m-0 text-sm">{t('Historial general estable.', 'Overall history stable.')}</p>
              <p className="text-[#4a4455] m-0 font-semibold">{t('El paciente no presenta alertas de peso, tratamientos activos ni controles pendientes.', 'The patient has no weight alerts, active treatments, or pending follow-ups.')}</p>
              {onOpenSimilarCases && (
                <button
                  type="button"
                  onClick={onOpenSimilarCases}
                  className="text-primary hover:underline font-black text-xs mt-2 cursor-pointer"
                >
                  {t('Consultar casos similares de la clínica', 'Browse similar clinic cases')} &rarr;
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* 1. DELTA PONDERAL INFORMATIVO (ALTO CONTRASTE ABSOLUTO) */}
              {weightDelta && (
                <div className={`p-4 rounded-2xl border-2 flex flex-col justify-between transition-all ${
                  weightDelta.isSignificantChange
                    ? 'bg-[#fffbeb] border-[#f59e0b] shadow-xs'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[11px] font-black uppercase tracking-wider text-[#78350f] flex items-center gap-1.5">
                        {weightDelta.deltaKg < 0 ? (
                          <TrendingDown className="w-4 h-4 text-[#b45309] shrink-0" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-[#047857] shrink-0" />
                        )}
                        {t('Variación de Peso', 'Weight Variation')}
                      </span>
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-[#78350f] text-white shadow-xs">
                        {weightDelta.deltaKg > 0 ? `+${weightDelta.deltaKg}` : weightDelta.deltaKg} kg ({weightDelta.deltaPercentage > 0 ? `+${weightDelta.deltaPercentage}` : weightDelta.deltaPercentage}%)
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed font-bold text-[#131b2e] m-0">
                      {t('De', 'From')} <span className="underline decoration-[#f59e0b] decoration-2 font-black">{weightDelta.previousWeightKg} kg</span> ({formatLocalDate(weightDelta.previousDate)}) {t('a', 'to')} <span className="underline decoration-[#f59e0b] decoration-2 font-black">{weightDelta.currentWeightKg} kg</span> ({formatLocalDate(weightDelta.currentDate)}).
                    </p>
                  </div>
                  {weightDelta.isSignificantChange && (
                    <div className="mt-2.5 pt-2 border-t border-[#fcd34d] text-xs flex items-center gap-1.5 font-black text-[#78350f]">
                      <Info className="w-4 h-4 shrink-0 text-[#b45309]" />
                      <span>{t('Variación ≥ 5% registrada entre fechas.', '≥ 5% variation recorded between dates.')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 2. CONTROL PROGRAMADO PREVIO (ALTO CONTRASTE ABSOLUTO) */}
              {pendingControl && (
                <div className="p-4 rounded-2xl border-2 bg-[#eff6ff] border-[#3b82f6] shadow-xs flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#1e3a8a] flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#1d4ed8] shrink-0" />
                        {t('Control Previo', 'Prior Follow-up')}
                      </span>
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-[#1e3a8a] text-white shadow-xs">
                        {formatLocalDate(pendingControl.scheduledControlDate)}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed font-bold text-[#131b2e] m-0">
                      {t('Programado en consulta del', 'Scheduled in consultation on')} <span className="font-black text-[#1e3a8a]">{formatLocalDate(pendingControl.originConsultationDate)}</span> {t('sin registro de consulta posterior a esa fecha.', 'with no subsequent consultation recorded after that date.')}
                    </p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-[#bfdbfe] text-xs flex items-center gap-1.5 font-black text-[#1e3a8a]">
                    <Info className="w-4 h-4 shrink-0 text-[#1d4ed8]" />
                    <span>{t('Control clínico pendiente de atención.', 'Clinical follow-up pending attention.')}</span>
                  </div>
                </div>
              )}

              {/* 3. ÚLTIMO TRATAMIENTO REGISTRADO (ALTO CONTRASTE ABSOLUTO) */}
              {lastTreatment && (
                <div className="p-4 rounded-2xl border-2 bg-white border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#131b2e] flex items-center gap-1.5">
                        <Pill className="w-4 h-4 text-primary shrink-0" />
                        {t('Último Tratamiento', 'Latest Treatment')}
                      </span>
                    </div>
                    {lastTreatment.hasStructuredPrescription && lastTreatment.prescriptionDetails && (
                      <div className="text-xs mb-2">
                        <span className="text-[10px] font-black text-primary block uppercase tracking-wider">{t('Receta', 'Prescription')} ({formatLocalDate(lastTreatment.prescriptionDetails.date)})</span>
                        <strong className="text-[#131b2e] font-black">{lastTreatment.prescriptionDetails.medication}</strong> - <span className="text-[#4a4455] font-bold">{lastTreatment.prescriptionDetails.dosage}</span>
                      </div>
                    )}
                    {lastTreatment.hasFreeTextTreatment && lastTreatment.freeTextTreatment && (
                      <div className="text-xs">
                        <span className="text-[10px] font-black text-[#4a4455] block uppercase tracking-wider">{t('Anotación', 'Note')} ({formatLocalDate(lastTreatment.freeTextTreatment.date)})</span>
                        <p className="line-clamp-2 text-[#131b2e] font-bold italic mt-1 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                          "{lastTreatment.freeTextTreatment.text}"
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-200 text-[11px] font-bold text-[#4a4455]">
                    {t('Documentado en visita previa.', 'Documented in previous visit.')}
                  </div>
                </div>
              )}

              {/* 4. OBSERVACIONES CLÍNICAS IMPORTANTES (ALTO CONTRASTE ABSOLUTO) */}
              {importantObservations.length > 0 && (
                <div className="p-4 rounded-2xl border-2 bg-white border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#131b2e] flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                        {t('Observaciones Clínicas', 'Clinical Observations')}
                      </span>
                    </div>
                    <ul className="text-xs space-y-1.5 list-disc list-inside">
                      {importantObservations.map((obs, idx) => (
                        <li key={idx} className="leading-relaxed text-[#131b2e] font-bold">
                          <span>{obs.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-200 text-[11px] font-bold text-[#4a4455]">
                    {t('Notas de manejo documentadas.', 'Documented handling notes.')}
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
