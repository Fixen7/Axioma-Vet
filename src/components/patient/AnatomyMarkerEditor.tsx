import { useState, useRef } from 'react';
import { Trash2, Edit2, Check, X, Dog, Cat } from 'lucide-react';
import { 
  type PointSeverity, 
  type AnatomicalQuadrant,
  getQuadrantLabels,
  detectQuadrant 
} from '../../utils/customAnatomyPoints';
import { useTranslation } from '../../i18n';

export interface DraftAnatomyPoint {
  x: number;
  y: number;
  quadrant: AnatomicalQuadrant;
  label: string;
  type: PointSeverity;
  notes?: string;
  speciesTarget?: 'canine' | 'feline' | 'universal';
}

interface AnatomyMarkerEditorProps {
  initialSpecies: string;
  points: DraftAnatomyPoint[];
  onChange: (points: DraftAnatomyPoint[]) => void;
  title?: string;
  hint?: string;
}

export function AnatomyMarkerEditor({
  initialSpecies,
  points,
  onChange,
  title,
  hint
}: AnatomyMarkerEditorProps) {
  const { lang, t } = useTranslation();
  const quadrantLabels = getQuadrantLabels(lang);
  const resolvedTitle = title ?? t('Marcar puntos anatómicos o cuadrantes', 'Mark anatomical points or quadrants');
  const resolvedHint = hint ?? t('Haz clic en cualquier parte de la silueta para fijar la zona afectada', 'Click anywhere on the silhouette to mark the affected area');
  const containerRef = useRef<HTMLDivElement>(null);

  const isFelineDefault = (initialSpecies || '').toLowerCase().includes('gato') || 
                          (initialSpecies || '').toLowerCase().includes('felin') || 
                          (initialSpecies || '').toLowerCase().includes('cat');

  const [activeSpeciesView, setActiveSpeciesView] = useState<'canine' | 'feline'>(
    isFelineDefault ? 'feline' : 'canine'
  );

  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [showPointModal, setShowPointModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [pointForm, setPointForm] = useState<{
    label: string;
    type: PointSeverity;
    quadrant: AnatomicalQuadrant;
    notes: string;
    x: number;
    y: number;
  }>({
    label: '',
    type: 'problem',
    quadrant: 'abdominal',
    notes: '',
    x: 50,
    y: 50
  });

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Si se hizo clic sobre un botón de pin existente, no abrir modal nuevo
    if ((e.target as HTMLElement).closest('button')) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const x = Math.max(4, Math.min(96, Math.round((clickX / rect.width) * 100)));
    const y = Math.max(4, Math.min(96, Math.round((clickY / rect.height) * 100)));
    const detectedQuad = detectQuadrant(x, y);

    setEditingIndex(null);
    setPointForm({
      label: quadrantLabels[detectedQuad].split('(')[0].trim(),
      type: 'problem',
      quadrant: detectedQuad,
      notes: '',
      x,
      y
    });
    setShowPointModal(true);
  };

  const handleSavePoint = () => {
    if (!pointForm.label.trim()) {
      alert(t('Ingresa una descripción o nombre para este punto.', 'Enter a description or name for this point.'));
      return;
    }

    const newDraft: DraftAnatomyPoint = {
      x: pointForm.x,
      y: pointForm.y,
      quadrant: pointForm.quadrant,
      label: pointForm.label.trim(),
      type: pointForm.type,
      notes: pointForm.notes.trim() || undefined,
      speciesTarget: activeSpeciesView
    };

    if (editingIndex !== null) {
      const updated = [...points];
      updated[editingIndex] = newDraft;
      onChange(updated);
      setSelectedPointIndex(editingIndex);
    } else {
      onChange([...points, newDraft]);
      setSelectedPointIndex(points.length);
    }

    setShowPointModal(false);
    setEditingIndex(null);
  };

  const handleStartEdit = (index: number) => {
    const pt = points[index];
    setEditingIndex(index);
    setPointForm({
      label: pt.label,
      type: pt.type,
      quadrant: pt.quadrant,
      notes: pt.notes || '',
      x: pt.x,
      y: pt.y
    });
    setShowPointModal(true);
  };

  const handleDeletePoint = (index: number) => {
    const filtered = points.filter((_, i) => i !== index);
    onChange(filtered);
    if (selectedPointIndex === index) {
      setSelectedPointIndex(null);
    }
  };

  const getPinColor = (type: PointSeverity) => {
    switch (type) {
      case 'problem':
        return { bg: 'bg-[#dc2626]', text: 'text-white' };
      case 'observation':
        return { bg: 'bg-[#4f46e5]', text: 'text-white' };
      case 'resolved':
        return { bg: 'bg-[#059669]', text: 'text-white' };
    }
  };

  const currentImage = activeSpeciesView === 'feline' 
    ? '/anatomy-feline.jpg' 
    : '/anatomy-canine.jpg';

  return (
    <div className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-300 flex flex-col gap-4 text-[#131b2e]">
      
      {/* Header del editor con conmutador de especie */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h5 className="text-xs tracking-wider text-primary font-black uppercase m-0">
            {resolvedTitle}
          </h5>
          <p className="text-xs text-[#4a4455] m-0 mt-0.5 font-bold">
            {resolvedHint}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveSpeciesView('canine')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeSpeciesView === 'canine' 
                  ? 'bg-primary text-white shadow-xs' 
                  : 'text-[#131b2e] hover:text-black'
              }`}
            >
              <Dog className="w-3.5 h-3.5" /> {t('Canino', 'Canine')}
            </button>
            <button
              type="button"
              onClick={() => setActiveSpeciesView('feline')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeSpeciesView === 'feline' 
                  ? 'bg-primary text-white shadow-xs' 
                  : 'text-[#131b2e] hover:text-black'
              }`}
            >
              <Cat className="w-3.5 h-3.5" /> {t('Felino', 'Feline')}
            </button>
          </div>
        </div>
      </div>

      {/* Área interactiva */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center md:items-start">
        
        {/* Silueta interactiva (Clic libre directo) */}
        <div className="md:col-span-7 flex flex-col items-center">
          <div
            ref={containerRef}
            onClick={handleImageClick}
            className="relative w-full aspect-[16/10] bg-white rounded-xl p-1.5 border-2 border-slate-300 shadow-xs overflow-hidden select-none transition-all cursor-crosshair hover:border-primary"
            title={t('Haz clic en cualquier punto para fijar la marca anatómica', 'Click any point to place the anatomical marker')}
          >
            <img 
              src={currentImage} 
              alt={t('Silueta zoomorfa anatómica', 'Anatomical silhouette')} 
              className="w-full h-full object-contain pointer-events-none select-none"
            />

            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg pointer-events-none tracking-wide">
              🎯 {t('Haz clic en la silueta para marcar un punto', 'Click on the silhouette to mark a point')}
            </div>

            {points.map((p, idx) => {
              const colors = getPinColor(p.type);
              const isSelected = selectedPointIndex === idx;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPointIndex(isSelected ? null : idx);
                  }}
                  style={{ top: `${p.y}%`, left: `${p.x}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                    isSelected ? 'scale-125 z-30 ring-3 ring-primary ring-offset-2' : 'hover:scale-115 z-20'
                  }`}
                  title={`${p.label} - ${quadrantLabels[p.quadrant]}`}
                >
                  <span className={`flex items-center justify-center rounded-full border-2 transition-all shadow-md w-5 h-5 ${colors.bg} text-white border-white text-[10px] font-black`}>
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
          <span className="text-xs text-[#4a4455] font-bold mt-1.5 text-center">
            {t('Haz clic en cualquier parte del cuerpo del animal para registrar la afección o incisión', 'Click anywhere on the animal\'s body to record the condition or incision')}
          </span>
        </div>

        {/* Lista / detalle de puntos añadidos a esta consulta/cirugía */}
        <div className="md:col-span-5 flex flex-col gap-2 w-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#131b2e]">
              {t('Marcas en este registro', 'Markers in this record')} ({points.length})
            </span>
            {points.length > 0 && (
              <span className="text-xs text-[#4a4455] font-bold">{t('Clic para ver/editar', 'Click to view/edit')}</span>
            )}
          </div>

          {points.length === 0 ? (
            <div className="py-8 px-3 bg-white rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center text-center gap-1.5 text-xs text-[#4a4455]">
              <p className="m-0 font-black text-[#131b2e] text-xs">{t('Sin marcas anatómicas fijadas.', 'No anatomical markers placed.')}</p>
              <p className="text-xs m-0 font-medium">{t('Haz clic en la silueta izquierda para marcar zonas anatómicas afectadas.', 'Click the silhouette on the left to mark affected anatomical areas.')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 border-2 border-slate-300 rounded-xl overflow-hidden bg-white max-h-[190px] overflow-y-auto shadow-2xs">
              {points.map((p, idx) => {
                const colors = getPinColor(p.type);
                const isSelected = selectedPointIndex === idx;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedPointIndex(idx)}
                    className={`p-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected ? 'bg-primary/10' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 ${colors.bg}`}>
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="font-bold text-[#131b2e] m-0 truncate leading-tight text-xs">{p.label}</p>
                        <p className="text-[11px] text-primary font-bold m-0 truncate">{quadrantLabels[p.quadrant]}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleStartEdit(idx); }}
                        className="p-1 text-[#4a4455] hover:text-primary rounded hover:bg-slate-100"
                        title={t('Editar', 'Edit')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeletePoint(idx); }}
                        className="p-1 text-[#4a4455] hover:text-red-600 rounded hover:bg-red-50"
                        title={t('Eliminar', 'Delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Modal para ingresar/editar los detalles del punto */}
      {showPointModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-300 max-w-md w-full shadow-2xl flex flex-col gap-4 text-[#131b2e]">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h4 className="font-black text-base text-[#131b2e] m-0">
                {editingIndex !== null ? t('Editar Marca Anatómica', 'Edit Anatomical Marker') : t('Registrar Marca en Silueta', 'Record Marker on Silhouette')}
              </h4>
              <button
                type="button"
                onClick={() => setShowPointModal(false)}
                className="text-[#4a4455] hover:text-black p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#131b2e]">
                  {t('Hallazgo / Procedimiento *', 'Finding / Procedure *')}
                </label>
                <input
                  type="text"
                  placeholder={t('Ej: Dolor palpación, Otitis, Masa 2cm, Incisión...', 'e.g. Palpation pain, Otitis, 2cm mass, Incision...')}
                  value={pointForm.label}
                  onChange={e => setPointForm({ ...pointForm, label: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl bg-white border-2 border-slate-300 focus:border-primary outline-none text-xs font-bold text-[#131b2e]"
                  autoFocus
                />
              </div>

              {/* Selector explícito de Cuadrante Anatómico */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#131b2e]">
                  {t('Cuadrante Anatómico (Detectado automáticamente)', 'Anatomical Quadrant (Auto-detected)')}
                </label>
                <select
                  value={pointForm.quadrant}
                  onChange={e => setPointForm({ ...pointForm, quadrant: e.target.value as AnatomicalQuadrant })}
                  className="w-full h-11 px-3.5 rounded-xl bg-white border-2 border-slate-300 focus:border-primary outline-none text-xs text-[#131b2e] font-bold"
                >
                  {Object.entries(quadrantLabels).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#131b2e]">
                  {t('Severidad / Estado', 'Severity / Status')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPointForm({ ...pointForm, type: 'problem' })}
                    className={`py-2 rounded-xl text-xs font-black border-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                      pointForm.type === 'problem' ? 'bg-[#dc2626] text-white border-[#dc2626] shadow-xs' : 'bg-white text-[#131b2e] border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    🔴 {t('Alerta', 'Alert')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPointForm({ ...pointForm, type: 'observation' })}
                    className={`py-2 rounded-xl text-xs font-black border-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                      pointForm.type === 'observation' ? 'bg-[#4f46e5] text-white border-[#4f46e5] shadow-xs' : 'bg-white text-[#131b2e] border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    🟣 {t('Observación', 'Observation')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPointForm({ ...pointForm, type: 'resolved' })}
                    className={`py-2 rounded-xl text-xs font-black border-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                      pointForm.type === 'resolved' ? 'bg-[#059669] text-white border-[#059669] shadow-xs' : 'bg-white text-[#131b2e] border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    🟢 {t('Resuelto', 'Resolved')}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-black uppercase tracking-wider text-[#131b2e]">
                  {t('Nota Adicional (Opcional)', 'Additional Note (Optional)')}
                </label>
                <input
                  type="text"
                  placeholder={t('Detalles de tamaño, evolución...', 'Size details, evolution...')}
                  value={pointForm.notes}
                  onChange={e => setPointForm({ ...pointForm, notes: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-white border-2 border-slate-300 focus:border-primary outline-none text-xs text-[#131b2e] font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowPointModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#4a4455] hover:bg-slate-100 cursor-pointer"
              >
                {t('Cancelar', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleSavePoint}
                className="px-5 py-2 rounded-xl text-xs font-black bg-primary text-white hover:opacity-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>{t('Guardar Marca', 'Save Marker')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
