import { useState, useEffect } from 'react';
import { PlusCircle, Scissors, Calendar, User, Activity, Trash2, Edit, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import { useVetContext } from '../../context/VetContext';
import type { Surgery } from '../../services/types';
import { getLocalDatetimeString, formatLocalDate, toUTCDateTime } from '../../utils/date';
import { AnatomyMarkerEditor, type DraftAnatomyPoint } from './AnatomyMarkerEditor';
import { 
  syncPointsForSource, 
  removePointsForSource, 
  getPointsBySource,
  QUADRANT_LABELS,
  embedAnatomyPointsInText,
  extractAnatomyPointsFromText,
  stripAnatomyMeta 
} from '../../utils/customAnatomyPoints';

export function SurgeriesTab({ patientId, isDeceased }: { patientId: string, isDeceased: boolean }) {
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
      alert('Por favor completa todos los campos obligatorios (*).');
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
    if (window.confirm("¿Seguro que quieres eliminar este registro quirúrgico? Esta acción no se puede deshacer.")) {
      try {
        await deleteSurgery(id);
        removePointsForSource(patientId, id);
        loadSurgeries();
      } catch (error: any) {
        alert("Error al eliminar: " + error.message);
      }
    }
  };

  if (isLoading) return <div className="py-8 text-outline">Cargando cirugías...</div>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h3 className="font-headline-lg m-0 text-on-surface">Historial de Cirugías</h3>
        {!isDeceased && !isAdding && (
          <Button variant="primary" onClick={() => { setEditId(null); setDraftAnatomyPoints([]); setShowAnatomySection(false); setIsAdding(true); }}>
            <PlusCircle className="w-5 h-5" /> Nueva Cirugía
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-surface-container-lowest border border-primary-container p-6 rounded-2xl flex flex-col gap-6 shadow-sm">
          <h4 className="font-headline-md m-0 text-primary">{editId ? 'Editar Cirugía' : 'Registrar Procedimiento Quirúrgico'}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">Procedimiento Quirúrgico *</label>
              <input 
                type="text" 
                name="procedure" 
                value={formData.procedure} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
                placeholder="Ej. Ovariohisterectomía, Osteosíntesis..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">Motivo *</label>
              <input 
                type="text" 
                name="reason" 
                value={formData.reason} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
                placeholder="Ej. Electiva, Trauma..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">Fecha *</label>
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
              <label className="font-label-md text-on-surface-variant">Cirujano(s) Responsable(s) *</label>
              <input 
                type="text" 
                name="veterinarian" 
                value={formData.veterinarian} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
                placeholder="Ej. Dr. Juan, Dra. Ana"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">Próximo Control (Opcional)</label>
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
            <label className="font-label-md text-on-surface-variant">Protocolo de Anestesia *</label>
            <input 
              type="text" 
              name="anesthesia" 
              value={formData.anesthesia} 
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
              placeholder="Ej. Inhalatoria (Isoflurano), Propofol..."
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
                <span>Marcar Cuadrantes / Zonas Quirúrgicas ({draftAnatomyPoints.length} marcados)</span>
              </span>
              <span className="text-[11px] underline font-bold">
                {showAnatomySection ? 'Ocultar silueta' : 'Abrir silueta anatómica ▾'}
              </span>
            </button>

            {showAnatomySection && (
              <AnatomyMarkerEditor
                initialSpecies={patient?.species || ''}
                points={draftAnatomyPoints}
                onChange={setDraftAnatomyPoints}
                title="Zonas Anatómicas / Incisiones de la Cirugía"
                hint="Haz clic en cualquier parte de la silueta para fijar la zona intervenida e indicar su cuadrante"
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-md text-on-surface-variant">Resultado / Evolución *</label>
            <textarea 
              name="evolutionResult" 
              value={formData.evolutionResult} 
              onChange={handleChange}
              rows={2}
              className="w-full p-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none resize-none text-on-surface font-medium"
              placeholder="Estado al alta, complicaciones, recuperación..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-md text-on-surface-variant">Detalles Quirúrgicos / Observaciones (Opcional)</label>
            <textarea 
              name="observations" 
              value={formData.observations} 
              onChange={handleChange}
              rows={3}
              className="w-full p-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none resize-none text-on-surface font-medium"
              placeholder="Hallazgos intraoperatorios, material utilizado..."
            />
          </div>

          <div className="flex justify-end gap-4 mt-2">
            <Button variant="ghost" onClick={handleCancel}>Cancelar</Button>
            <Button variant="primary" onClick={handleSubmit}>{editId ? 'Actualizar Cirugía' : 'Guardar Cirugía'}</Button>
          </div>
        </div>
      )}

      {surgeries.length === 0 && !isAdding ? (
        <div className="py-12 flex flex-col items-center justify-center text-outline bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
          <Scissors className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-body-lg m-0">No hay cirugías registradas.</p>
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
                          <MapPin className="w-3 h-3" /> {surgeryPoints.length} {surgeryPoints.length === 1 ? 'cuadrante' : 'cuadrantes'}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(surgery)} className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-primary-container/20 transition-colors" title="Editar registro">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(surgery.id)} className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors" title="Eliminar registro">
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
                        Control: {formatLocalDate(surgery.nextControl)}
                      </div>
                    )}
                  </div>
                </div>
                
                {surgeryPoints.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-primary flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Zonas Quirúrgicas Marcadas ({surgeryPoints.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {surgeryPoints.map((pt, i) => (
                        <div key={i} className="text-xs px-2.5 py-1 rounded-lg bg-surface-container-lowest border border-outline-variant/40 flex items-center gap-1.5 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          <span className="font-bold text-on-surface">{pt.label}</span>
                          <span className="text-primary text-[10px] font-medium">({QUADRANT_LABELS[pt.quadrant]})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="flex flex-col gap-1">
                    <h5 className="font-label-md text-on-surface-variant m-0 uppercase font-bold">Motivo</h5>
                    <p className="font-body-md text-on-surface m-0 font-medium">{surgery.reason}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h5 className="font-label-md text-on-surface-variant m-0 uppercase flex items-center gap-1 font-bold">
                      <Activity className="w-4 h-4" /> Anestesia
                    </h5>
                    <p className="font-body-md text-on-surface m-0 font-medium">{surgery.anesthesia}</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1 mt-2 bg-surface-container-low p-4 rounded-xl border border-outline-variant/50">
                  <h5 className="font-label-md text-on-surface-variant m-0 uppercase font-bold">Evolución y Resultado</h5>
                  <p className="font-body-md text-on-surface m-0 whitespace-pre-wrap font-medium">{surgery.evolutionResult}</p>
                </div>

                {surgery.observations && (
                  <div className="flex flex-col gap-1">
                    <h5 className="font-label-md text-on-surface-variant m-0 uppercase font-bold">Observaciones</h5>
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
