import { useState, useEffect } from 'react';
import { PlusCircle, Syringe, Calendar, ShieldCheck, Trash2, Edit } from 'lucide-react';
import { Button } from '../ui/Button';
import { useVetContext } from '../../context/VetContext';
import type { Vaccine } from '../../services/types';
import { getLocalDatetimeString, formatLocalDate, toUTCDateTime } from '../../utils/date';

export function VaccinesTab({ patientId, isDeceased }: { patientId: string, isDeceased: boolean }) {
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
      alert('Por favor completa el nombre de la vacuna y la fecha de aplicación.');
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
    if (window.confirm("¿Seguro que quieres eliminar este registro de vacuna? Esta acción no se puede deshacer.")) {
      try {
        await deleteVaccine(id);
        loadVaccines();
      } catch (error: any) {
        alert("Error al eliminar: " + error.message);
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

  if (isLoading) return <div className="py-8 text-outline">Cargando vacunas...</div>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h3 className="font-headline-lg m-0">Registro de Vacunación</h3>
        {!isDeceased && !isAdding && (
          <Button variant="primary" onClick={() => { setEditId(null); setIsAdding(true); }}>
            <PlusCircle className="w-5 h-5" /> Nueva Vacuna
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-surface-container-lowest border border-primary-container p-6 rounded-2xl flex flex-col gap-6 shadow-sm">
          <h4 className="font-headline-md m-0 text-primary">{editId ? 'Editar Vacuna' : 'Registrar Nueva Vacuna'}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">Vacuna *</label>
              <select 
                name="vaccineSelect" 
                value={formData.vaccineSelect} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
              >
                <option value="" disabled>Selecciona una vacuna...</option>
                {commonVaccines.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            
            {formData.vaccineSelect === 'Otra' && (
              <div className="flex flex-col gap-2 md:col-start-2">
                <label className="font-label-md text-on-surface-variant">Nombre de Vacuna *</label>
                <input 
                  type="text" 
                  name="customVaccineName" 
                  value={formData.customVaccineName} 
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
                  placeholder="Especifica la vacuna"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">Fecha de Aplicación *</label>
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
              <label className="font-label-md text-on-surface-variant">Próxima Dosis</label>
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
              <label className="font-label-md text-on-surface-variant">Lote (Opcional)</label>
              <input 
                type="text" 
                name="batch" 
                value={formData.batch} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">Fabricante / Laboratorio (Opcional)</label>
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
            <label className="font-label-md text-on-surface-variant">Observaciones (Opcional)</label>
            <textarea 
              name="observations" 
              value={formData.observations} 
              onChange={handleChange}
              rows={2}
              className="w-full p-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none resize-none"
              placeholder="Reacciones, detalles..."
            />
          </div>

          <div className="flex justify-end gap-4 mt-2">
            <Button variant="ghost" onClick={handleCancel}>Cancelar</Button>
            <Button variant="primary" onClick={handleSubmit}>{editId ? 'Actualizar Vacuna' : 'Guardar Vacuna'}</Button>
          </div>
        </div>
      )}

      {vaccines.length === 0 && !isAdding ? (
        <div className="py-12 flex flex-col items-center justify-center text-outline bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
          <Syringe className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-body-lg m-0">No hay vacunas registradas.</p>
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
                      {vaccine.vaccineName}
                    </h4>
                    <span className="font-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                      <Calendar className="w-4 h-4" /> Aplicada: {formatLocalDate(vaccine.applicationDate, true)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {vaccine.nextDose && (
                      <div className="bg-primary-container/10 text-primary border border-primary-container/20 px-3 py-1 rounded-full font-label-sm">
                        Próx. Dosis: {formatLocalDate(vaccine.nextDose)}
                      </div>
                    )}
                    <button 
                      onClick={() => handleEdit(vaccine)}
                      className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container/20 rounded-full transition-colors"
                      title="Editar vacuna"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(vaccine.id)}
                      className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-full transition-colors"
                      title="Eliminar vacuna"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {(vaccine.batch || vaccine.manufacturer) && (
                  <div className="flex gap-4 mb-3">
                    {vaccine.manufacturer && (
                      <span className="font-label-sm text-outline">Lab: <span className="text-on-surface-variant">{vaccine.manufacturer}</span></span>
                    )}
                    {vaccine.batch && (
                      <span className="font-label-sm text-outline">Lote: <span className="text-on-surface-variant">{vaccine.batch}</span></span>
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
