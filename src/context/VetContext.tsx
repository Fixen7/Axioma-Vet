import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { SupabaseDataService } from '../services/SupabaseDataService';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import type { Patient, Consultation, Prescription, Vaccine, LabResult, Surgery, PatientStatus, GlobalSettings, Grooming, WeightRecord } from '../services/types';

const dataService = new SupabaseDataService();

interface VetContextType {
  patients: Patient[];
  settings: GlobalSettings | null;
  loadPatients: () => Promise<void>;
  savePatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }) => Promise<Patient>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<Patient>;
  updatePatientStatus: (id: string, status: PatientStatus, behavior?: string, deceasedDate?: string, deceasedReason?: string) => Promise<Patient>;
  deletePatient: (id: string) => Promise<void>;
  saveSettings: (settings: GlobalSettings) => Promise<void>;
  isLoadingSettings: boolean;
  
  // Data fetchers for a single patient's records
  getConsultations: (patientId: string) => Promise<Consultation[]>;
  getAllConsultations: () => Promise<Consultation[]>;
  saveConsultation: (consultation: Omit<Consultation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }) => Promise<Consultation>;
  deleteConsultation: (id: string) => Promise<void>;
  
  getPrescriptions: (patientId: string) => Promise<Prescription[]>;
  savePrescription: (prescription: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }) => Promise<Prescription>;
  deletePrescription: (id: string) => Promise<void>;
  
  getVaccines: (patientId: string) => Promise<Vaccine[]>;
  getAllVaccines: () => Promise<Vaccine[]>;
  saveVaccine: (vaccine: Omit<Vaccine, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }) => Promise<Vaccine>;
  deleteVaccine: (id: string) => Promise<void>;
  
  getLabs: (patientId: string) => Promise<LabResult[]>;
  saveLab: (lab: Omit<LabResult, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }) => Promise<LabResult>;
  deleteLab: (id: string) => Promise<void>;
  
  getSurgeries: (patientId: string) => Promise<Surgery[]>;
  getAllSurgeries: () => Promise<Surgery[]>;
  saveSurgery: (surgery: Omit<Surgery, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }) => Promise<Surgery>;
  deleteSurgery: (id: string) => Promise<void>;
  
  getGroomings: (patientId: string) => Promise<Grooming[]>;
  saveGrooming: (grooming: Omit<Grooming, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }) => Promise<Grooming>;
  deleteGrooming: (id: string) => Promise<void>;
  
  getWeightRecords: (patientId: string) => Promise<WeightRecord[]>;
  saveWeightRecord: (record: Omit<WeightRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }) => Promise<WeightRecord>;
  deleteWeightRecord: (id: string) => Promise<void>;
}

const VetContext = createContext<VetContextType | undefined>(undefined);

