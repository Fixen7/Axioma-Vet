import { useState, useEffect } from 'react';
import { PlusCircle, FileText, Calendar, Trash2, Edit } from 'lucide-react';
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
  const handleDelete = async (id: string) => {
    if (window.confirm("¿Seguro que quieres eliminar esta consulta? Esta acción no se puede deshacer.")) {
      try {
        await deleteConsultation(id);
        loadConsultations();
      } catch (error: any) {
        alert("Error al eliminar: " + error.message);
      }
    }
  };

  if (isLoading) return <div className="py-8 text-outline">Cargando historia clínica...</div>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h3 className="font-headline-lg m-0">Historia Clínica</h3>
        {!isDeceased && !isAdding && (
          <Button variant="primary" onClick={() => { setEditId(null); setIsAdding(true); }}>
            <PlusCircle className="w-5 h-5" /> Nueva Consulta
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-surface-container-lowest border border-primary-container p-6 rounded-2xl flex flex-col gap-6 shadow-sm">
          <h4 className="font-headline-md m-0 text-primary">{editId ? 'Editar Consulta' : 'Registrar Nueva Consulta'}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">Motivo</label>
              <select 
                name="reason" 
                value={formData.reason} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
              >
                <option value="Consulta">Consulta General</option>
                <option value="Control">Control / Seguimiento</option>
                <option value="Emergencia">Emergencia</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">Próximo Control (Opcional)</label>
              <input 
                type="date" 
                name="nextControl" 
                value={formData.nextControl} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-md text-on-surface-variant">Observaciones / Anamnesis *</label>
            <textarea 
              name="observation" 
              value={formData.observation} 
              onChange={handleChange}
              rows={3}
              className="w-full p-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none resize-none"
              placeholder="Síntomas, constantes vitales, estado general..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-md text-on-surface-variant">Diagnóstico *</label>
            <textarea 
              name="diagnosis" 
              value={formData.diagnosis} 
              onChange={handleChange}
              rows={2}
              className="w-full p-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none resize-none"
              placeholder="Diagnóstico presuntivo o definitivo..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-md text-on-surface-variant">Tratamiento Realizado / Indicaciones *</label>
            <textarea 
              name="treatment" 
              value={formData.treatment} 
              onChange={handleChange}
              rows={3}
              className="w-full p-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none resize-none"
              placeholder="Medicamentos aplicados, indicaciones para la casa..."
            />
          </div>

          <div className="flex justify-end gap-4 mt-2">
            <Button variant="ghost" onClick={handleCancel}>Cancelar</Button>
            <Button variant="primary" onClick={handleSubmit}>{editId ? 'Actualizar Consulta' : 'Guardar Consulta'}</Button>
          </div>
        </div>
      )}

      {consultations.length === 0 && !isAdding ? (
        <div className="py-12 flex flex-col items-center justify-center text-outline bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
          <FileText className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-body-lg m-0">No hay consultas registradas.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {consultations.map(consultation => (
            <article key={consultation.id} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col gap-4 hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start border-b border-surface-variant pb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-label-caps tracking-widest text-primary uppercase">{consultation.reason}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(consultation)} className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-primary-container/20 transition-colors" title="Editar registro">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(consultation.id)} className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors" title="Eliminar registro">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <span className="font-body-sm text-on-surface-variant flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> {formatLocalDate(consultation.createdAt, true)}
                  </span>
                </div>
                {consultation.nextControl && (
                  <div className="bg-primary-container/10 text-primary border border-primary-container/20 px-3 py-1 rounded-full font-label-sm">
                    Próx. Control: {formatLocalDate(consultation.nextControl)}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="flex flex-col gap-1">
                  <h5 className="font-label-md text-on-surface-variant m-0 uppercase">Observaciones</h5>
                  <p className="font-body-md text-on-surface m-0 whitespace-pre-wrap">{consultation.observation}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <h5 className="font-label-md text-on-surface-variant m-0 uppercase">Diagnóstico</h5>
                  <p className="font-body-md text-on-surface m-0 font-medium">{consultation.diagnosis}</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-1 mt-2 bg-surface-container-low p-4 rounded-xl">
                <h5 className="font-label-md text-on-surface-variant m-0 uppercase">Tratamiento</h5>
                <p className="font-body-md text-on-surface m-0 whitespace-pre-wrap">{consultation.treatment}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
