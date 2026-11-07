import { useState, useEffect, useCallback, useRef } from 'react';
import { saveFormDraft, loadFormDraft, removeFormDraft, type FormDraft } from '../utils/formDraftStorage';

interface UseDraftAutosaveOptions<T> {
  key: string;
  data: T;
  enabled: boolean;
  patientId?: string;
  debounceMs?: number;
  isDataEmpty?: (data: T) => boolean;
}

export function useDraftAutosave<T>({
  key,
  data,
  enabled,
  patientId,
  debounceMs = 800,
  isDataEmpty,
}: UseDraftAutosaveOptions<T>) {
  const [pendingDraft, setPendingDraft] = useState<FormDraft<T> | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Verificar si ya existe un borrador al montar o cambiar de paciente/formulario
  useEffect(() => {
    if (!key) return;
    const existing = loadFormDraft<T>(key);
    if (existing) {
      setPendingDraft(existing);
    } else {
      setPendingDraft(null);
    }
  }, [key]);

  // Autoguardado con debounce cuando cambian los datos y enabled es true
  useEffect(() => {
    if (!enabled || !key) return;

    if (isDataEmpty && isDataEmpty(data)) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const ok = saveFormDraft(key, data, patientId);
      if (ok) {
        setLastSavedAt(new Date());
        setPendingDraft(null);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, enabled, key, patientId, debounceMs, isDataEmpty]);

  const discardDraft = useCallback(() => {
    removeFormDraft(key);
    setPendingDraft(null);
    setLastSavedAt(null);
  }, [key]);

  const clearDraft = useCallback(() => {
    removeFormDraft(key);
    setPendingDraft(null);
    setLastSavedAt(null);
  }, [key]);

  return {
    pendingDraft,
    lastSavedAt,
    discardDraft,
    clearDraft,
  };
}
