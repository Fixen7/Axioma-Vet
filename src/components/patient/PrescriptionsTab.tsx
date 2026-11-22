import { useState, useEffect } from 'react';
import { PlusCircle, Calendar, User, Printer, Trash2, Edit, X, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useVetContext } from '../../context/VetContext';
import { useAuth } from '../../context/AuthContext';
import type { Prescription, Patient } from '../../services/types';
import { getLocalDatetimeString, formatLocalDate, toUTCDateTime } from '../../utils/date';
import { useTranslation } from '../../i18n';

interface FormMedicationItem {
  id?: string;
  medication: string;
  presentation: string;
  dosage: string;
  frequency: string;
  duration: string;
  indications: string;
}

const createEmptyItem = (): FormMedicationItem => ({
  medication: '',
  presentation: '',
  dosage: '',
  frequency: '',
  duration: '',
  indications: ''
});

// Ícono SVG de Huellita Veterinaria de alta fidelidad para pantalla e impresión
function PawPrintIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <ellipse cx="6.5" cy="8.2" rx="1.8" ry="2.5" transform="rotate(-15 6.5 8.2)" />
      <ellipse cx="10.2" cy="5.8" rx="1.8" ry="2.6" transform="rotate(-5 10.2 5.8)" />
      <ellipse cx="13.8" cy="5.8" rx="1.8" ry="2.6" transform="rotate(5 13.8 5.8)" />
      <ellipse cx="17.5" cy="8.2" rx="1.8" ry="2.5" transform="rotate(15 17.5 8.2)" />
      <path d="M7.8 14.8 C7.2 12.3 9.2 10.8 12 10.8 C14.8 10.8 16.8 12.3 16.2 14.8 C15.6 17.2 13.8 18.8 12 18.8 C10.2 18.8 8.4 17.2 7.8 14.8 Z" />
    </svg>
  );
}

// Desempaqueta medicamentos estructurados desde la receta, manteniendo compatibilidad con recetas individuales anteriores
export function parsePrescriptionDetails(prescription: Prescription): {
  items: FormMedicationItem[];
  generalNotes: string;
} {
  if (prescription.indications) {
    const match = prescription.indications.match(/\[RECETA_ITEMS\]:(.*)/s);
    if (match) {
      try {
        const data = JSON.parse(match[1]);
        if (Array.isArray(data.items) && data.items.length > 0) {
          const mainNote = prescription.indications.split(/\n*\[RECETA_ITEMS\]:/)[0]?.trim() || '';
          return {
            items: data.items,
            generalNotes: data.notes || mainNote
          };
        }
      } catch {
        // Fallback defensivo si el JSON viniera dañado
      }
    }
  }

  // Compatibilidad hacia atrás: receta tradicional de 1 solo medicamento
  return {
    items: [{
      medication: prescription.medication || '',
      presentation: prescription.presentation || '',
      dosage: prescription.dosage || '',
      frequency: prescription.frequency || '',
      duration: prescription.duration || '',
      indications: ''
    }],
    generalNotes: prescription.indications || ''
  };
}