export const VetProvider = ({ children }: { children: ReactNode }) => {
  const { user, activeWorkspaceId, coreUser, activeWorkspace } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const checkAuthError = async (e: any) => {
    // If it's an auth or network error that implies token issues
    if (e?.code === 'PGRST301' || e?.message?.toLowerCase().includes('jwt') || e?.status === 401 || String(e?.code).startsWith('40')) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Failed to sign out gracefully, clearing local session forcefully", error);
      }
      // Unconditionally clear all local storage to destroy the session if network fails
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  const loadPatients = async () => {
    if (!user) return;
    try {
      const data = await dataService.getPatients();
      setPatients(data);
    } catch (e: any) {
      console.error("Error loading patients:", e);
      checkAuthError(e);
    }
  };

  const loadSettings = async () => {
    if (!user) return;
    setIsLoadingSettings(true);
    try {
      const data = await dataService.getSettings();
      setSettings(data);
    } catch (e: any) {
      console.error("Error loading settings:", e);
      checkAuthError(e);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  useEffect(() => {
    if (user && activeWorkspaceId) {
      dataService.setWorkspaceId(activeWorkspaceId);
      loadPatients();
      loadSettings();
    } else {
      setPatients([]);
      setSettings(null);
    }
  }, [user, activeWorkspaceId]);

  const savePatient = async (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { id?: string }) => {
    const saved = await dataService.savePatient(patient);
    await loadPatients(); // Refresh list
    return saved;
  };

  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    const updated = await dataService.updatePatient(id, updates);
    await loadPatients();
    return updated;
  };

  const updatePatientStatus = async (id: string, status: PatientStatus, behavior?: string, deceasedDate?: string, deceasedReason?: string) => {
    const saved = await dataService.updatePatientStatus(id, status, behavior, deceasedDate, deceasedReason);
    await loadPatients();
    return saved;
  };

  const deletePatient = async (id: string) => {
    await dataService.deletePatient(id);
    await loadPatients();
  };

  const saveSettingsToService = async (newSettings: GlobalSettings) => {
    // Ya no guardamos clinicName ni doctorName en local,
    // pero si hubiera más configuraciones en el futuro, se guardarían aquí.
    await dataService.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const effectiveSettings = {
    ...settings,
    clinicName: activeWorkspace?.name || settings?.clinicName || '',
    doctorName: coreUser?.name || settings?.doctorName || ''
  };

  const getConsultations = useCallback((id: string) => dataService.getConsultationsByPatient(id), []);
  const getAllConsultations = useCallback(() => dataService.getAllConsultations(), []);
  const saveConsultation = async (c: any) => dataService.saveConsultation(c);
  const deleteConsultation = async (id: string) => dataService.deleteConsultation(id);

  const getPrescriptions = useCallback((id: string) => dataService.getPrescriptionsByPatient(id), []);
  const savePrescription = async (p: any) => dataService.savePrescription(p);
  const deletePrescription = async (id: string) => dataService.deletePrescription(id);

  const getVaccines = useCallback((id: string) => dataService.getVaccinesByPatient(id), []);
  const getAllVaccines = useCallback(() => dataService.getAllVaccines(), []);
  const saveVaccine = async (v: any) => dataService.saveVaccine(v);
  const deleteVaccine = async (id: string) => dataService.deleteVaccine(id);

  const getLabs = useCallback((id: string) => dataService.getLabsByPatient(id), []);
  const saveLab = async (l: any) => dataService.saveLab(l);
  const deleteLab = async (id: string) => dataService.deleteLab(id);

  const getSurgeries = useCallback((id: string) => dataService.getSurgeriesByPatient(id), []);
  const getAllSurgeries = useCallback(() => dataService.getAllSurgeries(), []);
  const saveSurgery = async (s: any) => dataService.saveSurgery(s);
  const deleteSurgery = async (id: string) => dataService.deleteSurgery(id);

  const getGroomings = useCallback((id: string) => dataService.getGroomingsByPatient(id), []);
  const saveGrooming = async (g: any) => dataService.saveGrooming(g);
  const deleteGrooming = async (id: string) => dataService.deleteGrooming(id);

  const getWeightRecords = useCallback((id: string) => dataService.getWeightRecordsByPatient(id), []);
  const saveWeightRecord = async (w: any) => dataService.saveWeightRecord(w);
  const deleteWeightRecord = async (id: string) => dataService.deleteWeightRecord(id);

  return (
    <VetContext.Provider value={{
      patients,
      settings: effectiveSettings as GlobalSettings,
      loadPatients,
      savePatient,
      updatePatient,
      updatePatientStatus,
      deletePatient,
      saveSettings: saveSettingsToService,
      isLoadingSettings,
      getConsultations, getAllConsultations, saveConsultation, deleteConsultation,
      getPrescriptions, savePrescription, deletePrescription,
      getVaccines, getAllVaccines, saveVaccine, deleteVaccine,
      getLabs, saveLab, deleteLab,
      getSurgeries, getAllSurgeries, saveSurgery, deleteSurgery,
      getGroomings, saveGrooming, deleteGrooming,
      getWeightRecords, saveWeightRecord, deleteWeightRecord,
    }}>
      {children}
    </VetContext.Provider>
  );
};

export const useVetContext = () => {
  const context = useContext(VetContext);
  if (context === undefined) {
    throw new Error('useVetContext must be used within a VetProvider');
  }
  return context;
};
