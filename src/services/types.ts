export type PatientStatus = 'NORMAL' | 'PRECAUTION' | 'HIGH_RISK' | 'DECEASED';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface Patient extends BaseEntity {
  name: string;
  species: string;
  breed?: string;
  gender: 'M' | 'F' | 'U';
  birthDate: string; // YYYY-MM-DD
  weight?: string; // e.g. "28 kg"
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
  ownerId?: string; // Identification number
  color?: string;
  isSterilized?: boolean;
  status: PatientStatus;
  behaviorObservation?: string;
  deceasedDate?: string;
  deceasedReason?: string;
}

export interface Consultation extends BaseEntity {
  patientId: string;
  reason: 'Consulta' | 'Control' | 'Emergencia' | 'Otro';
  observation: string;
  diagnosis: string;
  treatment: string;
  nextControl?: string; // YYYY-MM-DD
}

export interface Prescription extends BaseEntity {
  patientId: string;
  veterinarian: string;
  medication: string;
  presentation: string;
  dosage: string;
  frequency: string;
  duration: string;
  indications: string;
  date: string; // YYYY-MM-DD
}

export interface Vaccine extends BaseEntity {
  patientId: string;
  vaccineName: string; // Includes "Otra" logic but stores string
  applicationDate: string; // YYYY-MM-DD
  nextDose?: string; // YYYY-MM-DD
  batch?: string;
  manufacturer?: string;
  observations?: string;
}

export interface LabResult extends BaseEntity {
  patientId: string;
  examType: 'Hemograma' | 'Química sanguínea' | 'Coproparasitario' | 'Otro' | string;
  date: string; // YYYY-MM-DD
  result: string;
  interpretation?: string;
  veterinarian: string;
}

export interface Surgery extends BaseEntity {
  patientId: string;
  procedure: string;
  date: string; // YYYY-MM-DD
  reason: string;
  veterinarian: string;
  anesthesia: string;
  observations?: string;
  evolutionResult?: string;
  nextControl?: string; // YYYY-MM-DD
}

// Flat structure for manual events (e.g. custom appointments)
export interface ManualEvent extends BaseEntity {
  patientId: string;
  type: string;
  date: string; // YYYY-MM-DD
  description: string;
}

export interface Grooming extends BaseEntity {
  patientId: string;
  service: string;
  date: string; // YYYY-MM-DD (or ISO string)
  observations?: string;
}

export interface WeightRecord extends BaseEntity {
  patientId: string;
  weightKg: number;
  date: string; // ISO string
  notes?: string;
}

export interface GlobalSettings {
  clinicName: string;
  doctorName: string;
}

// This interface abstracts away the underlying storage
export interface IDataService {
  // Patients
  getPatients(): Promise<Patient[]>;
  getAllPatients(): Promise<Patient[]>;
  getPatientById(id: string): Promise<Patient | null>;
  savePatient(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }): Promise<Patient>;
  updatePatient(patientId: string, updates: Partial<Patient>): Promise<Patient>;
  updatePatientStatus(id: string, status: PatientStatus, behavior?: string, deceasedDate?: string, deceasedReason?: string): Promise<Patient>;
  deletePatient(id: string): Promise<void>;
  
  // Consultations
  getAllConsultations(): Promise<Consultation[]>;
  getConsultationsByPatient(patientId: string): Promise<Consultation[]>;
  saveConsultation(consultation: Omit<Consultation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }): Promise<Consultation>;
  deleteConsultation(id: string): Promise<void>;
  
  // Prescriptions
  getPrescriptionsByPatient(patientId: string): Promise<Prescription[]>;
  savePrescription(prescription: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }): Promise<Prescription>;
  deletePrescription(id: string): Promise<void>;
  
  // Vaccines
  getAllVaccines(): Promise<Vaccine[]>;
  getVaccinesByPatient(patientId: string): Promise<Vaccine[]>;
  saveVaccine(vaccine: Omit<Vaccine, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }): Promise<Vaccine>;
  deleteVaccine(id: string): Promise<void>;
  
  // Labs
  getLabsByPatient(patientId: string): Promise<LabResult[]>;
  saveLab(lab: Omit<LabResult, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }): Promise<LabResult>;
  deleteLab(id: string): Promise<void>;
  
  // Surgeries
  getAllSurgeries(): Promise<Surgery[]>;
  getSurgeriesByPatient(patientId: string): Promise<Surgery[]>;
  saveSurgery(surgery: Omit<Surgery, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }): Promise<Surgery>;
  deleteSurgery(id: string): Promise<void>;
  
  // Settings
  getSettings(): Promise<GlobalSettings | null>;
  saveSettings(settings: GlobalSettings): Promise<void>;

  // Events
  getManualEvents(): Promise<ManualEvent[]>;
  saveManualEvent(event: Omit<ManualEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }): Promise<ManualEvent>;

  // Groomings
  getGroomingsByPatient(patientId: string): Promise<Grooming[]>;
  saveGrooming(grooming: Omit<Grooming, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }): Promise<Grooming>;
  deleteGrooming(id: string): Promise<void>;

  // Weight Records
  getWeightRecordsByPatient(patientId: string): Promise<WeightRecord[]>;
  saveWeightRecord(record: Omit<WeightRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }): Promise<WeightRecord>;
  deleteWeightRecord(id: string): Promise<void>;
}
