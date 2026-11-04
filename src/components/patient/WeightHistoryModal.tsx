import { useState, useEffect } from 'react';
import { X, TrendingUp, Edit2, Trash2, Check, RotateCcw } from 'lucide-react';
import { useVetContext } from '../../context/VetContext';
import type { WeightRecord } from '../../services/types';

interface WeightHistoryModalProps {
  patientId: string;
  onClose: () => void;
  onWeightChanged?: () => void;
}

export function WeightHistoryModal({ patientId, onClose, onWeightChanged }: WeightHistoryModalProps) {
  const { getWeightRecords, saveWeightRecord, deleteWeightRecord, updatePatient } = useVetContext();
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estado para edición en línea
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const data = await getWeightRecords(patientId);
      // Sort oldest to newest for the graph
      setRecords(data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } catch (error) {
      console.error("Error fetching weight records", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [patientId, getWeightRecords]);

  const syncLatestPatientWeight = async (sortedList: WeightRecord[]) => {
    if (sortedList.length > 0) {
      const latest = sortedList[sortedList.length - 1];
      await updatePatient(patientId, { weight: `${latest.weightKg} kg` });
    } else {
      await updatePatient(patientId, { weight: '' });
    }
    if (onWeightChanged) {
      onWeightChanged();
    }
  };

  const handleStartEdit = (record: WeightRecord) => {
    setEditingId(record.id);
    setEditWeight(record.weightKg.toString());
    // Normalizar fecha para input type="date" (YYYY-MM-DD)
    const dateObj = new Date(record.date);
    const formattedDate = !isNaN(dateObj.getTime()) 
      ? dateObj.toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0];
    setEditDate(formattedDate);
    setEditNotes(record.notes || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditWeight('');
    setEditDate('');
    setEditNotes('');
  };

  const handleSaveEdit = async (recordId: string) => {
    const val = parseFloat(editWeight);
    if (isNaN(val) || val <= 0) {
      alert('Ingresa un peso numérico válido mayor a 0');
      return;
    }
    if (!editDate) {
      alert('Selecciona una fecha válida');
      return;
    }

    try {
      setIsSaving(true);
      await saveWeightRecord({
        id: recordId,
        patientId,
        weightKg: val,
        date: new Date(editDate + 'T12:00:00Z').toISOString(),
        notes: editNotes.trim()
      });

      const updated = await getWeightRecords(patientId);
      const sorted = updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setRecords(sorted);
      await syncLatestPatientWeight(sorted);
      handleCancelEdit();
    } catch (err: any) {
      alert('Error al actualizar registro de peso: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    const isConfirmed = window.confirm('¿Estás seguro de que deseas eliminar este registro de peso? Esta acción no se puede deshacer.');
    if (!isConfirmed) return;

    try {
      setIsSaving(true);
      await deleteWeightRecord(recordId);
      const updated = await getWeightRecords(patientId);
      const sorted = updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setRecords(sorted);
      await syncLatestPatientWeight(sorted);
    } catch (err: any) {
      alert('Error al eliminar registro de peso: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const chartWidth = 400;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 40;
  const plotWidth = chartWidth - paddingX * 2;
  const plotHeight = chartHeight - paddingY * 2;

  const minWeight = records.length > 0 ? Math.min(...records.map(r => r.weightKg)) : 0;
  const maxWeight = records.length > 0 ? Math.max(...records.map(r => r.weightKg)) : 10;
  const yMin = Math.max(0, minWeight - (maxWeight - minWeight) * 0.2 - 1);
  const yMax = maxWeight + (maxWeight - minWeight) * 0.2 + 1;
  const yRange = yMax - yMin;

  const getX = (index: number) => {
    if (records.length === 1) return chartWidth / 2;
    return paddingX + (index / (records.length - 1)) * plotWidth;
  };

  const getY = (weight: number) => {
    if (yRange === 0) return chartHeight / 2;
    return chartHeight - paddingY - ((weight - yMin) / yRange) * plotHeight;
  };

  const points = records.map((r, i) => `${getX(i)},${getY(r.weightKg)}`).join(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest text-on-surface w-full max-w-lg rounded-[24px] shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-surface-container-high">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="w-6 h-6" />
            <h3 className="font-headline-sm m-0">Evolución e Historial de Peso</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-outline hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {isLoading ? (
            <div className="w-full py-8 flex justify-center text-outline">Cargando historial...</div>
          ) : records.length === 0 ? (
            <div className="w-full py-8 flex flex-col items-center text-outline gap-2">
              <TrendingUp className="w-12 h-12 opacity-50" />
              <p className="font-body-md text-center m-0">No hay registros históricos de peso aún.</p>
              <p className="font-label-sm opacity-70 text-center m-0">Edita el peso del paciente para crear el primer registro.</p>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-6">
              {/* Gráfica interactiva de SVG */}
              <div className="w-full overflow-x-auto bg-surface-container-low/40 p-3 rounded-2xl border border-outline-variant/30">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[300px] h-auto drop-shadow-sm">
                  {/* Grid lines */}
                  {[0, 0.5, 1].map(ratio => {
                    const y = chartHeight - paddingY - ratio * plotHeight;
                    const val = yMin + ratio * yRange;
                    return (
                      <g key={`grid-${ratio}`}>
                        <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="currentColor" strokeOpacity={0.1} strokeWidth="1" strokeDasharray="4 4" />
                        <text x={paddingX - 10} y={y + 4} textAnchor="end" className="text-[10px] fill-outline">{val.toFixed(1)}</text>
                      </g>
                    );
                  })}
                  
                  {/* Line */}
                  <polyline 
                    points={points}
                    fill="none"
                    stroke="var(--color-primary, #6d28d9)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Data points and labels */}
                  {records.map((record, index) => (
                    <g key={record.id}>
                      <circle 
                        cx={getX(index)} 
                        cy={getY(record.weightKg)} 
                        r="5" 
                        fill="var(--color-surface-container-lowest, #ffffff)" 
                        stroke="var(--color-primary, #6d28d9)" 
                        strokeWidth="2" 
                      />
                      <text 
                        x={getX(index)} 
                        y={getY(record.weightKg) - 10} 
                        textAnchor="middle" 
                        className="text-[11px] font-bold fill-on-surface"
                      >
                        {record.weightKg}kg
                      </text>
                      <text 
                        x={getX(index)} 
                        y={chartHeight - 12} 
                        textAnchor="middle" 
                        className="text-[9px] fill-outline"
                      >
                        {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
              
              {/* Lista editable de registros */}
              <div className="w-full flex flex-col gap-2">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-label-md text-outline uppercase tracking-wider">
                    Registros ({records.length})
                  </h4>
                  <span className="text-[11px] text-on-surface-variant">
                    Puedes editar o eliminar cualquier registro
                  </span>
                </div>

                <div className="divide-y divide-surface-container-high border border-surface-container-high rounded-xl overflow-hidden bg-surface-container-lowest">
                  {records.slice().reverse().map(record => {
                    const isEditing = editingId === record.id;

                    if (isEditing) {
                      return (
                        <div key={record.id} className="p-3 bg-primary-container/10 flex flex-col gap-2 animate-in fade-in">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold uppercase text-outline">Peso (kg)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0.1"
                                value={editWeight}
                                onChange={e => setEditWeight(e.target.value)}
                                className="w-full px-2 py-1 text-sm rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-primary"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold uppercase text-outline">Fecha</label>
                              <input
                                type="date"
                                value={editDate}
                                onChange={e => setEditDate(e.target.value)}
                                className="w-full px-2 py-1 text-sm rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-primary"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase text-outline">Nota / Observación</label>
                            <input
                              type="text"
                              placeholder="Ej: En ayunas, post cirugía..."
                              value={editNotes}
                              onChange={e => setEditNotes(e.target.value)}
                              className="w-full px-2 py-1 text-sm rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-primary"
                            />
                          </div>
                          <div className="flex justify-end gap-2 mt-1">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                              className="px-2.5 py-1 text-xs rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(record.id)}
                              disabled={isSaving}
                              className="px-3 py-1 text-xs rounded-lg bg-primary text-on-primary font-medium hover:opacity-90 transition-opacity flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              {isSaving ? 'Guardando...' : 'Guardar'}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={record.id} className="p-3 flex items-center justify-between hover:bg-surface-container-high/30 transition-colors">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-headline-sm text-on-surface font-bold text-base">
                              {record.weightKg} kg
                            </span>
                            <span className="text-xs text-on-surface-variant font-medium">
                              · {new Date(record.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          {record.notes && (
                            <span className="text-[11px] text-outline italic">
                              "{record.notes}"
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(record)}
                            disabled={isSaving}
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary-container/20 rounded-lg transition-colors"
                            title="Editar este registro de peso"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(record.id)}
                            disabled={isSaving}
                            className="p-1.5 text-on-surface-variant hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                            title="Eliminar este registro de peso"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-surface-container-high bg-surface flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-surface-container text-on-surface font-label-md hover:bg-surface-container-high transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
