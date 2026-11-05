import { describe, it, expect, beforeEach } from 'vitest';
import { 
  detectQuadrant, 
  getAccumulatedPointsForPatient, 
  syncPointsForSource, 
  removePointsForSource,
  getCustomAnatomyPoints 
} from '../src/utils/customAnatomyPoints';

describe('Custom Anatomy Points & Cumulative Summary Tests', () => {

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    } else {
      const store: Record<string, string> = {};
      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          getItem: (key: string) => store[key] || null,
          setItem: (key: string, val: string) => { store[key] = val; },
          removeItem: (key: string) => { delete store[key]; },
          clear: () => { for (const k in store) delete store[k]; }
        },
        writable: true,
        configurable: true
      });
    }

    if (typeof window === 'undefined') {
      Object.defineProperty(globalThis, 'window', {
        value: {
          dispatchEvent: () => true,
          addEventListener: () => {},
          removeEventListener: () => {}
        },
        writable: true,
        configurable: true
      });
    }
  });

  describe('Detección automática de cuadrantes', () => {
    it('debe detectar cuadrante craneal para coordenadas de cabeza', () => {
      expect(detectQuadrant(20, 30)).toBe('cranial');
    });

    it('debe detectar cuadrante torácico para coordenadas medias de pecho', () => {
      expect(detectQuadrant(45, 50)).toBe('thoracic');
    });

    it('debe detectar cuadrante abdominal para vientre', () => {
      expect(detectQuadrant(60, 55)).toBe('abdominal');
    });

    it('debe detectar cuadrante dorsal para lomo', () => {
      expect(detectQuadrant(50, 25)).toBe('dorsal');
    });

    it('debe detectar miembros delanteros y traseros', () => {
      expect(detectQuadrant(30, 80)).toBe('forelimb');
      expect(detectQuadrant(70, 75)).toBe('hindlimb');
    });
  });

  describe('Suma acumulada y filtrado estricto por historia clínica y cirugías', () => {
    const patientId = 'patient_123';

    it('debe acumular puntos de varias consultas y cirugías', () => {
      // Consulta 1
      syncPointsForSource(
        patientId,
        'consultation',
        'c_1',
        'Consulta 1',
        '2026-10-01T10:00:00Z',
        [{ x: 20, y: 30, quadrant: 'cranial', label: 'Otitis', type: 'problem' }]
      );

      // Consulta 2
      syncPointsForSource(
        patientId,
        'consultation',
        'c_2',
        'Consulta 2',
        '2026-10-15T10:00:00Z',
        [{ x: 45, y: 50, quadrant: 'thoracic', label: 'Soplo', type: 'observation' }]
      );

      // Cirugía
      syncPointsForSource(
        patientId,
        'surgery',
        's_1',
        'Cirugía 1',
        '2026-10-20T10:00:00Z',
        [{ x: 60, y: 55, quadrant: 'abdominal', label: 'Incisión OVH', type: 'resolved' }]
      );

      const accumulated = getAccumulatedPointsForPatient(patientId, ['c_1', 'c_2'], ['s_1']);
      expect(accumulated.length).toBe(3);
      expect(accumulated.map(p => p.label)).toContain('Otitis');
      expect(accumulated.map(p => p.label)).toContain('Soplo');
      expect(accumulated.map(p => p.label)).toContain('Incisión OVH');
    });

    it('debe descartar puntos huérfanos que no pertenezcan a consultas o cirugías activas', () => {
      // Punto válido de consulta existente
      syncPointsForSource(
        patientId,
        'consultation',
        'c_active',
        'Consulta Activa',
        '2026-10-01T10:00:00Z',
        [{ x: 20, y: 30, quadrant: 'cranial', label: 'Punto Válido', type: 'problem' }]
      );

      // Punto huérfano con ID de consulta que ya no existe en el registro médico
      syncPointsForSource(
        patientId,
        'consultation',
        'c_deleted',
        'Consulta Borrada',
        '2026-09-01T10:00:00Z',
        [{ x: 30, y: 30, quadrant: 'cranial', label: 'Punto Fantasma', type: 'problem' }]
      );

      // Solo pasamos c_active como ID válido
      const validPoints = getAccumulatedPointsForPatient(patientId, ['c_active'], []);
      expect(validPoints.length).toBe(1);
      expect(validPoints[0].label).toBe('Punto Válido');
    });

    it('debe limpiar los puntos al eliminar una consulta con removePointsForSource', () => {
      syncPointsForSource(
        patientId,
        'consultation',
        'c_temp',
        'Consulta Temporal',
        '2026-10-01T10:00:00Z',
        [{ x: 20, y: 30, quadrant: 'cranial', label: 'Dolor oído', type: 'problem' }]
      );

      expect(getCustomAnatomyPoints(patientId).length).toBe(1);

      removePointsForSource(patientId, 'c_temp');
      expect(getCustomAnatomyPoints(patientId).length).toBe(0);
    });
  });
});
