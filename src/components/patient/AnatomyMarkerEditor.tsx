import { useState, useRef } from 'react';
import { Plus, Trash2, Edit2, Check, X, Dog, Cat } from 'lucide-react';
import { 
  type PointSeverity, 
  type AnatomicalQuadrant,
  QUADRANT_LABELS,
  detectQuadrant 
} from '../../utils/customAnatomyPoints';

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
  title = "Marcar puntos anatómicos o cuadrantes",
  hint = "Haz clic en la silueta para fijar la zona afectada"
}: AnatomyMarkerEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const isFelineDefault = (initialSpecies || '').toLowerCase().includes('gato') || 
                          (initialSpecies || '').toLowerCase().includes('felin') || 
                          (initialSpecies || '').toLowerCase().includes('cat');

  const [activeSpeciesView, setActiveSpeciesView] = useState<'canine' | 'feline'>(
    isFelineDefault ? 'feline' : 'canine'
  );

  const [isPlacingPoint, setIsPlacingPoint] = useState(false);
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
    if (!isPlacingPoint || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const x = Math.max(4, Math.min(96, Math.round((clickX / rect.width) * 100)));
    const y = Math.max(4, Math.min(96, Math.round((clickY / rect.height) * 100)));
    const detectedQuad = detectQuadrant(x, y);

    setEditingIndex(null);
    setPointForm({
      label: '',
      type: 'problem',
      quadrant: detectedQuad,
      notes: '',
      x,
      y
    });
    setShowPointModal(true);
    setIsPlacingPoint(false);
  };

  const handleSavePoint = () => {
    if (!pointForm.label.trim()) {
      alert('Ingresa una descripción o nombre para este punto.');
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
        return { bg: 'bg-red-500', text: 'text-white', badge: 'bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-300' };
      case 'observation':
        return { bg: 'bg-primary', text: 'text-white', badge: 'bg-primary/10 text-primary' };
      case 'resolved':
        return { bg: 'bg-emerald-500', text: 'text-white', badge: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300' };
    }
  };

  const currentImage = activeSpeciesView === 'feline' 
    ? '/anatomy-feline.jpg' 
    : '/anatomy-canine.jpg';

  return (
    <div className="bg-surface-container-low/70 rounded-2xl p-4 border border-outline-variant/40 flex flex-col gap-4">
      
      {/* Header del editor con conmutador de especie */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-container-high pb-3">
        <div>
          <h5 className="font-label-caps text-xs tracking-wider text-primary font-bold uppercase m-0">
            {title}
          </h5>
          <p className="text-[11px] text-on-surface-variant m-0 mt-0.5">
            {hint}
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <div className="flex items-center gap-1 bg-surface-container p-0.5 rounded-lg border border-outline-variant/30 text-xs">
            <button
              type="button"
              onClick={() => setActiveSpeciesView('canine')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                activeSpeciesView === 'canine' 
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-bold' 
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              <Dog className="w-3 h-3" /> Canino
            </button>
            <button
              type="button"
              onClick={() => setActiveSpeciesView('feline')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                activeSpeciesView === 'feline' 
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-bold' 
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              <Cat className="w-3 h-3" /> Felino
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsPlacingPoint(prev => !prev)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
              isPlacingPoint
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-primary text-on-primary hover:opacity-90'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isPlacingPoint ? 'Haz clic en el animal...' : 'Añadir Marca'}</span>
          </button>
        </div>
      </div>

      {/* Área interactiva */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center md:items-start">
        
        {/* Silueta interactiva */}
        <div className="md:col-span-7 flex flex-col items-center">
          <div
            ref={containerRef}
            onClick={handleImageClick}
            className={`relative w-full aspect-[16/10] bg-white rounded-xl p-1 border border-outline-variant/40 shadow-xs overflow-hidden select-none transition-all ${
              isPlacingPoint 
                ? 'cursor-crosshair ring-2 ring-amber-500/80 shadow-md' 
                : 'cursor-default'
            }`}
          >
            <img 
              src={currentImage} 
              alt="Silueta zoomorfa anatómica" 
              className="w-full h-full object-contain pointer-events-none select-none"
            />

            {isPlacingPoint && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg pointer-events-none">
                🎯 Haz clic donde desees marcar el cuadrante
              </div>
            )}

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
                    isSelected ? 'scale-125 z-30' : 'hover:scale-115 z-20'
                  }`}
                  title={`${p.label} - ${QUADRANT_LABELS[p.quadrant]}`}
                >
                  <span className={`flex items-center justify-center rounded-full border-2 transition-all shadow-md w-5 h-5 ${colors.bg} text-white border-white text-[10px] font-bold`}>
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
          <span className="text-[10px] text-outline mt-1.5 text-center">
            {isPlacingPoint ? 'Haz clic en cualquier punto para fijar la marca' : 'Usa "+ Añadir Marca" para colocar un punto en la imagen'}
          </span>
        </div>

        {/* Lista / detalle de puntos añadidos a esta consulta/cirugía */}
        <div className="md:col-span-5 flex flex-col gap-2 w-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
              Puntos en este registro ({points.length})
            </span>
            {points.length > 0 && (
              <span className="text-[10px] text-on-surface-variant">Clic para ver/editar</span>
            )}
          </div>

          {points.length === 0 ? (
            <div className="py-6 px-3 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/60 flex flex-col items-center text-center gap-1 text-xs text-outline">
              <p className="m-0 font-medium text-on-surface-variant">Sin marcas anatómicas en este registro.</p>
              <p className="text-[10px] m-0">Opcional: Si el paciente tiene una lesión o procedimiento específico, márcalo en el animal.</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-container-high border border-surface-container-high rounded-xl overflow-hidden bg-surface-container-lowest max-h-[160px] overflow-y-auto">
              {points.map((p, idx) => {
                const colors = getPinColor(p.type);
                const isSelected = selectedPointIndex === idx;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedPointIndex(idx)}
                    className={`p-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected ? 'bg-primary/10' : 'hover:bg-surface-container-high/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${colors.bg}`}>
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="font-semibold text-on-surface m-0 truncate leading-tight">{p.label}</p>
                        <p className="text-[10px] text-primary font-medium m-0 truncate">{QUADRANT_LABELS[p.quadrant]}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleStartEdit(idx); }}
                        className="p-1 text-outline hover:text-primary rounded"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeletePoint(idx); }}
                        className="p-1 text-outline hover:text-red-500 rounded"
                        title="Eliminar"
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

      {/* Modal para crear o editar el punto con selector de cuadrante */}
      {showPointModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest text-on-surface rounded-[24px] p-5 w-full max-w-sm shadow-2xl flex flex-col gap-4 border border-outline-variant/40">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                  {editingIndex !== null ? 'Editar Marca' : 'Nueva Marca Anatómica'}
                </span>
                <h4 className="text-base font-bold text-on-surface m-0">Detalles de la Zona</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPointModal(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">
                  Hallazgo / Procedimiento *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Dolor palpación, Otitis, Masa 2cm, Incisión..."
                  value={pointForm.label}
                  onChange={e => setPointForm({ ...pointForm, label: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-xs font-medium text-on-surface"
                  autoFocus
                />
              </div>

              {/* Selector explícito de Cuadrante Anatómico */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">
                  Cuadrante Anatómico (Detectado automáticamente)
                </label>
                <select
                  value={pointForm.quadrant}
                  onChange={e => setPointForm({ ...pointForm, quadrant: e.target.value as AnatomicalQuadrant })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-xs text-on-surface font-semibold"
                >
                  {Object.entries(QUADRANT_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">
                  Estado
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPointForm({ ...pointForm, type: 'problem' })}
                    className={`py-1.5 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1 cursor-pointer ${
                      pointForm.type === 'problem' ? 'bg-red-500 text-white border-red-500' : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    🔴 Alerta
                  </button>
                  <button
                    type="button"
                    onClick={() => setPointForm({ ...pointForm, type: 'observation' })}
                    className={`py-1.5 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1 cursor-pointer ${
                      pointForm.type === 'observation' ? 'bg-primary text-white border-primary' : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    🟣 Observación
                  </button>
                  <button
                    type="button"
                    onClick={() => setPointForm({ ...pointForm, type: 'resolved' })}
                    className={`py-1.5 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1 cursor-pointer ${
                      pointForm.type === 'resolved' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    🟢 Resuelto
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">
                  Nota Adicional (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Detalles de tamaño, evolución..."
                  value={pointForm.notes}
                  onChange={e => setPointForm({ ...pointForm, notes: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-xs text-on-surface"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-container-high">
              <button
                type="button"
                onClick={() => setShowPointModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePoint}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-primary text-on-primary hover:opacity-90 flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
