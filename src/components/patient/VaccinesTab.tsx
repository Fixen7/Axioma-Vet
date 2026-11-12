import { useState, useEffect } from 'react';
import { PlusCircle, Syringe, Calendar, ShieldCheck, Trash2, Edit } from 'lucide-react';
import { Button } from '../ui/Button';
import { useVetContext } from '../../context/VetContext';
import type { Vaccine } from '../../services/types';
import { getLocalDatetimeString, formatLocalDate, toUTCDateTime } from '../../utils/date';
import { useTranslation } from '../../i18n';

export function VaccinesTab({ patientId, isDeceased }: { patientId: string, isDeceased: boolean }) {
  const { t } = useTranslation();
  const { getVaccines, saveVaccine, deleteVaccine, settings } = useVetContext();
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    vaccineSelect: '',
    customVaccineName: '',
    applicationDate: getLocalDatetimeString(),
    nextDose: '',
    batch: '',
    manufacturer: '',
    veterinarian: settings?.doctorName || '',
    observations: ''
  });

  const loadVaccines = async () => {
    setIsLoading(true);
    const data = await getVaccines(patientId);
    setVaccines(data.sort((a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()));
    setIsLoading(false);
  };

  useEffect(() => {
    loadVaccines();
  }, [patientId, getVaccines]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const finalVaccineName = formData.vaccineSelect === 'Otra' ? formData.customVaccineName : formData.vaccineSelect;

    if (!finalVaccineName || !formData.applicationDate) {
      alert(t('Por favor completa el nombre de la vacuna y la fecha de aplicación.', 'Please enter the vaccine name and application date.'));
      return;
    }

    await saveVaccine({
      id: editId || undefined,
      patientId,
      vaccineName: finalVaccineName,
      applicationDate: toUTCDateTime(formData.applicationDate),
      nextDose: formData.nextDose || undefined,
      batch: formData.batch,
      manufacturer: formData.manufacturer,
      observations: formData.observations
    });

    setIsAdding(false);
    setEditId(null);
    setFormData({
      vaccineSelect: '',
      customVaccineName: '',
      applicationDate: getLocalDatetimeString(),
      nextDose: '',
      batch: '',
      manufacturer: '',
      veterinarian: settings?.doctorName || '',
      observations: ''
    });
    loadVaccines();
  };
  const handleEdit = (vaccine: Vaccine) => {
    setFormData({
      vaccineSelect: commonVaccines.includes(vaccine.vaccineName) ? vaccine.vaccineName : 'Otra',
      customVaccineName: commonVaccines.includes(vaccine.vaccineName) ? '' : vaccine.vaccineName,
      applicationDate: getLocalDatetimeString(vaccine.applicationDate),
      nextDose: vaccine.nextDose || '',
      batch: vaccine.batch || '',
      manufacturer: vaccine.manufacturer || '',
      veterinarian: settings?.doctorName || '',
      observations: vaccine.observations || ''
    });
    setEditId(vaccine.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancel = () => {
    setIsAdding(false);
    setEditId(null);
    setFormData({
      vaccineSelect: '',
      customVaccineName: '',
      applicationDate: getLocalDatetimeString(),
      nextDose: '',
      batch: '',
      manufacturer: '',
      veterinarian: settings?.doctorName || '',
      observations: ''
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('¿Seguro que quieres eliminar este registro de vacuna? Esta acción no se puede deshacer.', 'Are you sure you want to delete this vaccine record? This action cannot be undone.'))) {
      try {
        await deleteVaccine(id);
        loadVaccines();
      } catch (error: any) {
        alert(t('Error al eliminar: ', 'Error deleting: ') + error.message);
      }
    }
  };

  const commonVaccines = [
    'Rabia',
    'Parvovirus',
    'Moquillo',
    'Séxtuple',
    'Triple Felina',
    'Leucemia Felina',
    'Otra'
  ];

  const translateVaccineName = (name: string) => {
    const map: Record<string, string> = {
      Rabia: t('Rabia', 'Rabies'),
      Parvovirus: t('Parvovirus', 'Parvovirus'),
      Moquillo: t('Moquillo', 'Distemper'),
      'Séxtuple': t('Séxtuple', 'DHPPi-L (6-in-1)'),
      'Triple Felina': t('Triple Felina', 'FVRCP (Feline Triple)'),
      'Leucemia Felina': t('Leucemia Felina', 'Feline Leukemia (FeLV)'),
      Otra: t('Otra', 'Other'),
    };
    return map[name] || name;
  };

  if (isLoading) return <div className="py-8 text-outline">{t('Cargando vacunas...', 'Loading vaccines...')}</div>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h3 className="font-headline-lg m-0">{t('Registro de Vacunación', 'Vaccination Record')}</h3>
        {!isDeceased && !isAdding && (
          <Button variant="primary" onClick={() => { setEditId(null); setIsAdding(true); }}>
            <PlusCircle className="w-5 h-5" /> {t('Nueva Vacuna', 'New Vaccine')}
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-surface-container-lowest border border-primary-container p-6 rounded-2xl flex flex-col gap-6 shadow-sm">
          <h4 className="font-headline-md m-0 text-primary">{editId ? t('Editar Vacuna', 'Edit Vaccine') : t('Registrar Nueva Vacuna', 'Record New Vaccine')}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">{t('Vacuna *', 'Vaccine *')}</label>
              <select 
                name="vaccineSelect" 
                value={formData.vaccineSelect} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
              >
                <option value="" disabled>{t('Selecciona una vacuna...', 'Select a vaccine...')}</option>
                {commonVaccines.map(v => <option key={v} value={v}>{translateVaccineName(v)}</option>)}
              </select>
            </div>
            
            {formData.vaccineSelect === 'Otra' && (
              <div className="flex flex-col gap-2 md:col-start-2">
                <label className="font-label-md text-on-surface-variant">{t('Nombre de Vacuna *', 'Vaccine Name *')}</label>
                <input 
                  type="text" 
                  name="customVaccineName" 
                  value={formData.customVaccineName} 
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
                  placeholder={t('Especifica la vacuna', 'Specify vaccine')}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">{t('Fecha de Aplicación *', 'Application Date *')}</label>
              <input 
                type="datetime-local" 
                name="applicationDate" 
                value={formData.applicationDate} 
                onChange={handleChange}
                disabled={!!editId}
                className={`w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none ${editId ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">{t('Próxima Dosis', 'Next Dose')}</label>
              <input 
                type="date" 
                name="nextDose" 
                value={formData.nextDose} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">{t('Lote (Opcional)', 'Batch / Lot (Optional)')}</label>
              <input 
                type="text" 
                name="batch" 
                value={formData.batch} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">{t('Fabricante / Laboratorio (Opcional)', 'Manufacturer / Lab (Optional)')}</label>
              <input 
                type="text" 
                name="manufacturer" 
                value={formData.manufacturer} 
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
              rows={2}
              className="w-full p-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none resize-none"
              placeholder={t('Reacciones, detalles...', 'Reactions, details...')}
            />
          </div>

          <div className="flex justify-end gap-4 mt-2">
            <Button variant="ghost" onClick={handleCancel}>{t('Cancelar', 'Cancel')}</Button>
            <Button variant="primary" onClick={handleSubmit}>{editId ? t('Actualizar Vacuna', 'Update Vaccine') : t('Guardar Vacuna', 'Save Vaccine')}</Button>
          </div>
        </div>
      )}

      {vaccines.length === 0 && !isAdding ? (
        <div className="py-12 flex flex-col items-center justify-center text-outline bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
          <Syringe className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-body-lg m-0">{t('No hay vacunas registradas.', 'No vaccines recorded.')}</p>
        </div>
      ) : (
        <div className="relative pl-6 flex flex-col gap-8 before:content-[''] before:absolute before:left-[27px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/50">
          {vaccines.map(vaccine => (
            <article key={vaccine.id} className="relative flex flex-col gap-2 group">
              <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-surface border-2 border-primary-container flex items-center justify-center shadow-sm z-10">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 hover:border-primary/30 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-headline-md text-on-surface m-0 flex items-center gap-2">
                      {translateVaccineName(vaccine.vaccineName)}
                    </h4>
                    <span className="font-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                      <Calendar className="w-4 h-4" /> {t('Aplicada:', 'Applied:')} {formatLocalDate(vaccine.applicationDate, true)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {vaccine.nextDose && (
                      <div className="bg-primary-container/10 text-primary border border-primary-container/20 px-3 py-1 rounded-full font-label-sm">
                        {t('Próx. Dosis:', 'Next Dose:')} {formatLocalDate(vaccine.nextDose)}
                      </div>
                    )}
                    <button 
                      onClick={() => handleEdit(vaccine)}
                      className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container/20 rounded-full transition-colors"
                      title={t('Editar vacuna', 'Edit vaccine')}
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(vaccine.id)}
                      className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-full transition-colors"
                      title={t('Eliminar vacuna', 'Delete vaccine')}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {(vaccine.batch || vaccine.manufacturer) && (
                  <div className="flex gap-4 mb-3">
                    {vaccine.manufacturer && (
                      <span className="font-label-sm text-outline">{t('Lab:', 'Lab:')} <span className="text-on-surface-variant">{vaccine.manufacturer}</span></span>
                    )}
                    {vaccine.batch && (
                      <span className="font-label-sm text-outline">{t('Lote:', 'Lot:')} <span className="text-on-surface-variant">{vaccine.batch}</span></span>
                    )}
                  </div>
                )}

                {vaccine.observations && (
                  <p className="font-body-md text-on-surface m-0 bg-surface-container-low p-3 rounded-lg border border-outline-variant/50">
                    {vaccine.observations}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
