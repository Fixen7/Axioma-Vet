import { useState, useEffect } from 'react';
import { PlusCircle, Scissors, Calendar, User, Activity, Trash2, Edit, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import { useVetContext } from '../../context/VetContext';
import type { Surgery } from '../../services/types';
import { getLocalDatetimeString, formatLocalDate, toUTCDateTime } from '../../utils/date';
import { AnatomyMarkerEditor, type DraftAnatomyPoint } from './AnatomyMarkerEditor';
import { useDraftAutosave } from '../../hooks/useDraftAutosave';
import { getDraftStorageKey } from '../../utils/formDraftStorage';
import { 
  syncPointsForSource, 
  removePointsForSource, 
  getPointsBySource,
  getQuadrantLabels,
  embedAnatomyPointsInText,
  extractAnatomyPointsFromText,
  stripAnatomyMeta 
} from '../../utils/customAnatomyPoints';
import { useTranslation } from '../../i18n';

export function SurgeriesTab({ patientId, isDeceased }: { patientId: string, isDeceased: boolean }) {
  const { lang, t } = useTranslation();
  const quadrantLabels = getQuadrantLabels(lang);
  const { getSurgeries, saveSurgery, deleteSurgery, settings, patients } = useVetContext();
  const patient = patients.find(p => p.id === patientId);

  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Puntos anatómicos asociados a la cirugía
  const [draftAnatomyPoints, setDraftAnatomyPoints] = useState<DraftAnatomyPoint[]>([]);
  const [showAnatomySection, setShowAnatomySection] = useState(false);

  const [formData, setFormData] = useState({
    procedure: '',
    date: getLocalDatetimeString(),
    reason: '',
    veterinarian: settings?.doctorName || '',
    anesthesia: '',
    observations: '',
    evolutionResult: '',
    nextControl: ''
  });

  // Autoguardado de borrador en sessionStorage
  const draftKey = getDraftStorageKey('surgery', patientId);
  const { pendingDraft, lastSavedAt, discardDraft, clearDraft } = useDraftAutosave({
    key: draftKey,
    data: { formData, draftAnatomyPoints },
    enabled: isAdding && !editId,
    patientId,
    debounceMs: 600,
    isDataEmpty: (d) =>
      !d.formData.procedure.trim() &&
      !d.formData.reason.trim() &&
      !d.formData.anesthesia.trim() &&
      !d.formData.observations.trim() &&
      d.draftAnatomyPoints.length === 0,
  });

  const handleRestoreDraft = () => {
    if (!pendingDraft) return;
    setFormData(pendingDraft.data.formData);
    setDraftAnatomyPoints(pendingDraft.data.draftAnatomyPoints || []);
    if (pendingDraft.data.draftAnatomyPoints && pendingDraft.data.draftAnatomyPoints.length > 0) {
      setShowAnatomySection(true);
    }
    setEditId(null);
    setIsAdding(true);
  };

  const loadSurgeries = async () => {
    setIsLoading(true);
    const data = await getSurgeries(patientId);

    // Re-hidratar marcas anatómicas desde la base de datos si no estuvieran en local
    data.forEach(s => {
      const dbPoints = extractAnatomyPointsFromText(s.observations);
      if (dbPoints && dbPoints.length > 0) {
        const local = getPointsBySource(patientId, s.id);
        if (local.length === 0) {
          syncPointsForSource(
            patientId,
            'surgery',
            s.id,
            `Cirugía: ${s.procedure}`,
            s.date,
            dbPoints
          );
        }
      }
    });

    setSurgeries(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsLoading(false);
  };

  useEffect(() => {
    loadSurgeries();
  }, [patientId, getSurgeries]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.procedure || !formData.date || !formData.reason || !formData.veterinarian || !formData.anesthesia || !formData.evolutionResult) {
      alert(t('Por favor completa todos los campos obligatorios (*).', 'Please complete all required fields (*).'));
      return;
    }

    const observationsWithMeta = embedAnatomyPointsInText(formData.observations || '', draftAnatomyPoints);

    const saved = await saveSurgery({
      id: editId || undefined,
      patientId,
      ...formData,
      observations: observationsWithMeta,
      date: toUTCDateTime(formData.date),
      nextControl: formData.nextControl || undefined
    });

    if (saved && saved.id) {
      syncPointsForSource(
        patientId,
        'surgery',
        saved.id,
        `Cirugía: ${saved.procedure}`,
        saved.date,
        draftAnatomyPoints
      );
    }

    clearDraft();
    setIsAdding(false);
    setEditId(null);
    setDraftAnatomyPoints([]);
    setShowAnatomySection(false);
    setFormData({
      procedure: '',
      date: getLocalDatetimeString(),
      reason: '',
      veterinarian: settings?.doctorName || '',
      anesthesia: '',
      observations: '',
      evolutionResult: '',
      nextControl: ''
    });
    loadSurgeries();
  };

  const handleEdit = (surgery: Surgery) => {
    setFormData({
      procedure: surgery.procedure,
      date: getLocalDatetimeString(surgery.date),
      reason: surgery.reason,
      veterinarian: surgery.veterinarian,
      anesthesia: surgery.anesthesia,
      observations: stripAnatomyMeta(surgery.observations),
      evolutionResult: surgery.evolutionResult || '',
      nextControl: surgery.nextControl || ''
    });
    setEditId(surgery.id);

    let existingPoints = getPointsBySource(patientId, surgery.id);
    if (existingPoints.length === 0) {
      const dbPoints = extractAnatomyPointsFromText(surgery.observations);
      if (dbPoints && dbPoints.length > 0) {
        existingPoints = dbPoints as any;
      }
    }

    setDraftAnatomyPoints(existingPoints);
    setShowAnatomySection(existingPoints.length > 0);

    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancel = () => {
    clearDraft();
    setIsAdding(false);
    setEditId(null);
    setDraftAnatomyPoints([]);
    setShowAnatomySection(false);
    setFormData({
      procedure: '',
      date: getLocalDatetimeString(),
      reason: '',
      veterinarian: settings?.doctorName || '',
      anesthesia: '',
      observations: '',
      evolutionResult: '',
      nextControl: ''
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('¿Seguro que quieres eliminar este registro quirúrgico? Esta acción no se puede deshacer.', 'Are you sure you want to delete this surgery record? This action cannot be undone.'))) {
      try {
        await deleteSurgery(id);
        removePointsForSource(patientId, id);
        loadSurgeries();
      } catch (error: any) {
        alert(t('Error al eliminar: ', 'Error deleting: ') + error.message);
      }
    }
  };

  if (isLoading) return <div className="py-8 text-outline">{t('Cargando cirugías...', 'Loading surgeries...')}</div>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h3 className="font-headline-lg m-0 text-on-surface">{t('Historial de Cirugías', 'Surgery History')}</h3>
        {!isDeceased && !isAdding && (
          <Button variant="primary" onClick={() => { setEditId(null); setDraftAnatomyPoints([]); setShowAnatomySection(false); setIsAdding(true); }}>
            <PlusCircle className="w-5 h-5" /> {t('Nueva Cirugía', 'New Surgery')}
          </Button>
        )}
      </div>

      {/* Banner de Recuperación de Borrador Quirúrgico */}
      {pendingDraft && !isAdding && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{t('Borrador de procedimiento quirúrgico', 'Surgical procedure draft')}</p>
              <p className="text-xs text-amber-300/80">
                {t('Detectamos una intervención no finalizada', 'We found an unfinished procedure')} ({pendingDraft.data.formData.procedure || t('Cirugía sin título', 'Untitled surgery')}). {t('¿Deseas recuperarla?', 'Would you like to restore it?')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm active:scale-95"
            >
              {t('Recuperar borrador', 'Restore draft')}
            </button>
            <button
              type="button"
              onClick={discardDraft}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs rounded-lg transition-colors cursor-pointer"
            >
              {t('Descartar', 'Discard')}
            </button>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="bg-surface-container-lowest border border-primary-container p-6 rounded-2xl flex flex-col gap-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-surface-variant pb-3">
            <h4 className="font-headline-md m-0 text-primary">{editId ? t('Editar Cirugía', 'Edit Surgery') : t('Registrar Procedimiento Quirúrgico', 'Record Surgical Procedure')}</h4>
            <div className="flex items-center gap-2">
              {lastSavedAt && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  ✓ {t('Borrador respaldado', 'Draft saved')}
                </span>
              )}
              <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                {t('Protocolo Quirúrgico', 'Surgical Protocol')}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">{t('Procedimiento Quirúrgico *', 'Surgical Procedure *')}</label>
              <input 
                type="text" 
                name="procedure" 
                value={formData.procedure} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
                placeholder={t('Ej. Ovariohisterectomía, Osteosíntesis...', 'e.g. Ovariohysterectomy, Osteosynthesis...')}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">{t('Motivo *', 'Reason *')}</label>
              <input 
                type="text" 
                name="reason" 
                value={formData.reason} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
                placeholder={t('Ej. Electiva, Trauma...', 'e.g. Elective, Trauma...')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">{t('Fecha *', 'Date *')}</label>
              <input 
                type="datetime-local" 
                name="date" 
                value={formData.date} 
                onChange={handleChange}
                disabled={!!editId}
                className={`w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none ${editId ? 'opacity-70 cursor-not-allowed' : ''} text-on-surface`}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">{t('Cirujano(s) Responsable(s) *', 'Lead Surgeon(s) *')}</label>
              <input 
                type="text" 
                name="veterinarian" 
                value={formData.veterinarian} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
                placeholder={t('Ej. Dr. Juan, Dra. Ana', 'e.g. Dr. John, Dr. Anna')}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">{t('Próximo Control (Opcional)', 'Next Follow-up (Optional)')}</label>
              <input 
                type="date" 
                name="nextControl" 
                value={formData.nextControl} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-md text-on-surface-variant">{t('Protocolo de Anestesia *', 'Anesthesia Protocol *')}</label>
            <input 
              type="text" 
              name="anesthesia" 
              value={formData.anesthesia} 
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
              placeholder={t('Ej. Inhalatoria (Isoflurano), Propofol...', 'e.g. Inhalant (Isoflurane), Propofol...')}
            />
          </div>

          {/* ESQUEMA ANATÓMICO VINCULADO A ESTA CIRUGÍA */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowAnatomySection(prev => !prev)}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-primary/40 bg-primary/5 text-primary text-xs font-bold hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{t('Marcar Cuadrantes / Zonas Quirúrgicas', 'Mark Quadrants / Surgical Areas')} ({draftAnatomyPoints.length} {t('marcados', 'marked')})</span>
              </span>
              <span className="text-[11px] underline font-bold">
                {showAnatomySection ? t('Ocultar silueta', 'Hide silhouette') : t('Abrir silueta anatómica ▾', 'Open anatomical silhouette ▾')}
              </span>
            </button>

            {showAnatomySection && (
              <AnatomyMarkerEditor
                initialSpecies={patient?.species || ''}
                points={draftAnatomyPoints}
                onChange={setDraftAnatomyPoints}
                title={t('Zonas Anatómicas / Incisiones de la Cirugía', 'Anatomical Areas / Surgical Incisions')}
                hint={t('Haz clic en cualquier parte de la silueta para fijar la zona intervenida e indicar su cuadrante', 'Click anywhere on the silhouette to mark the operated area and its quadrant')}
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-md text-on-surface-variant">{t('Resultado / Evolución *', 'Outcome / Evolution *')}</label>
            <textarea 
              name="evolutionResult" 
              value={formData.evolutionResult} 
              onChange={handleChange}
              rows={2}
              className="w-full p-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none resize-none text-on-surface font-medium"
              placeholder={t('Estado al alta, complicaciones, recuperación...', 'Discharge status, complications, recovery...')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-md text-on-surface-variant">{t('Detalles Quirúrgicos / Observaciones (Opcional)', 'Surgical Details / Observations (Optional)')}</label>
            <textarea 
              name="observations" 
              value={formData.observations} 
              onChange={handleChange}
              rows={3}
              className="w-full p-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none resize-none text-on-surface font-medium"
              placeholder={t('Hallazgos intraoperatorios, material utilizado...', 'Intraoperative findings, materials used...')}
            />
          </div>

          <div className="flex justify-end gap-4 mt-2">
            <Button variant="ghost" onClick={handleCancel}>{t('Cancelar', 'Cancel')}</Button>
            <Button variant="primary" onClick={handleSubmit}>{editId ? t('Actualizar Cirugía', 'Update Surgery') : t('Guardar Cirugía', 'Save Surgery')}</Button>
          </div>
        </div>
      )}

      {surgeries.length === 0 && !isAdding ? (
        <div className="py-12 flex flex-col items-center justify-center text-outline bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
          <Scissors className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-body-lg m-0">{t('No hay cirugías registradas.', 'No surgeries recorded.')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {surgeries.map(surgery => {
            let surgeryPoints = getPointsBySource(patientId, surgery.id);
            if (surgeryPoints.length === 0) {
              const dbPoints = extractAnatomyPointsFromText(surgery.observations);
              if (dbPoints && dbPoints.length > 0) {
                surgeryPoints = dbPoints as any;
              }
            }

            return (
              <article key={surgery.id} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col gap-4 hover:border-primary/30 transition-colors">
                <div className="flex justify-between items-start border-b border-surface-variant pb-4 mb-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-label-caps tracking-widest text-primary uppercase font-bold">{surgery.procedure}</span>
                      {surgeryPoints.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          <MapPin className="w-3 h-3" /> {surgeryPoints.length} {surgeryPoints.length === 1 ? t('cuadrante', 'quadrant') : t('cuadrantes', 'quadrants')}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(surgery)} className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-primary-container/20 transition-colors" title={t('Editar registro', 'Edit record')}>
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(surgery.id)} className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors" title={t('Eliminar registro', 'Delete record')}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <span className="font-body-sm text-on-surface-variant flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {formatLocalDate(surgery.date, true)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 text-outline bg-surface-container-high px-3 py-1 rounded-full font-label-sm font-semibold">
                      <User className="w-4 h-4" />
                      {surgery.veterinarian}
                    </div>
                    {surgery.nextControl && (
                      <div className="bg-primary-container/10 text-primary border border-primary-container/20 px-3 py-1 rounded-full font-label-sm font-bold">
                        {t('Control:', 'Follow-up:')} {formatLocalDate(surgery.nextControl)}
                      </div>
                    )}
                  </div>
                </div>
                
                {surgeryPoints.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-primary flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {t('Zonas Quirúrgicas Marcadas', 'Marked Surgical Areas')} ({surgeryPoints.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {surgeryPoints.map((pt, i) => (
                        <div key={i} className="text-xs px-2.5 py-1 rounded-lg bg-surface-container-lowest border border-outline-variant/40 flex items-center gap-1.5 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          <span className="font-bold text-on-surface">{pt.label}</span>
                          <span className="text-primary text-[10px] font-medium">({quadrantLabels[pt.quadrant]})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="flex flex-col gap-1">
                    <h5 className="font-label-md text-on-surface-variant m-0 uppercase font-bold">{t('Motivo', 'Reason')}</h5>
                    <p className="font-body-md text-on-surface m-0 font-medium">{surgery.reason}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h5 className="font-label-md text-on-surface-variant m-0 uppercase flex items-center gap-1 font-bold">
                      <Activity className="w-4 h-4" /> {t('Anestesia', 'Anesthesia')}
                    </h5>
                    <p className="font-body-md text-on-surface m-0 font-medium">{surgery.anesthesia}</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1 mt-2 bg-surface-container-low p-4 rounded-xl border border-outline-variant/50">
                  <h5 className="font-label-md text-on-surface-variant m-0 uppercase font-bold">{t('Evolución y Resultado', 'Evolution & Outcome')}</h5>
                  <p className="font-body-md text-on-surface m-0 whitespace-pre-wrap font-medium">{surgery.evolutionResult}</p>
                </div>

                {surgery.observations && (
                  <div className="flex flex-col gap-1">
                    <h5 className="font-label-md text-on-surface-variant m-0 uppercase font-bold">{t('Observaciones', 'Observations')}</h5>
                    <p className="font-body-md text-on-surface m-0 whitespace-pre-wrap text-on-surface-variant font-medium">
                      {stripAnatomyMeta(surgery.observations)}
                    </p>
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
