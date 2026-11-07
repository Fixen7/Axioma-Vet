import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDraftAutosave } from '../src/hooks/useDraftAutosave';
import { saveFormDraft } from '../src/utils/formDraftStorage';

describe('useDraftAutosave hook', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe detectar un borrador previo al inicializar', () => {
    const key = 'axioma_vet_draft_test_1';
    saveFormDraft(key, { note: 'Borrador existente' }, 'pat_1');

    const { result } = renderHook(() =>
      useDraftAutosave({
        key,
        data: { note: '' },
        enabled: false,
      })
    );

    expect(result.current.pendingDraft).not.toBeNull();
    expect(result.current.pendingDraft?.data.note).toBe('Borrador existente');
  });

  it('debe autoguardar con debounce cuando enabled es true y los datos cambian', () => {
    const key = 'axioma_vet_draft_test_2';

    let currentData = { note: 'Primera línea' };
    const { result, rerender } = renderHook(
      ({ data, enabled }) =>
        useDraftAutosave({
          key,
          data,
          enabled,
          debounceMs: 500,
        }),
      { initialProps: { data: currentData, enabled: true } }
    );

    // Antes del debounce no debe haberse guardado aún
    expect(result.current.lastSavedAt).toBeNull();

    // Avanzamos el reloj de timers
    act(() => {
      vi.advanceTimersByTime(550);
    });

    expect(result.current.lastSavedAt).not.toBeNull();

    // Actualizamos datos
    currentData = { note: 'Segunda línea agregada' };
    rerender({ data: currentData, enabled: true });

    act(() => {
      vi.advanceTimersByTime(550);
    });

    expect(result.current.lastSavedAt).toBeInstanceOf(Date);
  });

  it('debe permitir descartar el borrador', () => {
    const key = 'axioma_vet_draft_test_3';
    saveFormDraft(key, { note: 'Para descartar' });

    const { result } = renderHook(() =>
      useDraftAutosave({
        key,
        data: { note: '' },
        enabled: false,
      })
    );

    expect(result.current.pendingDraft).not.toBeNull();

    act(() => {
      result.current.discardDraft();
    });

    expect(result.current.pendingDraft).toBeNull();
  });
});
