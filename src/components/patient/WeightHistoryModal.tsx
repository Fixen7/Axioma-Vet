import { useState, useEffect } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { useVetContext } from '../../context/VetContext';
import type { WeightRecord } from '../../services/types';

interface WeightHistoryModalProps {
  patientId: string;
  onClose: () => void;
}

export function WeightHistoryModal({ patientId, onClose }: WeightHistoryModalProps) {
  const { getWeightRecords } = useVetContext();
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await getWeightRecords(patientId);
        // Sort oldest to newest for the graph
        setRecords(data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      } catch (error) {
        console.error("Error fetching weight records", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecords();
  }, [patientId, getWeightRecords]);

  const chartWidth = 400;
  const chartHeight = 250;
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
      <div className="bg-surface-container-lowest text-on-surface w-full max-w-md rounded-[24px] shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-surface-container-high">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="w-6 h-6" />
            <h3 className="font-headline-sm m-0">Evolución de Peso</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-outline hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 items-center">
          {isLoading ? (
            <div className="w-full py-8 flex justify-center text-outline">Cargando historial...</div>
          ) : records.length === 0 ? (
            <div className="w-full py-8 flex flex-col items-center text-outline gap-2">
              <TrendingUp className="w-12 h-12 opacity-50" />
              <p className="font-body-md text-center m-0">No hay registros históricos de peso aún.</p>
              <p className="font-label-sm opacity-70 text-center m-0">Edita el peso del paciente para crear el primer registro.</p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-6">
              <div className="w-full overflow-x-auto">
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
                        y={getY(record.weightKg) - 12} 
                        textAnchor="middle" 
                        className="text-[12px] font-bold fill-on-surface"
                      >
                        {record.weightKg}kg
                      </text>
                      <text 
                        x={getX(index)} 
                        y={chartHeight - 15} 
                        textAnchor="middle" 
                        className="text-[10px] fill-outline"
                      >
                        {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
              
              <div className="w-full grid gap-2">
                <h4 className="font-label-md text-outline uppercase tracking-wider mb-2">Registros recientes</h4>
                {/* List view for screen readers and precise dates */}
                {records.slice().reverse().slice(0, 5).map(record => (
                  <div key={`list-${record.id}`} className="flex justify-between items-center py-2 border-b border-surface-container-high last:border-0">
                    <span className="font-body-md text-on-surface-variant">
                      {new Date(record.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="font-headline-sm text-on-surface">{record.weightKg} kg</span>
                  </div>
                ))}
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
