import { useState, useEffect } from 'react';
import { PlusCircle, TestTube, Calendar, User, Trash2, Edit } from 'lucide-react';
import { Button } from '../ui/Button';
import { useVetContext } from '../../context/VetContext';
import type { LabResult } from '../../services/types';
import { getLocalDatetimeString, formatLocalDate, toUTCDateTime } from '../../utils/date';
import { useTranslation } from '../../i18n';

export function LabResultsTab({ patientId, isDeceased }: { patientId: string, isDeceased: boolean }) {
  const { t } = useTranslation();
  const { getLabs, saveLab, deleteLab, settings } = useVetContext();
  const [labs, setLabs] = useState<LabResult[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    examTypeSelect: '',
    customExamType: '',
    date: getLocalDatetimeString(),
    result: '',
    interpretation: '',
    veterinarian: settings?.doctorName || ''
  });

  const loadLabs = async () => {
    setIsLoading(true);
    const data = await getLabs(patientId);
    setLabs(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsLoading(false);
  };

  useEffect(() => {
    loadLabs();
  }, [patientId, getLabs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const finalExamType = formData.examTypeSelect === 'Otro' ? formData.customExamType : formData.examTypeSelect;

    if (!finalExamType || !formData.date || !formData.result || !formData.veterinarian) {
      alert(t('Por favor completa el tipo de examen, la fecha, los resultados y el nombre del veterinario.', 'Please complete the exam type, date, results, and veterinarian name.'));
      return;
    }

    await saveLab({
      id: editId || undefined,
      patientId,
      examType: finalExamType,
      date: toUTCDateTime(formData.date),
      result: formData.result,
      interpretation: formData.interpretation,
      veterinarian: formData.veterinarian
    });

    setIsAdding(false);
    setEditId(null);
    setFormData({
      examTypeSelect: '',
      customExamType: '',
      date: getLocalDatetimeString(),
      result: '',
      interpretation: '',
      veterinarian: settings?.doctorName || ''
    });
    loadLabs();
  };

  const handleEdit = (lab: LabResult) => {
    setFormData({
      examTypeSelect: examTypes.includes(lab.examType) ? lab.examType : 'Otro',
      customExamType: examTypes.includes(lab.examType) ? '' : lab.examType,
      date: getLocalDatetimeString(lab.date),
      result: lab.result,
      interpretation: lab.interpretation || '',
      veterinarian: lab.veterinarian
    });
    setEditId(lab.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancel = () => {
    setIsAdding(false);
    setEditId(null);
    setFormData({
      examTypeSelect: '',
      customExamType: '',
      date: getLocalDatetimeString(),
      result: '',
      interpretation: '',
      veterinarian: settings?.doctorName || ''
    });
  };



  const handleDelete = async (id: string) => {
    if (window.confirm(t('¿Seguro que quieres eliminar este resultado de laboratorio? Esta acción no se puede deshacer.', 'Are you sure you want to delete this lab result? This action cannot be undone.'))) {
      try {
        await deleteLab(id);
        loadLabs();
      } catch (error: any) {
        alert(t('Error al eliminar: ', 'Error deleting: ') + error.message);
      }
    }
  };

  const examTypes = [
    'Hemograma',
    'Química sanguínea',
    'Coproparasitario',
    'Urianálisis',
    'Otro'
  ];

  const translateExamType = (type: string) => {
    const map: Record<string, string> = {
      Hemograma: t('Hemograma', 'CBC (Complete Blood Count)'),
      'Química sanguínea': t('Química sanguínea', 'Blood Chemistry'),
      Coproparasitario: t('Coproparasitario', 'Fecal Exam'),
      'Urianálisis': t('Urianálisis', 'Urinalysis'),
      Otro: t('Otro', 'Other'),
    };
    return map[type] || type;
  };

  if (isLoading) return <div className="py-8 text-outline">{t('Cargando resultados...', 'Loading results...')}</div>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h3 className="font-headline-lg m-0">{t('Resultados de Laboratorio', 'Lab Results')}</h3>
        {!isDeceased && !isAdding && (
          <Button variant="primary" onClick={() => { setEditId(null); setIsAdding(true); }}>
            <PlusCircle className="w-5 h-5" /> {t('Nuevo Resultado', 'New Result')}
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-surface-container-lowest border border-primary-container p-6 rounded-2xl flex flex-col gap-6 shadow-sm">
          <h4 className="font-headline-md m-0 text-primary">{editId ? t('Editar Resultado', 'Edit Result') : t('Registrar Examen de Laboratorio', 'Record Lab Exam')}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">{t('Tipo de Examen *', 'Exam Type *')}</label>
              <select 
                name="examTypeSelect" 
                value={formData.examTypeSelect} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
              >
                <option value="" disabled>{t('Selecciona un examen...', 'Select an exam...')}</option>
                {examTypes.map(e => <option key={e} value={e}>{translateExamType(e)}</option>)}
              </select>
            </div>
            
            {formData.examTypeSelect === 'Otro' && (
              <div className="flex flex-col gap-2 md:col-start-2">
                <label className="font-label-md text-on-surface-variant">{t('Especificar Examen *', 'Specify Exam *')}</label>
                <input 
                  type="text" 
                  name="customExamType" 
                  value={formData.customExamType} 
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
                  placeholder={t('Nombre del examen', 'Exam name')}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">{t('Fecha del Resultado *', 'Result Date *')}</label>
              <input 
                type="datetime-local" 
                name="date" 
                value={formData.date} 
                onChange={handleChange}
                disabled={!!editId}
                className={`w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none ${editId ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">{t('Veterinario Responsable *', 'Responsible Veterinarian *')}</label>
              <input 
                type="text" 
                name="veterinarian" 
                value={formData.veterinarian} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
                placeholder={t('Dr(a). Nombre', 'Dr. Name')}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-md text-on-surface-variant">{t('Resultados *', 'Results *')}</label>
            <textarea 
              name="result" 
              value={formData.result} 
              onChange={handleChange}
              rows={3}
              className="w-full p-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none resize-none"
              placeholder={t('Valores, hallazgos principales...', 'Values, key findings...')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-md text-on-surface-variant">{t('Interpretación / Observaciones (Opcional)', 'Interpretation / Notes (Optional)')}</label>
            <textarea 
              name="interpretation" 
              value={formData.interpretation} 
              onChange={handleChange}
              rows={2}
              className="w-full p-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none resize-none"
              placeholder={t('Conclusiones clínicas del examen...', 'Clinical conclusions of the exam...')}
            />
          </div>

          <div className="flex justify-end gap-4 mt-2">
            <Button variant="ghost" onClick={handleCancel}>{t('Cancelar', 'Cancel')}</Button>
            <Button variant="primary" onClick={handleSubmit}>{editId ? t('Actualizar Resultado', 'Update Result') : t('Guardar Resultado', 'Save Result')}</Button>
          </div>
        </div>
      )}

      {labs.length === 0 && !isAdding ? (
        <div className="py-12 flex flex-col items-center justify-center text-outline bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
          <TestTube className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-body-lg m-0">{t('No hay exámenes de laboratorio registrados.', 'No lab exams recorded.')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {labs.map(lab => (
            <article key={lab.id} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col gap-4 hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start border-b border-surface-variant pb-4 mb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-label-caps tracking-widest text-primary uppercase">{translateExamType(lab.examType)}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(lab)} className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-primary-container/20 transition-colors" title={t('Editar registro', 'Edit record')}>
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(lab.id)} className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors" title={t('Eliminar registro', 'Delete record')}>
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <span className="font-body-sm text-on-surface-variant flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> {formatLocalDate(lab.date, true)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-outline bg-surface-container-high px-3 py-1 rounded-full font-label-sm">
                  <User className="w-4 h-4" />
                  {lab.veterinarian}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="flex flex-col gap-1">
                  <h5 className="font-label-md text-on-surface-variant m-0 uppercase">{t('Resultados', 'Results')}</h5>
                  <p className="font-body-md text-on-surface m-0 whitespace-pre-wrap">{lab.result}</p>
                </div>
                {lab.interpretation && (
                  <div className="flex flex-col gap-1">
                    <h5 className="font-label-md text-on-surface-variant m-0 uppercase">{t('Interpretación', 'Interpretation')}</h5>
                    <p className="font-body-md text-on-surface m-0 font-medium">{lab.interpretation}</p>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
