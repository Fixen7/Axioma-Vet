import { useState, useEffect, useMemo } from 'react';
import { X, Search, Stethoscope, Sparkles, Filter, Calendar, Activity, Pill } from 'lucide-react';
import { useVetContext } from '../../context/VetContext';
import type { Patient, Consultation } from '../../services/types';
import { formatLocalDate } from '../../utils/date';

interface SimilarCasesModalProps {
  currentPatient: Patient;
  initialDiagnosis?: string;
  onClose: () => void;
}

export function SimilarCasesModal({
  currentPatient,
  initialDiagnosis = '',
  onClose
}: SimilarCasesModalProps) {
  const { getAllConsultations, patients } = useVetContext();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialDiagnosis);
  const [filterSameSpecies, setFilterSameSpecies] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Mapa rápido de ID de paciente a objeto Patient
  const patientsMap = useMemo(() => {
    const map = new Map<string, Patient>();
    patients.forEach(p => map.set(p.id, p));
    return map;
  }, [patients]);

  useEffect(() => {
    const loadAll = async () => {
      try {
        setIsLoading(true);
        const all = await getAllConsultations();
        setConsultations(all);
      } catch (err) {
        console.error('Error al cargar consultas clínicas:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAll();
  }, [getAllConsultations]);

  // Filtrado de consultas similares excluyendo consultas del mismo paciente actual
  const matchingCases = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const query = searchTerm.toLowerCase().trim();

    return consultations.filter(c => {
      // Excluir al paciente actual para comparar con otros pacientes
      if (c.patientId === currentPatient.id) return false;

      const pat = patientsMap.get(c.patientId);
      if (filterSameSpecies && pat) {
        if (pat.species.toLowerCase() !== currentPatient.species.toLowerCase()) {
          return false;
        }
      }

      const matchDiag = (c.diagnosis || '').toLowerCase().includes(query);
      const matchReason = (c.reason || '').toLowerCase().includes(query);
      const matchObs = (c.observation || '').toLowerCase().includes(query);

      return matchDiag || matchReason || matchObs;
    });
  }, [consultations, searchTerm, filterSameSpecies, currentPatient, patientsMap]);

  // Agregación de tratamientos frecuentes usados en esos casos
  const treatmentSummary = useMemo(() => {
    const treatments: { [key: string]: number } = {};

    matchingCases.forEach(c => {
      if (c.treatment && c.treatment.trim() !== '') {
        const clean = c.treatment.trim();
        treatments[clean] = (treatments[clean] || 0) + 1;
      }
    });

    return Object.entries(treatments)
      .map(([treatment, count]) => ({ treatment, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [matchingCases]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest text-on-surface w-full max-w-2xl rounded-[24px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-outline-variant/40">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-surface-container-high bg-surface-container-low/50">
          <div className="flex items-center gap-2.5 text-primary">
            <Sparkles className="w-6 h-6" />
            <div>
              <h3 className="font-headline-sm m-0 text-base md:text-lg">Casos Similares en la Clínica</h3>
              <p className="text-xs text-on-surface-variant m-0">Memoria de diagnósticos y tratamientos registrados previamente</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-outline hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BUSCADOR Y FILTROS */}
        <div className="p-4 border-b border-surface-container-high bg-surface flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-outline" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por diagnóstico o síntoma (ej: gastroenteritis, otitis, dermatitis)..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-primary"
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterSameSpecies(prev => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              filterSameSpecies
                ? 'bg-primary/10 border-primary text-primary'
                : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Solo {currentPatient.species}s
          </button>
        </div>

        {/* RESULTADOS */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {isLoading ? (
            <div className="w-full py-12 flex justify-center text-outline">
              Consultando la memoria clínica de la clínica...
            </div>
          ) : !searchTerm.trim() ? (
            <div className="w-full py-12 flex flex-col items-center text-outline gap-2">
              <Stethoscope className="w-10 h-10 opacity-40" />
              <p className="text-sm font-medium text-center m-0">Escribe un diagnóstico o síntoma para contrastar con casos anteriores.</p>
              <p className="text-xs opacity-70 text-center m-0">Ejemplo: «otitis», «parvovirus», «gastritis», «alergia»</p>
            </div>
          ) : matchingCases.length === 0 ? (
            <div className="w-full py-12 flex flex-col items-center text-outline gap-2">
              <Activity className="w-10 h-10 opacity-40" />
              <p className="text-sm font-medium text-center m-0">No se encontraron casos registrados con ese término{filterSameSpecies ? ` en ${currentPatient.species}s` : ''}.</p>
              {filterSameSpecies && (
                <button
                  type="button"
                  onClick={() => setFilterSameSpecies(false)}
                  className="text-xs text-primary underline mt-1"
                >
                  Buscar en todas las especies
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              
              {/* RESUMEN ESTADÍSTICO DETERMINISTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/40 flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant font-medium">Casos coincidentes:</span>
                  <span className="text-lg font-bold text-primary">{matchingCases.length} {matchingCases.length === 1 ? 'paciente' : 'pacientes'}</span>
                </div>
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/40 flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant font-medium">Especie evaluada:</span>
                  <span className="text-xs font-bold text-on-surface uppercase">{filterSameSpecies ? currentPatient.species : 'Todas'}</span>
                </div>
              </div>

              {/* TRATAMIENTOS DOCUMENTADOS */}
              {treatmentSummary.length > 0 && (
                <div className="border border-outline-variant/40 rounded-2xl p-4 bg-surface-container-lowest flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                    <Pill className="w-4 h-4" />
                    <span>Tratamientos documentados en estos casos</span>
                  </div>
                  <div className="flex flex-col gap-1.5 divide-y divide-surface-container-high">
                    {treatmentSummary.map((item, idx) => (
                      <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between gap-3 text-xs">
                        <span className="text-on-surface font-medium leading-relaxed">{item.treatment}</span>
                        <span className="shrink-0 bg-surface-container-high px-2 py-0.5 rounded text-[11px] font-bold text-on-surface-variant">
                          {item.count} {item.count === 1 ? 'caso' : 'casos'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LISTA DETALLADA DE HISTORIALES */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-outline">
                  Casos de referencia documentados ({matchingCases.length})
                </h4>

                <div className="flex flex-col gap-3">
                  {matchingCases.slice(0, 10).map(c => {
                    const pat = patientsMap.get(c.patientId);
                    return (
                      <div 
                        key={c.id} 
                        className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest flex flex-col gap-2 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-on-surface">
                            {pat ? `${pat.name} (${pat.species}${pat.breed ? ` · ${pat.breed}` : ''})` : 'Paciente'}
                          </span>
                          <span className="text-[11px] text-outline flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatLocalDate(c.createdAt)}
                          </span>
                        </div>

                        {c.diagnosis && (
                          <p className="text-xs font-medium text-on-surface m-0">
                            <strong>Diagnóstico:</strong> {c.diagnosis}
                          </p>
                        )}

                        {c.observation && (
                          <p className="text-xs text-on-surface-variant m-0 italic line-clamp-2">
                            "{c.observation}"
                          </p>
                        )}

                        {c.treatment && (
                          <div className="mt-1 pt-1.5 border-t border-outline-variant/20 text-xs text-primary font-medium">
                            <strong>Tratamiento:</strong> {c.treatment}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-surface-container-high bg-surface flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-surface-container text-on-surface font-label-md hover:bg-surface-container-high transition-colors text-xs font-medium"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
