import type { Consultation, Prescription, WeightRecord, Patient } from '../services/types';

export interface WeightDeltaResult {
  hasValidDelta: boolean;
  currentWeightKg: number;
  previousWeightKg: number;
  deltaKg: number;
  deltaPercentage: number;
  currentDate: string;
  previousDate: string;
  isSignificantChange: boolean; // Umbral puramente informativo (>= 5%)
}

export interface PendingControlResult {
  hasPendingControl: boolean;
  originConsultationDate: string;
  scheduledControlDate: string;
}

export interface LastTreatmentSummary {
  hasStructuredPrescription: boolean;
  prescriptionDetails?: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    date: string;
  };
  hasFreeTextTreatment: boolean;
  freeTextTreatment?: {
    text: string;
    date: string;
  };
}

export interface ClinicalMemoryAnalysis {
  weightDelta: WeightDeltaResult | null;
  pendingControl: PendingControlResult | null;
  lastTreatment: LastTreatmentSummary | null;
  importantObservations: {
    text: string;
    source: string;
    date?: string;
  }[];
}

/**
 * Calcula la variación de peso entre los dos registros válidos más recientes.
 * Valida valores positivos, finitos y fechas distintas.
 */
export function calculateWeightDelta(records: WeightRecord[]): WeightDeltaResult | null {
  if (!records || records.length < 2) return null;

  // Filtrar registros válidos: numéricos, mayores a 0 y con fecha válida
  const validRecords = records
    .filter(r => typeof r.weightKg === 'number' && !isNaN(r.weightKg) && r.weightKg > 0 && r.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (validRecords.length < 2) return null;

  const current = validRecords[0];
  const previous = validRecords[1];

  // Verificar que las fechas sean distintas para evitar duplicados en el mismo momento
  if (current.date === previous.date) return null;

  const deltaKg = parseFloat((current.weightKg - previous.weightKg).toFixed(2));
  const deltaPercentage = parseFloat(((deltaKg / previous.weightKg) * 100).toFixed(1));
  const isSignificantChange = Math.abs(deltaPercentage) >= 5.0;

  return {
    hasValidDelta: true,
    currentWeightKg: current.weightKg,
    previousWeightKg: previous.weightKg,
    deltaKg,
    deltaPercentage,
    currentDate: current.date,
    previousDate: previous.date,
    isSignificantChange
  };
}

/**
 * Evalúa si existe un control programado en una consulta previa
 * sin que exista una consulta posterior a la fecha programada.
 */
export function evaluatePendingControl(consultations: Consultation[]): PendingControlResult | null {
  if (!consultations || consultations.length === 0) return null;

  // Ordenar cronológicamente ascendente para evaluar la línea de tiempo
  const sorted = [...consultations].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return timeA - timeB;
  });

  // Buscar si alguna consulta con nextControl no tiene consulta posterior
  for (let i = sorted.length - 1; i >= 0; i--) {
    const c = sorted[i];
    if (c.nextControl && c.nextControl.trim() !== '') {
      const scheduledDate = new Date(c.nextControl);
      if (isNaN(scheduledDate.getTime())) continue;

      // Verificar si hay consultas creadas en o después de la fecha programada
      const hasSubsequentConsultation = sorted.some((other, idx) => {
        if (idx <= i) return false;
        const otherDate = new Date(other.createdAt);
        return !isNaN(otherDate.getTime()) && otherDate.getTime() >= scheduledDate.getTime();
      });

      if (!hasSubsequentConsultation) {
        return {
          hasPendingControl: true,
          originConsultationDate: c.createdAt,
          scheduledControlDate: c.nextControl
        };
      }
    }
  }

  return null;
}

/**
 * Obtiene el último tratamiento registrado diferenciando claramente
 * entre Prescription estructurada y Consultation.treatment en texto libre.
 * Nunca altera ni interpreta el texto del profesional.
 */
export function getLastTreatmentSummary(
  prescriptions: Prescription[],
  consultations: Consultation[]
): LastTreatmentSummary | null {
  const sortedPrescriptions = [...(prescriptions || [])].sort((a, b) => {
    const dateA = new Date(a.date || a.createdAt).getTime();
    const dateB = new Date(b.date || b.createdAt).getTime();
    return dateB - dateA;
  });

  const sortedConsultations = [...(consultations || [])].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const latestPrescription = sortedPrescriptions.length > 0 ? sortedPrescriptions[0] : null;
  const latestConsultationWithTreatment = sortedConsultations.find(
    c => c.treatment && c.treatment.trim() !== ''
  );

  if (!latestPrescription && !latestConsultationWithTreatment) {
    return null;
  }

  return {
    hasStructuredPrescription: !!latestPrescription,
    prescriptionDetails: latestPrescription
      ? {
          medication: latestPrescription.medication,
          dosage: latestPrescription.dosage,
          frequency: latestPrescription.frequency,
          duration: latestPrescription.duration,
          date: latestPrescription.date || latestPrescription.createdAt
        }
      : undefined,
    hasFreeTextTreatment: !!latestConsultationWithTreatment,
    freeTextTreatment: latestConsultationWithTreatment
      ? {
          text: latestConsultationWithTreatment.treatment,
          date: latestConsultationWithTreatment.createdAt
        }
      : undefined
  };
}

/**
 * Función integradora que genera el análisis de memoria clínica del paciente
 * de forma determinista y sin efectos secundarios.
 */
export function buildClinicalMemory(
  patient: Patient,
  consultations: Consultation[],
  prescriptions: Prescription[],
  weights: WeightRecord[]
): ClinicalMemoryAnalysis {
  const weightDelta = calculateWeightDelta(weights);
  const pendingControl = evaluatePendingControl(consultations);
  const lastTreatment = getLastTreatmentSummary(prescriptions, consultations);

  const importantObservations: { text: string; source: string; date?: string }[] = [];

  // Observación conductual / clínica del perfil general
  if (patient.behaviorObservation && patient.behaviorObservation.trim() !== '') {
    importantObservations.push({
      text: patient.behaviorObservation.trim(),
      source: 'Observación registrada en perfil'
    });
  }

  return {
    weightDelta,
    pendingControl,
    lastTreatment,
    importantObservations
  };
}
