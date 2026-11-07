import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  saveFormDraft, 
  loadFormDraft, 
  removeFormDraft, 
  getDraftStorageKey 
} from '../src/utils/formDraftStorage';

describe('formDraftStorage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('debe generar una clave de almacenamiento estructurada', () => {
    const key = getDraftStorageKey('consultation', 'pat_123');
    expect(key).toBe('axioma_vet_draft_consultation_pat_123');
  });

  it('debe guardar y recuperar un borrador en sessionStorage', () => {
    const key = getDraftStorageKey('consultation', 'pat_123');
    const mockData = {
      formData: {
        reason: 'Consulta',
        observation: 'Canino con dolor abdominal leve',
        diagnosis: 'Gastroenteritis',
        treatment: 'Suero + Probióticos',
        nextControl: '2026-11-15'
      },
      draftAnatomyPoints: [{ x: 50, y: 60, quadrant: 'abdominal', title: 'Dolor palpación' }]
    };

    const saved = saveFormDraft(key, mockData, 'pat_123');
    expect(saved).toBe(true);

    const loaded = loadFormDraft<typeof mockData>(key);
    expect(loaded).not.toBeNull();
    expect(loaded?.patientId).toBe('pat_123');
    expect(loaded?.data.formData.observation).toBe('Canino con dolor abdominal leve');
    expect(loaded?.data.draftAnatomyPoints).toHaveLength(1);
    expect(loaded?.savedAt).toBeDefined();
  });

  it('debe eliminar el borrador de sessionStorage', () => {
    const key = getDraftStorageKey('surgery', 'pat_456');
    saveFormDraft(key, { procedure: 'Esterilización' }, 'pat_456');

    expect(loadFormDraft(key)).not.toBeNull();

    removeFormDraft(key);
    expect(loadFormDraft(key)).toBeNull();
  });

  it('debe manejar adecuadamente si sessionStorage está vacío o dañado', () => {
    const key = getDraftStorageKey('consultation', 'inexistente');
    expect(loadFormDraft(key)).toBeNull();

    sessionStorage.setItem(key, '{json corrupto...');
    expect(loadFormDraft(key)).toBeNull();
  });
});
