import { supabase } from './supabase';
import type { 
  IDataService, 
  Patient, PatientStatus, 
  Consultation, Prescription, Vaccine, 
  LabResult, Surgery, GlobalSettings, ManualEvent,
  Grooming, WeightRecord
} from './types';

// Helper for mapping snake_case to camelCase
const toCamel = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamel(v));
  } else if (obj !== null && obj !== undefined && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      result[camelKey] = toCamel(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

// Helper for mapping camelCase to snake_case
const toSnake = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toSnake(v));
  } else if (obj !== null && obj !== undefined && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnake(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

export class SupabaseDataService implements IDataService {
  private activeWorkspaceId: string | null = null;

  public setWorkspaceId(id: string) {
    this.activeWorkspaceId = id;
  }

  private getWorkspaceId(): string {
    if (!this.activeWorkspaceId) throw new Error('Workspace no establecido en SupabaseDataService');
    return this.activeWorkspaceId;
  }
  
  private async getUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');
    return user.id;
  }

  // PATIENTS
  async getPatients(): Promise<Patient[]> {
    const { data, error } = await supabase.from('patients').select('*').eq('workspace_id', this.getWorkspaceId()).order('created_at', { ascending: false });
    if (error) throw error;
    return toCamel(data) as Patient[];
  }

  async getAllPatients(): Promise<Patient[]> {
    return this.getPatients();
  }

  async getPatientById(id: string): Promise<Patient | null> {
    const { data, error } = await supabase.from('patients').select('*').eq('id', id).eq('workspace_id', this.getWorkspaceId()).single();
    if (error) return null;
    return toCamel(data) as Patient;
  }

  async savePatient(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }): Promise<Patient> {
    const userId = await this.getUserId();
    
    if (patient.id) {
      const { workspace_id: _, ...updates } = toSnake(patient);
      const snakeData = { ...updates, created_by: userId };

      const { data, error } = await supabase.from('patients').update(snakeData).eq('id', patient.id).eq('workspace_id', this.getWorkspaceId()).select().single();
      if (error) throw error;
      return toCamel(data) as Patient;
    
    } else {
      const snakeData = toSnake({ ...patient, createdBy: userId });
      snakeData.workspace_id = this.getWorkspaceId();

      const { data, error } = await supabase.from('patients').insert(snakeData).select().single();
      if (error) throw error;
      return toCamel(data) as Patient;
    
    }
  }

  async updatePatient(patientId: string, updates: Partial<Patient>): Promise<Patient> {
    const { workspace_id: _, ...snakeData } = toSnake(updates) as any;
    const { data, error } = await supabase.from('patients').update(snakeData).eq('id', patientId).eq('workspace_id', this.getWorkspaceId()).select().single();
    if (error) throw error;
    return toCamel(data) as Patient;
  }

  async updatePatientStatus(id: string, status: PatientStatus, behavior?: string, deceasedDate?: string, deceasedReason?: string): Promise<Patient> {
    return this.updatePatient(id, { 
      status, 
      behaviorObservation: behavior, 
      deceasedDate, 
      deceasedReason 
    });
  }

  async deletePatient(id: string): Promise<void> {
    const { error } = await supabase.from('patients').delete().eq('id', id).eq('workspace_id', this.getWorkspaceId());
    if (error) throw error;
  }

  // CONSULTATIONS
  async getAllConsultations(): Promise<Consultation[]> {
    const { data, error } = await supabase.from('consultations').select('*').eq('workspace_id', this.getWorkspaceId());
    if (error) throw error;
    return toCamel(data) as Consultation[];
  }

  async getConsultationsByPatient(patientId: string): Promise<Consultation[]> {
    const { data, error } = await supabase.from('consultations').select('*').eq('patient_id', patientId).eq('workspace_id', this.getWorkspaceId()).order('created_at', { ascending: false });
    if (error) throw error;
    return toCamel(data) as Consultation[];
  }

  async saveConsultation(consultation: Omit<Consultation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }): Promise<Consultation> {
    const userId = await this.getUserId();
    
    if (consultation.id) {
      const { workspace_id: _, ...updates } = toSnake(consultation);
      const snakeData = { ...updates, created_by: userId };

      const { data, error } = await supabase.from('consultations').update(snakeData).eq('id', consultation.id).eq('workspace_id', this.getWorkspaceId()).select().single();
      if (error) throw error;
      return toCamel(data) as Consultation;
    
    } else {
      const snakeData = toSnake({ ...consultation, createdBy: userId });
      snakeData.workspace_id = this.getWorkspaceId();

      const { data, error } = await supabase.from('consultations').insert(snakeData).select().single();
      if (error) throw error;
      return toCamel(data) as Consultation;
    
    }
  }

  async deleteConsultation(id: string): Promise<void> {
    const { error } = await supabase.from('consultations').delete().eq('id', id).eq('workspace_id', this.getWorkspaceId());
    if (error) throw error;
  }

  // PRESCRIPTIONS
  async getPrescriptionsByPatient(patientId: string): Promise<Prescription[]> {
    const { data, error } = await supabase.from('prescriptions').select('*').eq('patient_id', patientId).eq('workspace_id', this.getWorkspaceId()).order('date', { ascending: false });
    if (error) throw error;
    return toCamel(data) as Prescription[];
  }

  async savePrescription(prescription: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }): Promise<Prescription> {
    const userId = await this.getUserId();
    
    if (prescription.id) {
      const { workspace_id: _, ...updates } = toSnake(prescription);
      const snakeData = { ...updates, created_by: userId };

      const { data, error } = await supabase.from('prescriptions').update(snakeData).eq('id', prescription.id).eq('workspace_id', this.getWorkspaceId()).select().single();
      if (error) throw error;
      return toCamel(data) as Prescription;
    
    } else {
      const snakeData = toSnake({ ...prescription, createdBy: userId });
      snakeData.workspace_id = this.getWorkspaceId();

      const { data, error } = await supabase.from('prescriptions').insert(snakeData).select().single();
      if (error) throw error;
      return toCamel(data) as Prescription;
    
    }
  }

  async deletePrescription(id: string): Promise<void> {
    const { error } = await supabase.from('prescriptions').delete().eq('id', id).eq('workspace_id', this.getWorkspaceId());
    if (error) throw error;
  }

  // VACCINES
  async getAllVaccines(): Promise<Vaccine[]> {
    const { data, error } = await supabase.from('vaccines').select('*').eq('workspace_id', this.getWorkspaceId());
    if (error) throw error;
    return toCamel(data) as Vaccine[];
  }

  async getVaccinesByPatient(patientId: string): Promise<Vaccine[]> {
    const { data, error } = await supabase.from('vaccines').select('*').eq('patient_id', patientId).eq('workspace_id', this.getWorkspaceId()).order('application_date', { ascending: false });
    if (error) throw error;
    return toCamel(data) as Vaccine[];
  }

  async saveVaccine(vaccine: Omit<Vaccine, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }): Promise<Vaccine> {
    const userId = await this.getUserId();
    
    if (vaccine.id) {
      const { workspace_id: _, ...updates } = toSnake(vaccine);
      const snakeData = { ...updates, created_by: userId };

      const { data, error } = await supabase.from('vaccines').update(snakeData).eq('id', vaccine.id).eq('workspace_id', this.getWorkspaceId()).select().single();
      if (error) throw error;
      return toCamel(data) as Vaccine;
    
    } else {
      const snakeData = toSnake({ ...vaccine, createdBy: userId });
      snakeData.workspace_id = this.getWorkspaceId();

      const { data, error } = await supabase.from('vaccines').insert(snakeData).select().single();
      if (error) throw error;
      return toCamel(data) as Vaccine;
    
    }
  }

  async deleteVaccine(id: string): Promise<void> {
    const { error } = await supabase.from('vaccines').delete().eq('id', id).eq('workspace_id', this.getWorkspaceId());
    if (error) throw error;
  }

  // LABS
  async getLabsByPatient(patientId: string): Promise<LabResult[]> {
    const { data, error } = await supabase.from('lab_results').select('*').eq('patient_id', patientId).eq('workspace_id', this.getWorkspaceId()).order('date', { ascending: false });
    if (error) throw error;
    return toCamel(data) as LabResult[];
  }

  async saveLab(lab: Omit<LabResult, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }): Promise<LabResult> {
    const userId = await this.getUserId();
    
    if (lab.id) {
      const { workspace_id: _, ...updates } = toSnake(lab);
      const snakeData = { ...updates, created_by: userId };

      const { data, error } = await supabase.from('lab_results').update(snakeData).eq('id', lab.id).eq('workspace_id', this.getWorkspaceId()).select().single();
      if (error) throw error;
      return toCamel(data) as LabResult;
    
    } else {
      const snakeData = toSnake({ ...lab, createdBy: userId });
      snakeData.workspace_id = this.getWorkspaceId();

      const { data, error } = await supabase.from('lab_results').insert(snakeData).select().single();
      if (error) throw error;
      return toCamel(data) as LabResult;
    
    }
  }

  async deleteLab(id: string): Promise<void> {
    const { error } = await supabase.from('lab_results').delete().eq('id', id).eq('workspace_id', this.getWorkspaceId());
    if (error) throw error;
  }

  // SURGERIES
  async getAllSurgeries(): Promise<Surgery[]> {
    const { data, error } = await supabase.from('surgeries').select('*').eq('workspace_id', this.getWorkspaceId());
    if (error) throw error;
    return toCamel(data) as Surgery[];
  }

  async getSurgeriesByPatient(patientId: string): Promise<Surgery[]> {
    const { data, error } = await supabase.from('surgeries').select('*').eq('patient_id', patientId).eq('workspace_id', this.getWorkspaceId()).order('date', { ascending: false });
    if (error) throw error;
    return toCamel(data) as Surgery[];
  }

  async saveSurgery(surgery: Omit<Surgery, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }): Promise<Surgery> {
    const userId = await this.getUserId();
    
    if (surgery.id) {
      const { workspace_id: _, ...updates } = toSnake(surgery);
      const snakeData = { ...updates, created_by: userId };

      const { data, error } = await supabase.from('surgeries').update(snakeData).eq('id', surgery.id).eq('workspace_id', this.getWorkspaceId()).select().single();
      if (error) throw error;
      return toCamel(data) as Surgery;
    
    } else {
      const snakeData = toSnake({ ...surgery, createdBy: userId });
      snakeData.workspace_id = this.getWorkspaceId();

      const { data, error } = await supabase.from('surgeries').insert(snakeData).select().single();
      if (error) throw error;
      return toCamel(data) as Surgery;
    
    }
  }

  async deleteSurgery(id: string): Promise<void> {
    const { error } = await supabase.from('surgeries').delete().eq('id', id).eq('workspace_id', this.getWorkspaceId());
    if (error) throw error;
  }

  // SETTINGS
  async getSettings(): Promise<GlobalSettings | null> {
    const { data, error } = await supabase.from('global_settings').select('*').eq('workspace_id', this.getWorkspaceId()).maybeSingle();
    if (error) throw error;
    return data ? toCamel(data) as GlobalSettings : null;
  }

  async saveSettings(settings: GlobalSettings): Promise<void> {
    const userId = await this.getUserId();
    const { workspace_id: _, ...updates } = toSnake(settings) as any;
    const snakeData = { ...updates, created_by: userId };
    
    const { data: existing } = await supabase.from('global_settings').select('id').eq('workspace_id', this.getWorkspaceId()).maybeSingle();
    
    if (existing) {
      const { error } = await supabase.from('global_settings').update(snakeData).eq('id', existing.id);
      if (error) throw error;
    } else {
      const insertData = { ...snakeData, workspace_id: this.getWorkspaceId() };
      const { error } = await supabase.from('global_settings').insert(insertData);
      if (error) throw error;
    }
  }

  // MANUAL EVENTS
  async getManualEvents(): Promise<ManualEvent[]> {
    const { data, error } = await supabase.from('manual_events').select('*').eq('workspace_id', this.getWorkspaceId());
    if (error) throw error;
    return toCamel(data) as ManualEvent[];
  }

  async saveManualEvent(event: Omit<ManualEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }): Promise<ManualEvent> {
    const userId = await this.getUserId();
    const snakeData = toSnake({ ...event, createdBy: userId });
    snakeData.workspace_id = this.getWorkspaceId();
    
    const { data, error } = await supabase.from('manual_events').insert(snakeData).select().single();
    if (error) throw error;
    return toCamel(data) as ManualEvent;
  }

  // GROOMINGS
  async getGroomingsByPatient(patientId: string): Promise<Grooming[]> {
    const { data, error } = await supabase.from('groomings').select('*').eq('patient_id', patientId).eq('workspace_id', this.getWorkspaceId()).order('date', { ascending: false });
    if (error) throw error;
    return toCamel(data) as Grooming[];
  }

  async saveGrooming(grooming: Omit<Grooming, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }): Promise<Grooming> {
    const userId = await this.getUserId();
    
    if (grooming.id) {
      const { workspace_id: _, ...updates } = toSnake(grooming);
      const snakeData = { ...updates, created_by: userId };
      
      const { data, error } = await supabase.from('groomings').update(snakeData).eq('id', grooming.id).eq('workspace_id', this.getWorkspaceId()).select().single();
      if (error) throw error;
      return toCamel(data) as Grooming;
    } else {
      const snakeData = toSnake({ ...grooming, createdBy: userId });
      snakeData.workspace_id = this.getWorkspaceId();
      
      const { data, error } = await supabase.from('groomings').insert(snakeData).select().single();
      if (error) throw error;
      return toCamel(data) as Grooming;
    }
  }

  async deleteGrooming(id: string): Promise<void> {
    const { error } = await supabase.from('groomings').delete().eq('id', id).eq('workspace_id', this.getWorkspaceId());
    if (error) throw error;
  }

  // WEIGHT RECORDS
  async getWeightRecordsByPatient(patientId: string): Promise<WeightRecord[]> {
    const { data, error } = await supabase.from('weight_records').select('*').eq('patient_id', patientId).eq('workspace_id', this.getWorkspaceId()).order('date', { ascending: false });
    if (error) throw error;
    return toCamel(data) as WeightRecord[];
  }

  async saveWeightRecord(record: Omit<WeightRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }): Promise<WeightRecord> {
    const userId = await this.getUserId();
    
    if (record.id) {
      const { workspace_id: _, ...updates } = toSnake(record);
      const snakeData = { ...updates, created_by: userId };

      const { data, error } = await supabase.from('weight_records').update(snakeData).eq('id', record.id).eq('workspace_id', this.getWorkspaceId()).select().single();
      if (error) throw error;
      return toCamel(data) as WeightRecord;
    
    } else {
      const snakeData = toSnake({ ...record, createdBy: userId });
      snakeData.workspace_id = this.getWorkspaceId();

      const { data, error } = await supabase.from('weight_records').insert(snakeData).select().single();
      if (error) throw error;
      return toCamel(data) as WeightRecord;
    
    }
  }

  async deleteWeightRecord(id: string): Promise<void> {
    const { error } = await supabase.from('weight_records').delete().eq('id', id).eq('workspace_id', this.getWorkspaceId());
    if (error) throw error;
  }
}
