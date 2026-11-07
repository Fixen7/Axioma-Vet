export interface FormDraft<T> {
  data: T;
  savedAt: string; // ISO date string
  patientId?: string;
}

const STORAGE_PREFIX = 'axioma_vet_draft_';

export function getDraftStorageKey(formType: string, id: string): string {
  return `${STORAGE_PREFIX}${formType}_${id}`;
}

export function saveFormDraft<T>(key: string, data: T, patientId?: string): boolean {
  if (typeof window === 'undefined' || !window.sessionStorage) return false;
  try {
    const draft: FormDraft<T> = {
      data,
      savedAt: new Date().toISOString(),
      patientId
    };
    sessionStorage.setItem(key, JSON.stringify(draft));
    return true;
  } catch (error) {
    console.warn('[DraftStorage] No se pudo guardar el borrador:', error);
    return false;
  }
}

export function loadFormDraft<T>(key: string): FormDraft<T> | null {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as FormDraft<T>;
  } catch (error) {
    console.warn('[DraftStorage] Error al leer borrador:', error);
    return null;
  }
}

export function removeFormDraft(key: string): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.warn('[DraftStorage] Error al eliminar borrador:', error);
  }
}
