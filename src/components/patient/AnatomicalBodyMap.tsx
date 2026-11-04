import { useState, useEffect, useRef, useMemo } from 'react';
import { Activity, Plus, Trash2, Edit2, Check, X, Sparkles, ChevronDown, ChevronUp, Heart, Dog, Cat } from 'lucide-react';
import type { Patient, Consultation } from '../../services/types';
import { 
  getCustomAnatomyPoints, 
  saveCustomAnatomyPoints, 
  type CustomAnatomicalPoint, 
  type PointSeverity 
} from '../../utils/customAnatomyPoints';
import { analyzeAnatomicalFindings } from '../../utils/anatomyKeywords';
import { formatLocalDate } from '../../utils/date';

interface AnatomicalBodyMapProps {
  patient: Patient;
  consultations: Consultation[];
}

export function AnatomicalBodyMap({ patient, consultations }: AnatomicalBodyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Detección automática de especie (Gato vs Perro/Cuadrúpedo)
  const isDefaultFeline = useMemo(() => {
    const s = (patient.species || '').toLowerCase();
    return s.includes('gato') || s.includes('felin') || s.includes('cat');
  }, [patient.species]);

  const [activeSpeciesView, setActiveSpeciesView] = useState<'canine' | 'feline'>(
    isDefaultFeline ? 'feline' : 'canine'
  );

  // Sincronizar si cambia el paciente
  useEffect(() => {
    setActiveSpeciesView(isDefaultFeline ? 'feline' : 'canine');
  }, [isDefaultFeline, patient.id]);

  // Puntos anatómicos colocados libremente por el doctor
  const [points, setPoints] = useState<CustomAnatomicalPoint[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  // Modo interactivo de colocación de punto
  const [isPlacingPoint, setIsPlacingPoint] = useState(false);
  const [showPointModal, setShowPointModal] = useState(false);
  const [editingPointId, setEditingPointId] = useState<string | null>(null);
  const [pointForm, setPointForm] = useState<{
    label: string;
    type: PointSeverity;
    notes: string;
    x: number;
    y: number;
  }>({
    label: '',
    type: 'problem',
    notes: '',
    x: 50,
    y: 50
  });

  // Cargar puntos guardados para este paciente
  useEffect(() => {
    const loaded = getCustomAnatomyPoints(patient.id);
    setPoints(loaded);
    setSelectedPointId(null);
    setIsPlacingPoint(false);
  }, [patient.id]);

  // Guardar puntos cada vez que cambien
  const updatePoints = (newPoints: CustomAnatomicalPoint[]) => {
    setPoints(newPoints);
    saveCustomAnatomyPoints(patient.id, newPoints);
  };

  // Clic en la imagen para colocar un punto libre
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacingPoint || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const x = Math.max(4, Math.min(96, Math.round((clickX / rect.width) * 100)));
    const y = Math.max(4, Math.min(96, Math.round((clickY / rect.height) * 100)));

    setEditingPointId(null);
    setPointForm({
      label: '',
      type: 'problem',
      notes: '',
      x,
      y
    });
    setShowPointModal(true);
    setIsPlacingPoint(false);
  };

  // Guardar punto nuevo o editado
  const handleSavePoint = () => {
    if (!pointForm.label.trim()) {
      alert('Ingresa una descripción o nombre para este punto de referencia.');
      return;
    }

    if (editingPointId) {
      // Editar existente
      const updated = points.map(p => {
        if (p.id === editingPointId) {
          return {
            ...p,
            label: pointForm.label.trim(),
            type: pointForm.type,
            notes: pointForm.notes.trim() || undefined,
            speciesTarget: activeSpeciesView
          };
        }
        return p;
      });
      updatePoints(updated);
      setSelectedPointId(editingPointId);
    } else {
      // Crear nuevo punto libre
      const newPoint: CustomAnatomicalPoint = {
        id: `pt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientId: patient.id,
        speciesTarget: activeSpeciesView,
        x: pointForm.x,
        y: pointForm.y,
        label: pointForm.label.trim(),
        type: pointForm.type,
        notes: pointForm.notes.trim() || undefined,
        date: new Date().toISOString()
      };
      updatePoints([...points, newPoint]);
      setSelectedPointId(newPoint.id);
    }

    setShowPointModal(false);
    setEditingPointId(null);
  };

  // Abrir edición de un punto existente
  const handleStartEdit = (point: CustomAnatomicalPoint) => {
    setEditingPointId(point.id);
    setPointForm({
      label: point.label,
      type: point.type,
      notes: point.notes || '',
      x: point.x,
      y: point.y
    });
    setShowPointModal(true);
  };

  // Eliminar un punto
  const handleDeletePoint = (pointId: string) => {
    const isConfirmed = window.confirm('¿Deseas eliminar este punto de referencia anatómico?');
    if (!isConfirmed) return;

    const filtered = points.filter(p => p.id !== pointId);
    updatePoints(filtered);
    if (selectedPointId === pointId) {
      setSelectedPointId(null);
    }
  };

  // Sugerir puntos automáticos desde el historial si el doctor lo desea
  const handleSuggestFromHistory = () => {
    const findings = analyzeAnatomicalFindings(patient, consultations);
    const withFindings = findings.filter(f => f.findings.length > 0);

    if (withFindings.length === 0) {
      alert('No se encontraron diagnósticos previos vinculados a zonas corporales para sugerir.');
      return;
    }

    const defaultCoords: Record<string, { x: number; y: number }> = activeSpeciesView === 'feline' 
      ? {
          head: { x: 20, y: 28 },
          neck: { x: 30, y: 38 },
          thorax: { x: 42, y: 46 },
          spine: { x: 55, y: 32 },
          abdomen: { x: 62, y: 52 },
          front_limbs: { x: 38, y: 74 },
          hind_limbs: { x: 78, y: 72 },
          skin: { x: 50, y: 18 }
        }
      : {
          head: { x: 21, y: 26 },
          neck: { x: 32, y: 36 },
          thorax: { x: 44, y: 48 },
          spine: { x: 56, y: 33 },
          abdomen: { x: 62, y: 55 },
          front_limbs: { x: 40, y: 72 },
          hind_limbs: { x: 78, y: 70 },
          skin: { x: 62, y: 18 }
        };

    const newGenerated: CustomAnatomicalPoint[] = withFindings.map(f => {
      const coord = defaultCoords[f.id] || { x: 50, y: 50 };
      const latest = f.findings[0];
      return {
        id: `auto_${Date.now()}_${f.id}`,
        patientId: patient.id,
        speciesTarget: activeSpeciesView,
        x: coord.x,
        y: coord.y,
        label: `${f.label.split(' ')[0]}: ${latest.text.slice(0, 35)}`,
        type: 'problem',
        notes: `Importado de ${latest.source}: "${latest.text}"`,
        date: latest.date || new Date().toISOString()
      };
    });

    updatePoints([...points, ...newGenerated]);
    alert(`Se agregaron ${newGenerated.length} puntos de referencia basados en el historial del paciente.`);
  };

  const selectedPoint = useMemo(() => {
    return points.find(p => p.id === selectedPointId) || null;
  }, [points, selectedPointId]);

  const activePointsCount = points.filter(p => p.type === 'problem').length;

  const getPinColor = (type: PointSeverity) => {
    switch (type) {
      case 'problem':
        return {
          bg: 'bg-red-500',
          border: 'border-white',
          text: 'text-white',
          ping: 'bg-red-500/40',
          badge: 'bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-300'
        };
      case 'observation':
        return {
          bg: 'bg-primary',
          border: 'border-white',
          text: 'text-white',
          ping: 'bg-primary/40',
          badge: 'bg-primary/10 text-primary'
        };
      case 'resolved':
        return {
          bg: 'bg-emerald-500',
          border: 'border-white',
          text: 'text-white',
          ping: 'bg-emerald-500/40',
          badge: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
        };
    }
  };

  const currentImage = activeSpeciesView === 'feline' 
    ? '/anatomy-feline.jpg' 
    : '/anatomy-canine.jpg';

  return (
    <div className="w-full rounded-[28px] bg-surface-container-lowest/80 backdrop-blur-xl border border-surface-container-high shadow-sm overflow-hidden transition-all duration-300">
      
      {/* HEADER BENTO */}
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-surface-container-high/20 transition-colors select-none border-b border-surface-container-high/60"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-headline-sm text-base md:text-lg text-on-surface m-0 font-bold">
                Esquema Anatómico & Puntos de Referencia
              </h3>
              {activePointsCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-300 text-[11px] font-bold">
                  {activePointsCount} {activePointsCount === 1 ? 'dolencia activa' : 'dolencias activas'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-bold">
                  {points.length} {points.length === 1 ? 'punto registrado' : 'puntos registrados'}
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant m-0 mt-0.5">
              Coloca, edita o elimina marcas clínicas libres sobre el animal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Conmutador Especie: Canino vs Felino */}
          <div 
            onClick={e => e.stopPropagation()} 
            className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/40"
          >
            <button
              type="button"
              onClick={() => setActiveSpeciesView('canine')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSpeciesView === 'canine' 
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-bold' 
                  : 'text-outline hover:text-on-surface'
              }`}
              title="Ver esquema canino / cuadrúpedo general"
            >
              <Dog className="w-3.5 h-3.5" />
              <span>Canino</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSpeciesView('feline')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSpeciesView === 'feline' 
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-bold' 
                  : 'text-outline hover:text-on-surface'
              }`}
              title="Ver esquema felino (gatos)"
            >
              <Cat className="w-3.5 h-3.5" />
              <span>Felino</span>
            </button>
          </div>

          <button 
            type="button"
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-xl hover:bg-surface-container transition-colors"
            aria-label={isExpanded ? 'Colapsar mapa' : 'Expandir mapa'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* CONTENIDO DEL MAPA BENTO */}
      {isExpanded && (
        <div className="p-6 flex flex-col gap-5">
          
          {/* BARRA DE HERRAMIENTAS RÁPIDAS DEL DOCTOR */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low/60 p-3 rounded-2xl border border-outline-variant/30">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlacingPoint(prev => !prev)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                  isPlacingPoint
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-primary text-on-primary hover:opacity-90'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>{isPlacingPoint ? 'Haz clic en el animal...' : 'Añadir Punto'}</span>
              </button>

              {isPlacingPoint && (
                <button
                  type="button"
                  onClick={() => setIsPlacingPoint(false)}
                  className="px-2.5 py-1.5 rounded-xl text-xs text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {consultations.length > 0 && (
                <button
                  type="button"
                  onClick={handleSuggestFromHistory}
                  className="px-3 py-1.5 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Importar hallazgos de consultas previas como puntos"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sugerir desde historial</span>
                </button>
              )}
              <span className="text-[11px] text-on-surface-variant font-medium">
                {points.length} {points.length === 1 ? 'punto libre' : 'puntos libres'}
              </span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-between">
            
            {/* ÁREA INTERACTIVA CON LA IMAGEN LIMPIA SELECCIONADA */}
            <div className="flex flex-col items-center w-full max-w-[440px]">
              <div 
                ref={containerRef}
                onClick={handleImageClick}
                className={`relative w-full aspect-[16/10] bg-white rounded-2xl p-1 border border-outline-variant/40 shadow-xs overflow-hidden select-none transition-all ${
                  isPlacingPoint 
                    ? 'cursor-crosshair ring-2 ring-amber-500/80 shadow-md' 
                    : 'cursor-default'
                }`}
              >
                <img 
                  src={currentImage} 
                  alt={`Silueta zoomorfa ${activeSpeciesView}`} 
                  className="w-full h-full object-contain pointer-events-none select-none transition-opacity duration-300"
                />

                {/* Mensaje de guía cuando está en modo colocación */}
                {isPlacingPoint && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg pointer-events-none flex items-center gap-1">
                    <span>Haz clic donde desees fijar la marca</span>
                  </div>
                )}

                {/* Puntos interactivos colocados libremente por el doctor */}
                {points.map(p => {
                  const colors = getPinColor(p.type);
                  const isSelected = selectedPointId === p.id;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPointId(isSelected ? null : p.id);
                      }}
                      style={{ top: `${p.y}%`, left: `${p.x}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 group ${
                        isSelected ? 'scale-130 z-30' : 'hover:scale-115 z-20'
                      }`}
                      title={`${p.label} (${p.type})`}
                    >
                      {/* Efecto de pulso si es una dolencia activa */}
                      {p.type === 'problem' && (
                        <span className={`absolute -inset-1 rounded-full animate-ping ${colors.ping}`} />
                      )}

                      <span className={`relative flex items-center justify-center rounded-full border-2 transition-all shadow-md w-5 h-5 ${colors.bg} ${colors.border} ${colors.text} text-[10px] font-bold`}>
                        {isSelected ? '✓' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between w-full px-2 pt-2 text-[11px] text-on-surface-variant font-medium">
                <span>
                  {isPlacingPoint 
                    ? '🎯 Haz clic en cualquier parte del cuerpo' 
                    : 'Haz clic en "+ Añadir Punto" para marcar una dolencia'}
                </span>
                <span className="text-outline text-[10px] capitalize">{activeSpeciesView}</span>
              </div>
            </div>

            {/* PANEL LATERAL DE DETALLE O LISTA DE PUNTOS */}
            <div className="flex-1 w-full flex flex-col justify-between min-h-[220px]">
              {selectedPoint ? (
                /* DETALLE DEL PUNTO SELECCIONADO */
                <div className="bg-surface-container-low/70 rounded-2xl p-5 border border-outline-variant/40 flex flex-col gap-3 animate-in fade-in duration-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${getPinColor(selectedPoint.type).badge}`}>
                          {selectedPoint.type === 'problem' ? 'Dolencia / Problema' : selectedPoint.type === 'observation' ? 'Observación' : 'Resuelto'}
                        </span>
                        <span className="text-[10px] text-outline">{formatLocalDate(selectedPoint.date)}</span>
                      </div>
                      <h4 className="text-lg font-bold text-on-surface m-0 mt-1">{selectedPoint.label}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPointId(null)}
                      className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {selectedPoint.notes && (
                    <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30 text-xs text-on-surface leading-relaxed">
                      <strong className="block text-[10px] uppercase text-outline mb-1">Notas Clínicas:</strong>
                      {selectedPoint.notes}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container-high">
                    <button
                      type="button"
                      onClick={() => handleDeletePoint(selectedPoint.id)}
                      className="px-3 py-1.5 rounded-xl text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200/80 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(selectedPoint)}
                      className="px-3 py-1.5 rounded-xl text-xs bg-primary text-on-primary hover:opacity-90 transition-opacity flex items-center gap-1.5 font-medium cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* LISTA GENERAL DE PUNTOS REGISTRADOS */
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-outline">
                      Puntos Registrados en este Paciente ({points.length})
                    </span>
                    {points.length > 0 && (
                      <span className="text-[11px] text-on-surface-variant">
                        Haz clic en uno para editarlo o ubicarlo
                      </span>
                    )}
                  </div>

                  {points.length === 0 ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center gap-2 bg-surface-container-low/40 rounded-2xl border border-dashed border-outline-variant/60 p-4">
                      <Heart className="w-8 h-8 text-outline opacity-40" />
                      <p className="text-xs font-semibold text-on-surface m-0">No hay puntos de referencia marcados aún.</p>
                      <p className="text-[11px] text-outline m-0 max-w-xs">
                        Pulsa <strong>"+ Añadir Punto"</strong> y haz clic en la parte del cuerpo donde quieras registrar una lesión, masa o dolencia.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-surface-container-high border border-surface-container-high rounded-xl overflow-hidden bg-surface-container-lowest max-h-[180px] overflow-y-auto">
                      {points.map(p => {
                        const colors = getPinColor(p.type);
                        return (
                          <div 
                            key={p.id}
                            onClick={() => setSelectedPointId(p.id)}
                            className="p-3 text-xs flex items-center justify-between hover:bg-surface-container-high/30 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.bg}`} />
                              <div>
                                <p className="font-semibold text-on-surface m-0 leading-tight">{p.label}</p>
                                {p.notes && (
                                  <p className="text-[11px] text-on-surface-variant m-0 truncate max-w-xs opacity-80">{p.notes}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-outline">{formatLocalDate(p.date)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* MODAL / FORMULARIO PARA CREAR O EDITAR UN PUNTO */}
      {showPointModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest text-on-surface rounded-[28px] p-6 w-full max-w-md shadow-2xl flex flex-col gap-5 border border-outline-variant/40">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                  {editingPointId ? 'Editar Punto Anatómico' : 'Nuevo Punto de Referencia'}
                </span>
                <h3 className="text-xl font-bold text-on-surface m-0">
                  {editingPointId ? 'Modificar Registro' : 'Fijar Marca Anatómica'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPointModal(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-outline">
                  Descripción / Hallazgo *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Masa subcutánea 2cm, Otitis dolorosa, Dolor a la palpación..."
                  value={pointForm.label}
                  onChange={e => setPointForm({ ...pointForm, label: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-sm font-medium text-on-surface"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-outline">
                  Estado Clínico de la Marca
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPointForm({ ...pointForm, type: 'problem' })}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      pointForm.type === 'problem'
                        ? 'bg-red-500 text-white border-red-500 shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant/40 hover:bg-surface-container'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                    <span>Dolencia / Alerta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPointForm({ ...pointForm, type: 'observation' })}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      pointForm.type === 'observation'
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant/40 hover:bg-surface-container'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                    <span>Observación</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPointForm({ ...pointForm, type: 'resolved' })}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      pointForm.type === 'resolved'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant/40 hover:bg-surface-container'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span>Resuelto</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-outline">
                  Notas Clínicas Adicionales (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Evolución, tratamiento recomendado, dimensiones o indicaciones..."
                  value={pointForm.notes}
                  onChange={e => setPointForm({ ...pointForm, notes: e.target.value })}
                  className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-xs text-on-surface resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-surface-container-high">
              <button
                type="button"
                onClick={() => setShowPointModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePoint}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingPointId ? 'Guardar Cambios' : 'Fijar Punto'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
