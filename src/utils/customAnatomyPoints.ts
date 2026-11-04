export type PointSeverity = 'problem' | 'observation' | 'resolved';

export interface CustomAnatomicalPoint {
  id: string;
  patientId: string;
  speciesTarget?: 'canine' | 'feline' | 'universal';
  x: number; // Porcentaje relativo horizontal (0 a 100%)
  y: number; // Porcentaje relativo vertical (0 a 100%)
  label: string;
  type: PointSeverity;
  notes?: string;
  date: string;
}

const STORAGE_KEY_PREFIX = 'axioma_vet_anatomy_points_';

export function getCustomAnatomyPoints(patientId: string): CustomAnatomicalPoint[] {
  if (!patientId || typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${patientId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
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