export function PrescriptionsTab({ 
  patientId, 
  isDeceased,
  patient 
}: { 
  patientId: string; 
  isDeceased: boolean;
  patient?: Patient;
}) {
  const { t } = useTranslation();
  const { getPrescriptions, savePrescription, deletePrescription, settings, patients } = useVetContext();
  const { activeWorkspace } = useAuth();
  
  const currentPatient = patient || patients.find(p => p.id === patientId);
  const clinicName = settings?.clinicName?.trim() || activeWorkspace?.name?.trim() || 'Clínica Veterinaria';

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estado del formulario multirreceta
  const [veterinarian, setVeterinarian] = useState(settings?.doctorName || '');
  const [date, setDate] = useState(getLocalDatetimeString());
  const [items, setItems] = useState<FormMedicationItem[]>([createEmptyItem()]);
  const [generalIndications, setGeneralIndications] = useState('');

  // Estado para impresión dedicada
  const [prescriptionToPrint, setPrescriptionToPrint] = useState<Prescription | null>(null);

  const loadPrescriptions = async () => {
    setIsLoading(true);
    const data = await getPrescriptions(patientId);
    setPrescriptions(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsLoading(false);
  };

  useEffect(() => {
    loadPrescriptions();
  }, [patientId, getPrescriptions]);

  // Manejo de items dinámicos
  const handleItemChange = (index: number, field: keyof FormMedicationItem, value: string) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, createEmptyItem()]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditId(null);
    setVeterinarian(settings?.doctorName || '');
    setDate(getLocalDatetimeString());
    setItems([createEmptyItem()]);
    setGeneralIndications('');
  };

  const handleSubmit = async () => {
    if (!veterinarian.trim() || !date) {
      alert(t('Por favor completa el nombre del veterinario y la fecha.', 'Please complete veterinarian name and date.'));
      return;
    }

    const invalidItems = items.some(it => !it.medication.trim() || !it.dosage.trim());
    if (invalidItems) {
      alert(t('Cada medicamento agregado debe tener al menos Nombre y Dosis (*).', 'Each added medication must have at least Medication Name and Dosage (*).'));
      return;
    }

    // Serialización limpia para la base de datos
    const medNames = items.map(it => it.medication.trim()).join(' • ');
    const medPres = items.map(it => it.presentation.trim()).filter(Boolean).join(' • ');
    const medDos = items.map(it => it.dosage.trim()).join(' • ');
    const medFreq = items.map(it => it.frequency.trim()).filter(Boolean).join(' • ');
    const medDur = items.map(it => it.duration.trim()).filter(Boolean).join(' • ');

    const structuredPayload = JSON.stringify({
      items,
      notes: generalIndications.trim()
    });

    const fullIndications = generalIndications.trim()
      ? `${generalIndications.trim()}\n\n[RECETA_ITEMS]:${structuredPayload}`
      : `[RECETA_ITEMS]:${structuredPayload}`;

    try {
      await savePrescription({
        id: editId || undefined,
        patientId,
        veterinarian: veterinarian.trim(),
        medication: medNames,
        presentation: medPres,
        dosage: medDos,
        frequency: medFreq,
        duration: medDur,
        indications: fullIndications,
        date: toUTCDateTime(date)
      });

      resetForm();
      loadPrescriptions();
    } catch (err: any) {
      alert(t('Error al guardar la receta: ', 'Error saving prescription: ') + (err.message || 'Error'));
    }
  };

  const handleEdit = (prescription: Prescription) => {
    const { items: parsedItems, generalNotes } = parsePrescriptionDetails(prescription);
    setVeterinarian(prescription.veterinarian);
    setDate(getLocalDatetimeString(prescription.date));
    setItems(parsedItems.length > 0 ? parsedItems : [createEmptyItem()]);
    setGeneralIndications(generalNotes);
    setEditId(prescription.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('¿Seguro que quieres eliminar esta receta? Esta acción no se puede deshacer.', 'Are you sure you want to delete this prescription? This action cannot be undone.'))) {
      try {
        await deletePrescription(id);
        loadPrescriptions();
      } catch (error: any) {
        alert(t('Error al eliminar: ', 'Error deleting: ') + error.message);
      }
    }
  };

  const handleOpenPrint = (prescription: Prescription) => {
    setPrescriptionToPrint(prescription);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  if (isLoading) return <div className="py-8 text-outline">{t('Cargando recetas...', 'Loading prescriptions...')}</div>;

  return (
    <div className="flex flex-col gap-8 print:m-0 print:p-0">
      
      {/* HEADER DE PESTAÑA */}
      <div className="flex flex-wrap justify-between items-center gap-3 print:hidden">
        <div>
          <h3 className="font-headline-lg m-0">{t('Recetas Médicas', 'Prescriptions')}</h3>
          <p className="text-xs text-on-surface-variant m-0 mt-0.5">
            {t('Emisión de recetas farmacológicas individuales o con múltiples medicamentos.', 'Prescription issuance for single or multi-medication treatment plans.')}
          </p>
        </div>
        {!isDeceased && !isAdding && (
          <Button variant="primary" onClick={() => { setEditId(null); setItems([createEmptyItem()]); setIsAdding(true); }}>
            <PlusCircle className="w-5 h-5" /> {t('Emitir Receta', 'Issue Prescription')}
          </Button>
        )}
      </div>

      {/* FORMULARIO DE EMISIÓN / EDICIÓN MULTI-MEDICAMENTO */}
      {isAdding && (
        <div className="bg-surface-container-lowest border-2 border-primary/20 p-6 rounded-3xl flex flex-col gap-6 shadow-md print:hidden animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-surface-container-high pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-headline-md m-0 text-primary font-bold">
                  {editId ? t('Editar Receta Médica', 'Edit Prescription') : t('Nueva Receta Médica', 'New Prescription')}
                </h4>
                <p className="text-xs text-on-surface-variant m-0">
                  {t('Ingresa uno o varios medicamentos dentro de la misma prescripción.', 'Add one or more medications to this prescription.')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* DATOS GENERALES: VETERINARIO Y FECHA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-surface-container-low/40 p-4 rounded-2xl border border-outline-variant/30">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('Médico Veterinario *', 'Veterinarian *')}</label>
              <input 
                type="text" 
                value={veterinarian} 
                onChange={(e) => setVeterinarian(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none text-sm font-medium"
                placeholder={t('Dr(a). Nombre y Apellido', 'Dr. Name and Surname')}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('Fecha de Emisión *', 'Date *')}</label>
              <input 
                type="datetime-local" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                disabled={!!editId}
                className={`w-full h-11 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none text-sm font-medium ${editId ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>

          {/* LISTADO DINÁMICO DE MEDICAMENTOS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-primary">
                {t('Medicamentos Prescritos', 'Prescribed Medications')} ({items.length})
              </span>
              <span className="text-[11px] text-on-surface-variant">
                {t('Usa el botón "+ Agregar otro medicamento" para incluir más ítems.', 'Use the button below to add more items.')}
              </span>
            </div>

            {items.map((item, index) => (
              <div 
                key={index}
                className="bg-surface-container-low/60 border border-outline-variant/60 rounded-2xl p-5 space-y-4 relative transition-all"
              >
                <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-on-surface">
                      {item.medication.trim() || `${t('Medicamento', 'Medication')} #${index + 1}`}
                    </span>
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('Quitar', 'Remove')}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">
                      {t('Medicamento / Principio Activo *', 'Medication / Active Ingredient *')}
                    </label>
                    <input 
                      type="text" 
                      value={item.medication} 
                      onChange={(e) => handleItemChange(index, 'medication', e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none text-sm"
                      placeholder={t('Ej. Meloxicam, Amoxicilina + Ácido Clavulánico...', 'e.g. Meloxicam, Amoxicillin...')}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">
                      {t('Presentación (Opcional)', 'Presentation (Optional)')}
                    </label>
                    <input 
                      type="text" 
                      value={item.presentation} 
                      onChange={(e) => handleItemChange(index, 'presentation', e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none text-sm"
                      placeholder={t('Ej. Comprimidos 2mg, Jarabe 50ml, Gotas...', 'e.g. 2mg Tablets, 50ml Syrup...')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">
                      {t('Dosis *', 'Dosage *')}
                    </label>
                    <input 
                      type="text" 
                      value={item.dosage} 
                      onChange={(e) => handleItemChange(index, 'dosage', e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none text-sm"
                      placeholder={t('Ej. 1/2 tableta, 2 ml...', 'e.g. 1/2 tablet, 2ml...')}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">
                      {t('Frecuencia (Opcional)', 'Frequency (Optional)')}
                    </label>
                    <input 
                      type="text" 
                      value={item.frequency} 
                      onChange={(e) => handleItemChange(index, 'frequency', e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none text-sm"
                      placeholder={t('Ej. Cada 12 horas, Cada 24 horas...', 'e.g. Every 12h, Every 24h...')}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">
                      {t('Duración (Opcional)', 'Duration (Optional)')}
                    </label>
                    <input 
                      type="text" 
                      value={item.duration} 
                      onChange={(e) => handleItemChange(index, 'duration', e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none text-sm"
                      placeholder={t('Ej. Por 7 días, Dosis única...', 'e.g. For 7 days, Single dose...')}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant">
                    {t('Indicación particular del medicamento (Opcional)', 'Specific Item Instructions (Optional)')}
                  </label>
                  <input 
                    type="text" 
                    value={item.indications} 
                    onChange={(e) => handleItemChange(index, 'indications', e.target.value)}
                    className="w-full h-10 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant focus:border-primary outline-none text-xs"
                    placeholder={t('Ej. Administrar con comida, mantener refrigerado, aplicar en oído limpio...', 'e.g. Give with food, keep refrigerated...')}
                  />
                </div>
              </div>
            ))}

            {/* BOTÓN MÁS: AGREGAR OTRO MEDICAMENTO */}
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('+ Agregar otro medicamento a esta receta', '+ Add another medication to this prescription')}</span>
            </button>
          </div>

          {/* INDICACIONES GENERALES DE LA RECETA */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              {t('Indicaciones Generales y Cuidados (Opcional)', 'General Instructions & Care (Optional)')}
            </label>
            <textarea 
              value={generalIndications} 
              onChange={(e) => setGeneralIndications(e.target.value)}
              rows={2}
              className="w-full p-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none resize-none text-sm"
              placeholder={t('Ej. Reposo relativo, dieta blanda, control en 7 días si los síntomas persisten...', 'e.g. Rest, soft diet, follow-up in 7 days...')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-container-high">
            <Button variant="ghost" onClick={resetForm}>{t('Cancelar', 'Cancel')}</Button>
            <Button variant="primary" onClick={handleSubmit}>
              <CheckCircle2 className="w-4 h-4" />
              {editId ? t('Actualizar Receta', 'Update Prescription') : t('Guardar Receta Completa', 'Save Prescription')}
            </Button>
          </div>
        </div>
      )}

      {/* LISTADO DE RECETAS */}
      {prescriptions.length === 0 && !isAdding ? (
        <div className="py-14 flex flex-col items-center justify-center text-outline bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant print:hidden shadow-xs">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <PawPrintIcon className="w-9 h-9 opacity-80" />
          </div>
          <p className="font-headline-sm text-on-surface m-0 font-bold">{t('No hay recetas emitidas aún', 'No prescriptions issued yet')}</p>
          <p className="text-xs text-on-surface-variant m-0 mt-1 max-w-sm text-center">
            {t('Emite la primera receta médica para este paciente con uno o múltiples fármacos.', 'Issue the first prescription for this patient with single or multiple medications.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 print:hidden">
          {prescriptions.map(prescription => {
            const { items: parsedItems, generalNotes } = parsePrescriptionDetails(prescription);

            return (
              <article 
                key={prescription.id} 
                className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 flex flex-col hover:border-primary/40 transition-all shadow-xs"
              >
                {/* ENCABEZADO DE LA TARJETA */}
                <div className="flex flex-wrap justify-between items-start border-b border-surface-container-high pb-4 mb-4 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                      <PawPrintIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg font-black text-on-surface">
                          {parsedItems.length > 1 
                            ? `${parsedItems.length} ${t('Medicamentos Prescritos', 'Medications Prescribed')}`
                            : (parsedItems[0]?.medication || t('Receta Médica', 'Prescription'))}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase">
                          {parsedItems.length === 1 ? t('Monoterapia', 'Single') : t('Múltiple', 'Multi-item')}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-on-surface-variant block mt-0.5">
                        {clinicName}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1.5 font-bold text-on-surface bg-surface-container-high px-3 py-1 rounded-full">
                      <User className="w-3.5 h-3.5 text-primary" />
                      {prescription.veterinarian}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-outline">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatLocalDate(prescription.date, true)}
                    </span>
                  </div>
                </div>

                {/* CUERPO: LISTADO DE MEDICAMENTOS DE LA RECETA */}
                <div className="space-y-3 flex-grow">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {parsedItems.map((medItem, mIdx) => (
                      <div 
                        key={mIdx}
                        className="p-3.5 bg-surface-container-low/50 border border-outline-variant/40 rounded-2xl flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-black flex items-center justify-center shrink-0">
                                {mIdx + 1}
                              </span>
                              <strong className="text-sm font-bold text-on-surface">
                                {medItem.medication}
                              </strong>
                            </div>
                            {medItem.presentation && (
                              <span className="text-[11px] font-medium text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-md shrink-0">
                                {medItem.presentation}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-outline-variant/30 text-[11px]">
                            <div>
                              <span className="text-outline uppercase text-[9px] font-bold block">{t('Dosis', 'Dosage')}</span>
                              <span className="font-bold text-on-surface">{medItem.dosage}</span>
                            </div>
                            {medItem.frequency && (
                              <div>
                                <span className="text-outline uppercase text-[9px] font-bold block">{t('Frecuencia', 'Frequency')}</span>
                                <span className="font-semibold text-on-surface">{medItem.frequency}</span>
                              </div>
                            )}
                            {medItem.duration && (
                              <div>
                                <span className="text-outline uppercase text-[9px] font-bold block">{t('Duración', 'Duration')}</span>
                                <span className="font-semibold text-on-surface">{medItem.duration}</span>
                              </div>
                            )}
                          </div>

                          {medItem.indications && (
                            <div className="mt-2 text-[11px] text-on-surface-variant bg-surface-container-lowest px-2.5 py-1.5 rounded-lg border border-outline-variant/30">
                              <span className="font-semibold text-primary">{t('Indicación:', 'Instruction:')}</span> {medItem.indications}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {generalNotes && (
                    <div className="p-3.5 bg-surface-container-low/30 rounded-2xl border border-outline-variant/30 text-xs text-on-surface leading-relaxed">
                      <span className="font-bold text-on-surface-variant uppercase text-[10px] tracking-wider block mb-1">
                        {t('Indicaciones Generales / Recomendaciones:', 'General Instructions / Care:')}
                      </span>
                      <p className="m-0 whitespace-pre-wrap">{generalNotes}</p>
                    </div>
                  )}
                </div>

                {/* ACCIONES DE LA TARJETA */}
                <div className="mt-5 pt-4 border-t border-surface-container-high flex flex-wrap justify-between items-center gap-3">
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => handleEdit(prescription)} className="text-on-surface-variant hover:text-primary">
                      <Edit className="w-4 h-4" /> {t('Editar', 'Edit')}
                    </Button>
                    <Button variant="ghost" onClick={() => handleDelete(prescription.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" /> {t('Eliminar', 'Delete')}
                    </Button>
                  </div>
                  
                  <Button variant="outline" onClick={() => handleOpenPrint(prescription)} className="font-bold gap-2">
                    <Printer className="w-4 h-4" /> {t('Imprimir Receta', 'Print Prescription')}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL Y HOJA MEMBRETADA PARA IMPRESIÓN PROFESIONAL (BLANCO Y NEGRO / COLOR) */}
      {/* ========================================================================= */}
      {prescriptionToPrint && (() => {
        const { items: printItems, generalNotes: printNotes } = parsePrescriptionDetails(prescriptionToPrint);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm print:p-0 print:static print:bg-transparent animate-in fade-in duration-200">
            <div className="bg-white text-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-slate-300 print:border-none print:shadow-none print:max-h-none print:rounded-none">
              
              {/* BARRA SUPERIOR DE ACCIÓN (OCULTA AL IMPRIMIR) */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
                <div className="flex items-center gap-2.5">
                  <Printer className="w-5 h-5 text-indigo-400" />
                  <span className="font-bold text-sm">{t('Vista Previa de Receta Membretada', 'Prescription Print Preview')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTriggerPrint}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{t('Imprimir Ahora', 'Print Now')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrescriptionToPrint(null)}
                    className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* HOJA DE RECETA OFICIAL (OPTICAL PRINT SHEET) */}
              <div className="p-8 md:p-10 overflow-y-auto print:p-0 print:overflow-visible bg-white font-sans text-slate-900 printable-prescription-sheet">
                
                {/* 1. ENCABEZADO MEMBRETADO CON HUELLA Y ORGANIZACIÓN */}
                <div className="border-b-2 border-slate-900 pb-5 mb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs print:border print:border-black">
                        <PawPrintIcon className="w-8 h-8" />
                      </div>
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none m-0">
                          {clinicName}
                        </h1>
                        <p className="text-xs font-semibold text-slate-600 tracking-wide uppercase mt-1 m-0">
                          {t('Atención Médica Veterinaria Integral · Recetario Oficial', 'Veterinary Healthcare · Official Medical Prescription')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className="inline-block px-3 py-1 rounded-md bg-slate-100 text-slate-900 font-mono text-xs font-bold border border-slate-300 print:border-black">
                        {t('RECETA MÉDICA', 'PRESCRIPTION')}
                      </span>
                      <p className="text-[11px] text-slate-500 font-medium mt-1 m-0">
                        {t('Fecha:', 'Date:')} <strong>{formatLocalDate(prescriptionToPrint.date, false)}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. DATOS DEL PACIENTE Y TUTOR */}
                <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 mb-6 text-xs text-slate-800 print:bg-white print:border-slate-400">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-4">
                    <div>
                      <span className="text-slate-500 uppercase text-[9px] font-bold block">{t('Paciente', 'Patient')}</span>
                      <span className="font-extrabold text-sm text-slate-900 block">{currentPatient?.name || t('Paciente', 'Patient')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase text-[9px] font-bold block">{t('Especie / Raza', 'Species / Breed')}</span>
                      <span className="font-bold text-slate-800 capitalize">
                        {currentPatient?.species || '-'}{currentPatient?.breed ? ` · ${currentPatient.breed}` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase text-[9px] font-bold block">{t('Peso', 'Weight')}</span>
                      <span className="font-bold text-slate-800">{currentPatient?.weight || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase text-[9px] font-bold block">{t('Tutor Responsable', 'Owner')}</span>
                      <span className="font-bold text-slate-900">{currentPatient?.ownerName || t('Tutor Particular', 'Private Owner')}</span>
                      {currentPatient?.ownerPhone && (
                        <span className="text-[10px] text-slate-500 block">{currentPatient.ownerPhone}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. PRESCRIPCIÓN FARMACOLÓGICA (Rp.) */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                    <span className="text-2xl font-black italic text-slate-900 font-serif">Rp.</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('Prescripción Farmacológica', 'Medications')}</span>
                  </div>

                  <div className="space-y-4">
                    {printItems.map((item, idx) => (
                      <div 
                        key={idx}
                        className="border-b border-slate-200 pb-4 last:border-b-0 last:pb-0"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <div className="flex items-baseline gap-2">
                            <span className="font-black text-sm text-slate-900">{idx + 1}.</span>
                            <span className="text-base font-extrabold text-slate-900 tracking-tight">
                              {item.medication}
                            </span>
                            {item.presentation && (
                              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded print:border print:border-slate-300">
                                ({item.presentation})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Posología */}
                        <div className="ml-5 mt-1.5 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-800 font-medium">
                          <div>
                            <span className="text-slate-500 font-bold">{t('Dosis:', 'Dosage:')}</span>{' '}
                            <span className="font-black text-slate-900">{item.dosage}</span>
                          </div>
                          {item.frequency && (
                            <div>
                              <span className="text-slate-500 font-bold">{t('Frecuencia:', 'Frequency:')}</span>{' '}
                              <span>{item.frequency}</span>
                            </div>
                          )}
                          {item.duration && (
                            <div>
                              <span className="text-slate-500 font-bold">{t('Duración:', 'Duration:')}</span>{' '}
                              <span>{item.duration}</span>
                            </div>
                          )}
                        </div>

                        {/* Indicación particular */}
                        {item.indications && (
                          <div className="ml-5 mt-1.5 text-xs text-slate-700 italic">
                            <span className="font-semibold text-slate-900 not-italic">{t('Indicación:', 'Instruction:')}</span> {item.indications}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. INDICACIONES GENERALES / RECOMENDACIONES */}
                {printNotes && (
                  <div className="mb-8 p-4 bg-slate-50 border border-slate-300 rounded-xl print:bg-white print:border-slate-400">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                      {t('Indicaciones Generales y Cuidados en Casa:', 'General Instructions & Home Care:')}
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap m-0">
                      {printNotes}
                    </p>
                  </div>
                )}

                {/* 5. FIRMA Y SELLO DEL MÉDICO VETERINARIO */}
                <div className="pt-10 mt-8 border-t border-slate-200 flex justify-between items-end gap-6">
                  <div className="text-[10px] text-slate-400 font-medium max-w-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 mb-1">
                      <PawPrintIcon className="w-3.5 h-3.5" />
                      <span className="font-bold uppercase tracking-wider">{clinicName}</span>
                    </div>
                    <span>{t('Documento clínico oficial emitido mediante Axioma Vet.', 'Official clinical document issued via Axioma Vet.')}</span>
                  </div>

                  <div className="flex flex-col items-center text-center shrink-0 w-64">
                    <div className="w-full border-b-2 border-slate-800 mb-2"></div>
                    <span className="text-xs font-black text-slate-900">{prescriptionToPrint.veterinarian}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {t('Médico Veterinario Responsable', 'Responsible Veterinarian')}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
