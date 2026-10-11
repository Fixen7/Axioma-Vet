import { useState, useEffect } from 'react';
import { PlusCircle, FileText, Calendar, Trash2, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { useVetContext } from '../../context/VetContext';
import type { Consultation } from '../../services/types';
import { formatLocalDate } from '../../utils/date';

export function ClinicalHistoryTab({ patientId, isDeceased }: { patientId: string, isDeceased: boolean }) {
  const { getConsultations, saveConsultation, deleteConsultation } = useVetContext();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    reason: 'Consulta' as 'Consulta' | 'Control' | 'Emergencia' | 'Otro',
    observation: '',
    diagnosis: '',
    treatment: '',
    nextControl: ''
  });

  const loadConsultations = async () => {
    setIsLoading(true);
    const data = await getConsultations(patientId);
    setConsultations(data.sort((a, b) => {
      const timeA = isNaN(new Date(a.createdAt).getTime()) ? 0 : new Date(a.createdAt).getTime();
      const timeB = isNaN(new Date(b.createdAt).getTime()) ? 0 : new Date(b.createdAt).getTime();
      return timeB - timeA;
    }));
    setIsLoading(false);
  };

  useEffect(() => {
    loadConsultations();
  }, [patientId, getConsultations]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.observation || !formData.diagnosis || !formData.treatment) {
      alert('Por favor completa las observaciones, el diagnóstico y el tratamiento.');
      return;
    }

    await saveConsultation({
      id: editId || undefined,
      patientId,
      ...formData,
      nextControl: formData.nextControl || undefined
    });

    setIsAdding(false);
    setEditId(null);
    setFormData({
      reason: 'Consulta',
      observation: '',
      diagnosis: '',
      treatment: '',
      nextControl: ''
    });
    loadConsultations();
  };

  const handleEdit = (consultation: Consultation) => {
    setFormData({
      reason: consultation.reason as any,
      observation: consultation.observation,
      diagnosis: consultation.diagnosis,
      treatment: consultation.treatment,
      nextControl: consultation.nextControl || ''
    });
    setEditId(consultation.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancel = () => {
    setIsAdding(false);
    setEditId(null);
    setFormData({
      reason: 'Consulta',
      observation: '',
      diagnosis: '',
      treatment: '',
      nextControl: ''
    });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("¿Seguro que quieres eliminar esta consulta? Esta acción no se puede deshacer.")) {
      try {
        await deleteConsultation(id);
        loadConsultations();
      } catch (error: any) {
        alert("Error al eliminar: " + error.message);
      }
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'Emergencia': return 'bg-red-100 text-red-700 border-red-200';
      case 'Control': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Consulta': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) return <div className="py-8 text-outline animate-pulse text-center font-medium">Cargando historia clínica...</div>;

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex justify-between items-center bg-surface sticky top-0 z-10 py-2 border-b border-surface-variant md:border-none md:static md:bg-transparent">
        <h3 className="font-headline-lg m-0 text-on-surface">Historia Clínica</h3>
        {!isDeceased && !isAdding && (
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
              {editId ? 'Editar Consulta' : 'Registro de Consulta'}
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm uppercase tracking-wider text-outline">Motivo</label>
              <select 
                name="reason" 
                value={formData.reason} 
                onChange={handleChange}
                className="w-full h-11 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow text-on-surface"
              >
                <option value="Consulta">Consulta General</option>
                <option value="Control">Control / Seguimiento</option>
                <option value="Emergencia">Emergencia</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm uppercase tracking-wider text-outline">Próximo Control (Opcional)</label>
              <input 
                type="date" 
                name="nextControl" 
                value={formData.nextControl} 
                onChange={handleChange}
                className="w-full h-11 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow text-on-surface"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm uppercase tracking-wider text-outline">Anamnesis y Examen Físico *</label>
            <textarea 
              name="observation" 
              value={formData.observation} 
              onChange={handleChange}
              rows={3}
              className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y transition-shadow text-on-surface"
              placeholder="Síntomas, constantes vitales, estado general, peso..."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm uppercase tracking-wider text-outline">Diagnóstico *</label>
            <textarea 
              name="diagnosis" 
              value={formData.diagnosis} 
              onChange={handleChange}
              rows={2}
              className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y transition-shadow text-on-surface"
              placeholder="Diagnóstico presuntivo o definitivo..."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm uppercase tracking-wider text-outline">Tratamiento e Indicaciones *</label>
            <textarea 
              name="treatment" 
              value={formData.treatment} 
              onChange={handleChange}
              rows={3}
              className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y transition-shadow text-on-surface"
              placeholder="Medicamentos aplicados en clínica e indicaciones para la casa..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-variant mt-2">
            <Button variant="ghost" onClick={handleCancel}>Cancelar</Button>
            <Button variant="primary" onClick={handleSubmit}>{editId ? 'Guardar Cambios' : 'Registrar Consulta'}</Button>
          </div>
        </div>
      )}

      {consultations.length === 0 && !isAdding ? (
        <div className="py-16 flex flex-col items-center justify-center text-outline bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant">
          <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 opacity-60" />
          </div>
          <p className="font-body-lg m-0 text-on-surface-variant">Aún no hay consultas registradas.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {consultations.map(consultation => {
            const isExpanded = expandedId === consultation.id;
            return (
              <article 
                key={consultation.id} 
                className={`bg-surface border rounded-2xl transition-all duration-300 overflow-hidden ${isExpanded ? 'border-primary/40 shadow-md my-2' : 'border-outline-variant hover:border-outline shadow-sm'}`}
              >
                {/* Cabecera Colapsable */}
                <div 
                  className="p-4 md:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer select-none"
                  onClick={() => toggleExpand(consultation.id)}
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className={`px-2.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getReasonColor(consultation.reason)}`}>
                      {consultation.reason}
                    </div>
                    <span className="font-body-sm text-on-surface-variant flex items-center gap-1.5 whitespace-nowrap">
                      <Calendar className="w-4 h-4 opacity-70" /> 
                      <span className="font-medium text-on-surface">{formatLocalDate(consultation.createdAt, true)}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                    <div className="flex-1 sm:hidden">
                      <p className="text-sm font-medium text-on-surface truncate pr-2">
                        {consultation.diagnosis.split('\n')[0]}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {consultation.nextControl && !isExpanded && (
                        <div className="hidden md:flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                          Próx: {formatLocalDate(consultation.nextControl)}
                        </div>
                      )}
                      <div className="text-outline hover:text-on-surface transition-colors bg-surface-variant p-1.5 rounded-full">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenido Expandible */}
                {isExpanded && (
                  <div className="px-4 md:px-5 pb-5 pt-2 border-t border-surface-variant bg-surface-container-lowest animate-in slide-in-from-top-2 duration-200">
                    
                    {consultation.nextControl && (
                      <div className="md:hidden mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1.5 rounded-md border border-primary/20">
                        <Calendar className="w-3.5 h-3.5" /> Próximo Control: {formatLocalDate(consultation.nextControl)}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                      <div className="flex flex-col gap-2">
                        <h5 className="font-label-sm uppercase tracking-wider text-outline m-0 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Observaciones
                        </h5>
                        <p className="font-body-md text-on-surface m-0 whitespace-pre-wrap bg-surface p-3.5 rounded-xl border border-surface-variant leading-relaxed">
                          {consultation.observation}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <h5 className="font-label-sm uppercase tracking-wider text-outline m-0 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Diagnóstico
                        </h5>
                        <p className="font-body-md text-on-surface m-0 font-medium bg-surface p-3.5 rounded-xl border border-surface-variant leading-relaxed">
                          {consultation.diagnosis}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 mt-6">
                      <h5 className="font-label-sm uppercase tracking-wider text-outline m-0 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Tratamiento
                      </h5>
                      <p className="font-body-md text-on-surface m-0 whitespace-pre-wrap bg-surface p-3.5 rounded-xl border border-surface-variant leading-relaxed">
                        {consultation.treatment}
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-surface-variant">
                      <Button 
                        variant="ghost" 
                        onClick={(e) => { e.stopPropagation(); handleEdit(consultation); }}
                        className="h-9 px-3 text-sm"
                      >
                        <Edit className="w-4 h-4 mr-1.5" /> Editar
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={(e) => handleDelete(consultation.id, e)} 
                        className="h-9 px-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" /> Eliminar
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

