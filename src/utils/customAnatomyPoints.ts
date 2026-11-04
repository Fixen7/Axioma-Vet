export type PointSeverity = 'problem' | 'observation' | 'resolved';

export type AnatomicalQuadrant = 
  | 'cranial'       // Cuadrante Craneal / Cefálico (Cabeza, oídos, ojos, hocico, cuello)
  | 'thoracic'      // Cuadrante Torácico (Tórax, corazón, pulmones, costillas)
  | 'dorsal'        // Cuadrante Dorsal / Lomo (Columna vertebral)
  | 'abdominal'     // Cuadrante Abdominal / Ventral (Abdomen, digestivo, urogenital)
  | 'forelimb'      // Cuadrante Apendicular Anterior (Miembros anteriores)
  | 'hindlimb'      // Cuadrante Apendicular Posterior (Miembros posteriores y pelvis)
  | 'caudal';       // Cuadrante Caudal (Cola, zona perianal)

export const QUADRANT_LABELS: Record<AnatomicalQuadrant, string> = {
  cranial: 'Cuadrante Craneal (Cabeza y Cuello)',
  thoracic: 'Cuadrante Torácico (Pecho y Cardiorrespiratorio)',
  dorsal: 'Cuadrante Dorsal (Columna y Lomo)',
  abdominal: 'Cuadrante Abdominal (Vientre y Digestivo)',
  forelimb: 'Cuadrante Anterior (Miembros Delanteros)',
  hindlimb: 'Cuadrante Posterior (Caderas y Patas Traseras)',
  caudal: 'Cuadrante Caudal (Cola y Región Perianal)'
};

export interface CustomAnatomicalPoint {
  id: string;
  patientId: string;
  sourceType?: 'consultation' | 'surgery' | 'general';
  sourceId?: string; // ID de la consulta o cirugía a la que pertenece
  sourceTitle?: string; // Título descriptivo (ej: "Consulta: Control" o "Cirugía: Ovariohisterectomía")
  speciesTarget?: 'canine' | 'feline' | 'universal';
  x: number; // Porcentaje relativo horizontal (0 a 100%)
  y: number; // Porcentaje relativo vertical (0 a 100%)
  quadrant: AnatomicalQuadrant;
  label: string;
  type: PointSeverity;
  notes?: string;
  date: string;
}

const STORAGE_KEY_PREFIX = 'axioma_vet_anatomy_points_';

/**
 * Detecta automáticamente el cuadrante anatómico según las coordenadas relativas
 */
export function detectQuadrant(x: number, y: number): AnatomicalQuadrant {
  if (x < 35 && y < 55) return 'cranial';
  if (x >= 35 && x <= 55 && y >= 35 && y <= 65) return 'thoracic';
  if (x >= 35 && x <= 75 && y < 38) return 'dorsal';
  if (x >= 45 && x <= 78 && y >= 45 && y <= 68) return 'abdominal';
  if (x < 55 && y > 65) return 'forelimb';
  if (x >= 55 && y > 60) return 'hindlimb';
  if (x > 80 && y < 60) return 'caudal';
  return 'abdominal';
}

export function getCustomAnatomyPoints(patientId: string): CustomAnatomicalPoint[] {
  if (!patientId || typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${patientId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Normalizar para asegurar que todos los puntos tengan cuadrante
    return parsed.map(p => ({
      ...p,
      quadrant: p.quadrant || detectQuadrant(p.x, p.y)
    }));
  } catch (err) {
    console.error('Error al leer puntos anatómicos personalizados:', err);
    return [];
  }
}

export function saveCustomAnatomyPoints(patientId: string, points: CustomAnatomicalPoint[]): void {
  if (!patientId || typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${patientId}`, JSON.stringify(points));
  } catch (err) {
    console.error('Error al guardar puntos anatómicos personalizados:', err);
  }
}

/**
 * Obtiene los puntos vinculados a una consulta o cirugía específica
 */
export function getPointsBySource(patientId: string, sourceId: string): CustomAnatomicalPoint[] {
  const all = getCustomAnatomyPoints(patientId);
  return all.filter(p => p.sourceId === sourceId);
}

/**
 * Guarda o reemplaza los puntos asignados a una consulta o cirugía
 */
export function syncPointsForSource(
  patientId: string, 
  sourceType: 'consultation' | 'surgery',
  sourceId: string,
  sourceTitle: string,
  date: string,
  newPointsForSource: Omit<CustomAnatomicalPoint, 'id' | 'patientId' | 'sourceType' | 'sourceId' | 'sourceTitle' | 'date'>[]
): void {
  const all = getCustomAnatomyPoints(patientId);
  // Mantener los puntos de otras fuentes
  const others = all.filter(p => p.sourceId !== sourceId);

  const formatted: CustomAnatomicalPoint[] = newPointsForSource.map((p, idx) => ({
    ...p,
    id: `pt_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
    patientId,
    sourceType,
    sourceId,
    sourceTitle,
    date,
    quadrant: p.quadrant || detectQuadrant(p.x, p.y)
  }));

  saveCustomAnatomyPoints(patientId, [...others, ...formatted]);
}

/**
 * Elimina los puntos asociados a una consulta o cirugía eliminada
 */
export function removePointsForSource(patientId: string, sourceId: string): void {
  const all = getCustomAnatomyPoints(patientId);
  const filtered = all.filter(p => p.sourceId !== sourceId);
  saveCustomAnatomyPoints(patientId, filtered);
}
