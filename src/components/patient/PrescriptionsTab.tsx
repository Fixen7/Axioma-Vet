import { useState, useEffect } from 'react';
import { PlusCircle, Pill, Calendar, User, Printer, Trash2, Edit } from 'lucide-react';
import { Button } from '../ui/Button';
import { useVetContext } from '../../context/VetContext';
import type { Prescription } from '../../services/types';
import { getLocalDatetimeString, formatLocalDate, toUTCDateTime } from '../../utils/date';

export function PrescriptionsTab({ patientId, isDeceased }: { patientId: string, isDeceased: boolean }) {
  const { getPrescriptions, savePrescription, deletePrescription, settings } = useVetContext();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    veterinarian: settings?.doctorName || '',
    medication: '',
    presentation: '',
    dosage: '',
    frequency: '',
    duration: '',
    indications: '',
    date: getLocalDatetimeString()
  });

  const loadPrescriptions = async () => {
    setIsLoading(true);
    const data = await getPrescriptions(patientId);
    setPrescriptions(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsLoading(false);
  };

  useEffect(() => {
    loadPrescriptions();
  }, [patientId, getPrescriptions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.veterinarian || !formData.medication || !formData.dosage || !formData.date) {
      alert('Por favor completa los campos obligatorios (*).');
      return;
    }

    await savePrescription({
      id: editId || undefined,
      patientId,
      ...formData,
      date: toUTCDateTime(formData.date)
    });

    setIsAdding(false);
    setEditId(null);
    setFormData({
      veterinarian: settings?.doctorName || '',
      medication: '',
      presentation: '',
      dosage: '',
      frequency: '',
      duration: '',
      indications: '',
      date: getLocalDatetimeString()
    });
    loadPrescriptions();
  };
  const handleEdit = (prescription: Prescription) => {
    setFormData({
      veterinarian: prescription.veterinarian,
      medication: prescription.medication,
      presentation: prescription.presentation || '',
      dosage: prescription.dosage,
      frequency: prescription.frequency || '',
      duration: prescription.duration || '',
      indications: prescription.indications || '',
      date: getLocalDatetimeString(prescription.date)
    });
    setEditId(prescription.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancel = () => {
    setIsAdding(false);
    setEditId(null);
    setFormData({
      veterinarian: settings?.doctorName || '',
      medication: '',
      presentation: '',
      dosage: '',
      frequency: '',
      duration: '',
      indications: '',
      date: getLocalDatetimeString()
    });
  };
  const handlePrint = () => {
    // Basic print handling - in a full implementation this would load a print-only layout
    window.print();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Seguro que quieres eliminar esta receta? Esta acción no se puede deshacer.")) {
      try {
        await deletePrescription(id);
        loadPrescriptions();
      } catch (error: any) {
        alert("Error al eliminar: " + error.message);
      }
    }
  };

  if (isLoading) return <div className="py-8 text-outline">Cargando recetas...</div>;

  return (
    <div className="flex flex-col gap-8 print:block">
      <div className="flex justify-between items-center print:hidden">
        <h3 className="font-headline-lg m-0">Recetas Médicas</h3>
        {!isDeceased && !isAdding && (
          <Button variant="primary" onClick={() => { setEditId(null); setIsAdding(true); }}>
            <PlusCircle className="w-5 h-5" /> Emitir Receta
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-surface-container-lowest border border-primary-container p-6 rounded-2xl flex flex-col gap-6 shadow-sm print:hidden">
          <h4 className="font-headline-md m-0 text-primary">{editId ? 'Editar Receta' : 'Nueva Receta'}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">Veterinario *</label>
              <input 
                type="text" 
                name="veterinarian" 
                value={formData.veterinarian} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
                placeholder="Dr(a). Nombre"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">Fecha *</label>
              <input 
                type="datetime-local" 
                name="date" 
                value={formData.date} 
                onChange={handleChange}
                disabled={!!editId}
                className={`w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none ${editId ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">Medicamento / Principio Activo *</label>
              <input 
                type="text" 
                name="medication" 
                value={formData.medication} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
                placeholder="Ej. Meloxicam, Amoxicilina..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">Presentación (Opcional)</label>
              <input 
                type="text" 
                name="presentation" 
                value={formData.presentation} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
                placeholder="Ej. Comprimidos 2mg, Jarabe 50ml..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">Dosis *</label>
              <input 
                type="text" 
                name="dosage" 
                value={formData.dosage} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
                placeholder="Ej. 1/2 pastilla, 2ml..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">Frecuencia (Opcional)</label>
              <input 
                type="text" 
                name="frequency" 
                value={formData.frequency} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
                placeholder="Ej. Cada 12h, Cada 24h..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">Duración (Opcional)</label>
              <input 
                type="text" 
                name="duration" 
                value={formData.duration} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
                placeholder="Ej. Por 5 días..."
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-md text-on-surface-variant">Indicaciones Adicionales (Opcional)</label>
            <textarea 
              name="indications" 
              value={formData.indications} 
              onChange={handleChange}
              rows={2}
              className="w-full p-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none resize-none"
              placeholder="Administrar con comida, mantener en frío..."
            />
          </div>

          <div className="flex justify-end gap-4 mt-2">
            <Button variant="ghost" onClick={handleCancel}>Cancelar</Button>
            <Button variant="primary" onClick={handleSubmit}>{editId ? 'Actualizar Receta' : 'Guardar Receta'}</Button>
          </div>
        </div>
      )}

      {prescriptions.length === 0 && !isAdding ? (
        <div className="py-12 flex flex-col items-center justify-center text-outline bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant print:hidden">
          <Pill className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-body-lg m-0">No hay recetas emitidas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block">
          {prescriptions.map(prescription => (
            <article key={prescription.id} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col hover:border-primary/30 transition-colors relative print:w-full print:mb-8 print:break-inside-avoid print:border-2 print:border-black">
              {/* Prescription Header */}
              <div className="flex justify-between items-start border-b border-surface-variant pb-4 mb-4">
                <div className="flex flex-col gap-1">
                  <span className="font-display text-2xl text-on-surface">{prescription.medication}</span>
                  {prescription.presentation && (
                    <span className="font-body-md text-on-surface-variant">{prescription.presentation}</span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 text-outline bg-surface-container-high px-3 py-1 rounded-full font-label-sm print:bg-white print:border print:border-black print:text-black">
                    <User className="w-4 h-4" />
                    {prescription.veterinarian}
                  </div>
                  <span className="font-body-sm text-on-surface-variant flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> {formatLocalDate(prescription.date, true)}
                  </span>
                </div>
              </div>
              
              {/* Prescription Body */}
              <div className="flex flex-col gap-4 flex-grow">
                <div className="flex flex-wrap gap-x-8 gap-y-4">
                  <div className="flex flex-col gap-1">
                    <h5 className="font-label-md text-outline uppercase">Dosis</h5>
                    <p className="font-body-lg text-on-surface m-0 font-medium">{prescription.dosage}</p>
                  </div>
                  {prescription.frequency && (
                    <div className="flex flex-col gap-1">
                      <h5 className="font-label-md text-outline uppercase">Frecuencia</h5>
                      <p className="font-body-lg text-on-surface m-0 font-medium">{prescription.frequency}</p>
                    </div>
                  )}
                  {prescription.duration && (
                    <div className="flex flex-col gap-1">
                      <h5 className="font-label-md text-outline uppercase">Duración</h5>
                      <p className="font-body-lg text-on-surface m-0 font-medium">{prescription.duration}</p>
                    </div>
                  )}
                </div>

                {prescription.indications && (
                  <div className="mt-2 bg-surface-container-low p-4 rounded-xl border border-outline-variant/50 print:bg-white print:border-black">
                    <h5 className="font-label-md text-on-surface-variant m-0 uppercase mb-1">Indicaciones</h5>
                    <p className="font-body-md text-on-surface m-0 whitespace-pre-wrap">{prescription.indications}</p>
                  </div>
                )}
              </div>

              {/* Actions (Hidden on Print) */}
              <div className="mt-6 flex justify-between print:hidden">
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => handleEdit(prescription)} className="text-on-surface-variant hover:text-primary">
                    <Edit className="w-4 h-4" /> Editar
                  </Button>
                  <Button variant="ghost" onClick={() => handleDelete(prescription.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" /> Eliminar
                  </Button>
                </div>
                <Button variant="outline" onClick={() => handlePrint()}>
                  <Printer className="w-4 h-4" /> Imprimir Receta
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
