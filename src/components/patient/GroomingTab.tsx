import { useState, useEffect } from 'react';
import { PlusCircle, Scissors, Calendar, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useVetContext } from '../../context/VetContext';
import type { Grooming } from '../../services/types';
import { getLocalDatetimeString, formatLocalDate, toUTCDateTime } from '../../utils/date';
import { useTranslation } from '../../i18n';

export function GroomingTab({ patientId, isDeceased }: { patientId: string, isDeceased: boolean }) {
  const { t } = useTranslation();
  const { getGroomings, saveGrooming, deleteGrooming } = useVetContext();
  const [groomings, setGroomings] = useState<Grooming[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    service: '',
    date: getLocalDatetimeString(),
    observations: ''
  });

  const loadGroomings = async () => {
    setIsLoading(true);
    const data = await getGroomings(patientId);
    setGroomings(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsLoading(false);
  };

  useEffect(() => {
    loadGroomings();
  }, [patientId, getGroomings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.service || !formData.date) {
      alert(t('Por favor completa todos los campos obligatorios (*).', 'Please complete all required fields (*).'));
      return;
    }

    await saveGrooming({
      patientId,
      service: formData.service,
      date: toUTCDateTime(formData.date),
      observations: formData.observations || undefined
    });

    setIsAdding(false);
    setFormData({
      service: '',
      date: getLocalDatetimeString(),
      observations: ''
    });
    loadGroomings();
  };

  const handleCancel = () => {
    setIsAdding(false);
    setFormData({
      service: '',
      date: getLocalDatetimeString(),
      observations: ''
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('¿Seguro que quieres eliminar este registro de peluquería?', 'Are you sure you want to delete this grooming record?'))) {
      try {
        await deleteGrooming(id);
        loadGroomings();
      } catch (error: any) {
        alert(t('Error al eliminar: ', 'Error deleting: ') + error.message);
      }
    }
  };

  if (isLoading) return <div className="py-8 text-outline">{t('Cargando historial de peluquería...', 'Loading grooming history...')}</div>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h3 className="font-headline-lg m-0">{t('Historial de Peluquería', 'Grooming History')}</h3>
        {!isDeceased && !isAdding && (
          <Button variant="primary" onClick={() => setIsAdding(true)}>
            <PlusCircle className="w-5 h-5" /> {t('Nuevo Registro', 'New Record')}
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-surface-container-lowest border border-primary-container p-6 rounded-2xl flex flex-col gap-6 shadow-sm">
          <h4 className="font-headline-md m-0 text-primary">{t('Registrar Sesión de Peluquería', 'Record Grooming Session')}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">{t('Servicio Realizado *', 'Service Performed *')}</label>
              <input 
                type="text" 
                name="service" 
                value={formData.service} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
                placeholder={t('Ej. Baño y Corte, Deslanado...', 'e.g. Bath & Trim, Deshedding...')}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">{t('Fecha *', 'Date *')}</label>
              <input 
                type="datetime-local" 
                name="date" 
                value={formData.date} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-md text-on-surface-variant">{t('Observaciones (Opcional)', 'Observations (Optional)')}</label>
            <textarea 
              name="observations" 
              value={formData.observations} 
              onChange={handleChange}
              rows={3}
              className="w-full p-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none resize-none"
              placeholder={t('Notas sobre comportamiento, alergias notadas, etc.', 'Notes on behavior, allergies noticed, etc.')}
            />
          </div>

          <div className="flex justify-end gap-4 mt-2">
            <Button variant="ghost" onClick={handleCancel}>{t('Cancelar', 'Cancel')}</Button>
            <Button variant="primary" onClick={handleSubmit}>{t('Guardar Registro', 'Save Record')}</Button>
          </div>
        </div>
      )}

      {groomings.length === 0 && !isAdding ? (
        <div className="py-12 flex flex-col items-center justify-center text-outline bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
          <Scissors className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-body-lg m-0">{t('No hay registros de peluquería.', 'No grooming records found.')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groomings.map(grooming => (
            <article key={grooming.id} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col gap-4 hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="font-label-caps tracking-widest text-primary uppercase">{grooming.service}</span>
                  <span className="font-body-sm text-on-surface-variant flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> {formatLocalDate(grooming.date, true)}
                  </span>
                </div>
                <button onClick={() => handleDelete(grooming.id)} className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors" title={t('Eliminar registro', 'Delete record')}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              {grooming.observations && (
                <div className="flex flex-col gap-1 pt-2 border-t border-surface-variant">
                  <h5 className="font-label-md text-on-surface-variant m-0 uppercase">{t('Observaciones', 'Observations')}</h5>
                  <p className="font-body-md text-on-surface m-0 whitespace-pre-wrap">{grooming.observations}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
