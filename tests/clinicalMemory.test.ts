import { describe, it, expect } from 'vitest';
import { calculateWeightDelta, evaluatePendingControl, getLastTreatmentSummary } from '../src/utils/clinicalMemory';
import type { WeightRecord, Consultation, Prescription } from '../src/services/types';

describe('Axioma Clinical Memory Engine - Fase 1 (Tests Unitarios)', () => {
  
  describe('Cálculo de Delta Ponderal', () => {
    it('debe retornar null si no hay registros o solo hay uno', () => {
      expect(calculateWeightDelta([])).toBeNull();
      const single: WeightRecord[] = [{
        id: '1', patientId: 'p1', weightKg: 10, date: '2026-09-01T10:00:00Z',
        createdAt: '2026-09-01T10:00:00Z', updatedAt: '2026-09-01T10:00:00Z', createdBy: null
      }];
      expect(calculateWeightDelta(single)).toBeNull();
    });

    it('debe calcular correctamente el delta y el porcentaje entre dos registros válidos', () => {
      const records: WeightRecord[] = [
        {
          id: '1', patientId: 'p1', weightKg: 10, date: '2026-09-01T10:00:00Z',
          createdAt: '2026-09-01T10:00:00Z', updatedAt: '2026-09-01T10:00:00Z', createdBy: null
        },
        {
          id: '2', patientId: 'p1', weightKg: 9.2, date: '2026-10-01T10:00:00Z',
          createdAt: '2026-10-01T10:00:00Z', updatedAt: '2026-10-01T10:00:00Z', createdBy: null
        }
      ];

      const result = calculateWeightDelta(records);
      expect(result).not.toBeNull();
      expect(result?.currentWeightKg).toBe(9.2);
      expect(result?.previousWeightKg).toBe(10);
      expect(result?.deltaKg).toBe(-0.8);
      expect(result?.deltaPercentage).toBe(-8.0);
      expect(result?.isSignificantChange).toBe(true); // >= 5%
    });

    it('debe marcar isSignificantChange en false si la variación es menor al 5%', () => {
      const records: WeightRecord[] = [
        {
          id: '1', patientId: 'p1', weightKg: 10, date: '2026-09-01T10:00:00Z',
          createdAt: '2026-09-01T10:00:00Z', updatedAt: '2026-09-01T10:00:00Z', createdBy: null
        },
        {
          id: '2', patientId: 'p1', weightKg: 10.2, date: '2026-10-01T10:00:00Z',
          createdAt: '2026-10-01T10:00:00Z', updatedAt: '2026-10-01T10:00:00Z', createdBy: null
        }
      ];

      const result = calculateWeightDelta(records);
      expect(result?.deltaPercentage).toBe(2.0);
      expect(result?.isSignificantChange).toBe(false);
    });

    it('debe descartar registros con pesos inválidos o menores/iguales a 0', () => {
      const records: WeightRecord[] = [
        {
          id: '1', patientId: 'p1', weightKg: 0, date: '2026-09-01T10:00:00Z',
          createdAt: '2026-09-01T10:00:00Z', updatedAt: '2026-09-01T10:00:00Z', createdBy: null
        },
        {
          id: '2', patientId: 'p1', weightKg: -5, date: '2026-10-01T10:00:00Z',
          createdAt: '2026-10-01T10:00:00Z', updatedAt: '2026-10-01T10:00:00Z', createdBy: null
        }
      ];
      expect(calculateWeightDelta(records)).toBeNull();
    });
  });

  describe('Evaluación de Controles Programados Previos', () => {
    it('debe detectar un control previo pendiente si no hay consulta posterior', () => {
      const consultations: Consultation[] = [
        {
          id: 'c1', patientId: 'p1', reason: 'Consulta', observation: 'Fiebre', diagnosis: 'Infección',
          treatment: 'Antibiótico', nextControl: '2026-10-15',
          createdAt: '2026-10-01T10:00:00Z', updatedAt: '2026-10-01T10:00:00Z', createdBy: null
        }
      ];

      const result = evaluatePendingControl(consultations);
      expect(result).not.toBeNull();
      expect(result?.hasPendingControl).toBe(true);
      expect(result?.scheduledControlDate).toBe('2026-10-15');
    });

    it('no debe marcar pendiente si existe una consulta posterior a la fecha programada', () => {
      const consultations: Consultation[] = [
        {
          id: 'c1', patientId: 'p1', reason: 'Consulta', observation: 'Fiebre', diagnosis: 'Infección',
          treatment: 'Antibiótico', nextControl: '2026-10-15',
          createdAt: '2026-10-01T10:00:00Z', updatedAt: '2026-10-01T10:00:00Z', createdBy: null
        },
        {
          id: 'c2', patientId: 'p1', reason: 'Control', observation: 'Recuperado', diagnosis: 'Alta',
          treatment: 'Ninguno',
          createdAt: '2026-10-16T10:00:00Z', updatedAt: '2026-10-16T10:00:00Z', createdBy: null
        }
      ];

      const result = evaluatePendingControl(consultations);
      expect(result).toBeNull();
    });
  });

  describe('Separación Estricta de Tratamientos', () => {
    it('debe dar prioridad a Prescription estructurada y preservar sus campos originales', () => {
      const prescriptions: Prescription[] = [
        {
          id: 'pr1', patientId: 'p1', veterinarian: 'Dr. Roger', medication: 'Amoxicilina 250mg',
          presentation: 'Comprimidos', dosage: '1 pastilla', frequency: '12h', duration: '7 días',
          indications: 'Con comida', date: '2026-10-20',
          createdAt: '2026-10-20T10:00:00Z', updatedAt: '2026-10-20T10:00:00Z', createdBy: null
        }
      ];

      const consultations: Consultation[] = [
        {
          id: 'c1', patientId: 'p1', reason: 'Consulta', observation: 'Diarrea', diagnosis: 'Gastroenteritis',
          treatment: 'Dieta blanda y reposo',
          createdAt: '2026-10-10T10:00:00Z', updatedAt: '2026-10-10T10:00:00Z', createdBy: null
        }
      ];

      const result = getLastTreatmentSummary(prescriptions, consultations);
      expect(result?.hasStructuredPrescription).toBe(true);
      expect(result?.prescriptionDetails?.medication).toBe('Amoxicilina 250mg');
      expect(result?.prescriptionDetails?.frequency).toBe('12h');
    });

    it('debe mostrar el texto libre literal de Consultation.treatment sin parsing si no hay Prescription', () => {
      const consultations: Consultation[] = [
        {
          id: 'c1', patientId: 'p1', reason: 'Consulta', observation: 'Tos', diagnosis: 'Bronquitis',
          treatment: 'Jarabe antitusivo cada 8h por 5 días',
          createdAt: '2026-10-10T10:00:00Z', updatedAt: '2026-10-10T10:00:00Z', createdBy: null
        }
      ];

      const result = getLastTreatmentSummary([], consultations);
      expect(result?.hasStructuredPrescription).toBe(false);
      expect(result?.hasFreeTextTreatment).toBe(true);
      expect(result?.freeTextTreatment?.text).toBe('Jarabe antitusivo cada 8h por 5 días');
    });
  });

});
