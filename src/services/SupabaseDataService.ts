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

/**
 * Strips immutable attribution/identity columns on update so original created_by is preserved
 * and only updated_by reflects the current actor.
 */
export function buildUpdatePayload<T extends Record<string, any>>(entity: T, userId: string): Record<string, any> {
  const { workspace_id: _ws, created_by: _cb, created_at: _ca, id: _id, ...updates } = toSnake(entity);
  return { ...updates, updated_by: userId };
}

/**
 * Stamps created_by, updated_by, and workspace_id on newly inserted clinical records.
 */
export function buildInsertPayload<T extends Record<string, any>>(
  entity: T,
  userId: string,
  workspaceId: string
): Record<string, any> {
  const snake = toSnake({ ...entity, createdBy: userId, updatedBy: userId });
  snake.workspace_id = workspaceId;
  return snake;
}

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

  private async upsertScopedEntity<T>(table: string, entity: Record<string, any> & { id?: string }): Promise<T> {
    const userId = await this.getUserId();
    const wsId = this.getWorkspaceId();
    if (entity.id) {
      const snakeData = buildUpdatePayload(entity, userId);
      const { data, error } = await supabase
        .from(table)
        .update(snakeData)
        .eq('id', entity.id)
        .eq('workspace_id', wsId)
        .select()
        .single();
      if (error) throw error;
      return toCamel(data) as T;
    }

    const snakeData = buildInsertPayload(entity, userId, wsId);
    const { data, error } = await supabase.from(table).insert(snakeData).select().single();
    if (error) throw error;
    return toCamel(data) as T;
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
    return this.upsertScopedEntity<Patient>('patients', patient);
  }

  async updatePatient(patientId: string, updates: Partial<Patient>): Promise<Patient> {
    const userId = await this.getUserId();
    const snakeData = buildUpdatePayload(updates, userId);
    const { data, error } = await supabase
      .from('patients')
      .update(snakeData)
      .eq('id', patientId)
      .eq('workspace_id', this.getWorkspaceId())
      .select()
      .single();
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
    return this.upsertScopedEntity<Consultation>('consultations', consultation);
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
    return this.upsertScopedEntity<Prescription>('prescriptions', prescription);
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
    return this.upsertScopedEntity<Vaccine>('vaccines', vaccine);
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
    return this.upsertScopedEntity<LabResult>('lab_results', lab);
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
    return this.upsertScopedEntity<Surgery>('surgeries', surgery);
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
    const wsId = this.getWorkspaceId();
    const { data: existing } = await supabase.from('global_settings').select('id').eq('workspace_id', wsId).maybeSingle();
    
    if (existing) {
      const snakeData = buildUpdatePayload(settings, userId);
      const { error } = await supabase.from('global_settings').update(snakeData).eq('id', existing.id).eq('workspace_id', wsId);
      if (error) throw error;
    } else {
      const insertData = buildInsertPayload(settings, userId, wsId);
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
    const snakeData = buildInsertPayload(event, userId, this.getWorkspaceId());
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
    return this.upsertScopedEntity<Grooming>('groomings', grooming);
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
    return this.upsertScopedEntity<WeightRecord>('weight_records', record);
  }

  async deleteWeightRecord(id: string): Promise<void> {
    const { error } = await supabase.from('weight_records').delete().eq('id', id).eq('workspace_id', this.getWorkspaceId());
    if (error) throw error;
  }
}
