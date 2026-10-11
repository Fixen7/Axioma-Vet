import { useState } from 'react';
import { PlusCircle, FileText, Calendar, Trash2, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../components/ui/Button';

// Funciones utilitarias locales (para no depender de dependencias externas si no existen)
const formatLocalDate = (dateStr: string, includeTime = false) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  return date.toLocaleDateString('es-ES', options);
};

export default function UIPreview() {
  // Datos mockeados
  const [consultations] = useState([
    {
      id: '1',
      patientId: 'mock',
      reason: 'Control',
      observation: 'Paciente se presenta alerta y activo. Come bien, no hay vómitos ni diarrea. Peso estable (12.5 kg). Frecuencia cardíaca normal.',
      diagnosis: 'Evolución favorable del tratamiento post-operatorio.',
      treatment: 'Continuar con dieta actual. Se suspende el antibiótico. Mantener limpieza de herida 1 vez al día con suero fisiológico.',
      createdAt: '2023-10-25T10:30:00Z',
      nextControl: '2023-11-25'
    },
    {
      id: '2',
      patientId: 'mock',
      reason: 'Emergencia',
      observation: 'Llega con cojera de la extremidad posterior derecha tras caída desde altura. Dolor a la palpación en la zona de la cadera.',
      diagnosis: 'Luxación coxofemoral derecha.\nSospecha de fractura de fémur (pendiente Rx).',
      treatment: 'Administración de Meloxicam inyectable (0.2 mg/kg).\nToma de radiografías (AP y Lateral).\nReposo absoluto en jaula.',
      createdAt: '2023-09-15T15:45:00Z'
    },
    {
      id: '3',
      patientId: 'mock',
      reason: 'Consulta',
      observation: 'Consulta general anual y aplicación de vacunas. Condición corporal 3/5.',
      diagnosis: 'Paciente sano.',
      treatment: 'Se aplica vacuna Múltiple y Rabia.\nDesparasitación interna con Drontal.',
      createdAt: '2023-01-10T09:00:00Z',
      nextControl: '2024-01-10'
    }
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [, setEditId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'Emergencia': return 'bg-red-100 text-red-700 border-red-200';
      case 'Control': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Consulta': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div className="min-h-screen bg-surface p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 p-4 bg-primary-container/20 border border-primary/30 rounded-xl">
          <h2 className="font-headline-md text-primary m-0">Vista Previa de Interfaz (Solo Estética)</h2>
          <p className="font-body-sm text-on-surface-variant m-0 mt-1">Estos son datos de prueba falsos para que puedas revisar cómo luce el diseño final sin entrar a la base de datos.</p>
        </div>

        {/* COMPONENTE COPIADO */}
        <div className="flex flex-col gap-6 relative">
          <div className="flex justify-between items-center bg-surface sticky top-0 z-10 py-2 border-b border-surface-variant md:border-none md:static md:bg-transparent">
            <h3 className="font-headline-lg m-0 text-on-surface">Historia Clínica</h3>
            {!isAdding && (
              <Button variant="primary" onClick={() => { setEditId(null); setIsAdding(true); }} className="shadow-sm">
                <PlusCircle className="w-5 h-5 mr-1" /> Nueva Consulta
              </Button>
            )}
          </div>

          {isAdding && (
            <div className="bg-surface rounded-2xl p-5 md:p-8 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-surface-variant transition-all">
              <div className="border-b border-surface-variant pb-4 mb-2">
                <h4 className="font-display text-xl text-primary m-0 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Registro de Consulta
                </h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm uppercase tracking-wider text-outline">Motivo</label>
                  <select className="w-full h-11 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow text-on-surface">
                    <option value="Consulta">Consulta General</option>
                    <option value="Control">Control / Seguimiento</option>
                    <option value="Emergencia">Emergencia</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm uppercase tracking-wider text-outline">Próximo Control (Opcional)</label>
                  <input type="date" className="w-full h-11 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow text-on-surface" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm uppercase tracking-wider text-outline">Anamnesis y Examen Físico *</label>
                <textarea rows={3} className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y transition-shadow text-on-surface" placeholder="Síntomas, constantes vitales, estado general, peso..." />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm uppercase tracking-wider text-outline">Diagnóstico *</label>
                <textarea rows={2} className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y transition-shadow text-on-surface" placeholder="Diagnóstico presuntivo o definitivo..." />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm uppercase tracking-wider text-outline">Tratamiento e Indicaciones *</label>
                <textarea rows={3} className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y transition-shadow text-on-surface" placeholder="Medicamentos aplicados en clínica e indicaciones para la casa..." />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-surface-variant mt-2">
                <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
                <Button variant="primary" onClick={() => setIsAdding(false)}>Registrar Consulta</Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {consultations.map(consultation => {
              const isExpanded = expandedId === consultation.id;
              return (
                <article key={consultation.id} className={`bg-surface border rounded-2xl transition-all duration-300 overflow-hidden ${isExpanded ? 'border-primary/40 shadow-md my-2' : 'border-outline-variant hover:border-outline shadow-sm'}`}>
                  <div className="p-4 md:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer select-none" onClick={() => toggleExpand(consultation.id)}>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className={`px-2.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getReasonColor(consultation.reason)}`}>{consultation.reason}</div>
                      <span className="font-body-sm text-on-surface-variant flex items-center gap-1.5 whitespace-nowrap"><Calendar className="w-4 h-4 opacity-70" /> <span className="font-medium text-on-surface">{formatLocalDate(consultation.createdAt, true)}</span></span>
                    </div>
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                      <div className="flex-1 sm:hidden">
                        <p className="text-sm font-medium text-on-surface truncate pr-2">{consultation.diagnosis.split('\n')[0]}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {consultation.nextControl && !isExpanded && (
                          <div className="hidden md:flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">Próx: {formatLocalDate(consultation.nextControl)}</div>
                        )}
                        <div className="text-outline hover:text-on-surface transition-colors bg-surface-variant p-1.5 rounded-full">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 md:px-5 pb-5 pt-2 border-t border-surface-variant bg-surface-container-lowest animate-in slide-in-from-top-2 duration-200">
                      {consultation.nextControl && (
                        <div className="md:hidden mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1.5 rounded-md border border-primary/20">
                          <Calendar className="w-3.5 h-3.5" /> Próximo Control: {formatLocalDate(consultation.nextControl)}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                        <div className="flex flex-col gap-2">
                          <h5 className="font-label-sm uppercase tracking-wider text-outline m-0 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Observaciones</h5>
                          <p className="font-body-md text-on-surface m-0 whitespace-pre-wrap bg-surface p-3.5 rounded-xl border border-surface-variant leading-relaxed">{consultation.observation}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <h5 className="font-label-sm uppercase tracking-wider text-outline m-0 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Diagnóstico</h5>
                          <p className="font-body-md text-on-surface m-0 font-medium bg-surface p-3.5 rounded-xl border border-surface-variant leading-relaxed">{consultation.diagnosis}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 mt-6">
                        <h5 className="font-label-sm uppercase tracking-wider text-outline m-0 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Tratamiento</h5>
                        <p className="font-body-md text-on-surface m-0 whitespace-pre-wrap bg-surface p-3.5 rounded-xl border border-surface-variant leading-relaxed">{consultation.treatment}</p>
                      </div>
                      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-surface-variant">
                        <Button variant="ghost" className="h-9 px-3 text-sm"><Edit className="w-4 h-4 mr-1.5" /> Editar</Button>
                        <Button variant="ghost" className="h-9 px-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 className="w-4 h-4 mr-1.5" /> Eliminar</Button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
