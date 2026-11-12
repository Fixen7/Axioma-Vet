import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { buildInsertPayload, buildUpdatePayload } from '../src/services/SupabaseDataService';
import { ActivityTimeline } from '../src/components/patient/ActivityTimeline';

const mockGetConsultations = vi.fn();
const mockGetPrescriptions = vi.fn();
const mockGetVaccines = vi.fn();
const mockGetLabs = vi.fn();
const mockGetSurgeries = vi.fn();
const mockGetGroomings = vi.fn();

const MEMBERS = [
  { id: 'user-alice', name: 'Dra. Alice', email: 'alice@vet.com', role: 'owner' },
  { id: 'user-bob', name: 'Dr. Bob', email: 'bob@vet.com', role: 'member' },
];

const PATIENTS = [
  {
    id: 'pat-1',
    name: 'Rocky',
    species: 'Perro',
    gender: 'M',
    birthDate: '2021-03-01',
    ownerName: 'Carlos',
    ownerPhone: '099111222',
    status: 'NORMAL',
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
    createdBy: 'user-alice',
    updatedBy: 'user-alice',
  },
];

const RESOLVE_LABEL = (userId?: string | null) => {
  if (!userId) return '';
  const found = MEMBERS.find((m) => m.id === userId);
  return found ? found.name || found.email : userId;
};

vi.mock('../src/context/VetContext', () => ({
  useVetContext: () => ({
    patients: PATIENTS,
    workspaceMembers: MEMBERS,
    resolveMemberLabel: RESOLVE_LABEL,
    getConsultations: mockGetConsultations,
    getPrescriptions: mockGetPrescriptions,
    getVaccines: mockGetVaccines,
    getLabs: mockGetLabs,
    getSurgeries: mockGetSurgeries,
    getGroomings: mockGetGroomings,
  }),
}));

describe('Team Attribution & Individual Activity in Axioma-Vet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('axioma-vet-lang-pref', 'es');
  });

  it('buildInsertPayload stamps created_by, updated_by, and workspace_id', () => {
    const payload = buildInsertPayload(
      { patientId: 'pat-1', reason: 'Consulta', diagnosis: 'Sano' },
      'user-alice',
      'ws-1'
    );
    expect(payload.created_by).toBe('user-alice');
    expect(payload.updated_by).toBe('user-alice');
    expect(payload.workspace_id).toBe('ws-1');
  });

  it('buildUpdatePayload preserves created_by by stripping immutable fields and stamping updated_by', () => {
    const payload = buildUpdatePayload(
      {
        id: 'cons-1',
        workspaceId: 'ws-tamper',
        createdBy: 'user-alice',
        createdAt: '2026-11-01T10:00:00Z',
        diagnosis: 'Otitis leve',
      },
      'user-bob'
    );
    expect(payload.created_by).toBeUndefined();
    expect(payload.created_at).toBeUndefined();
    expect(payload.workspace_id).toBeUndefined();
    expect(payload.id).toBeUndefined();
    expect(payload.updated_by).toBe('user-bob');
    expect(payload.diagnosis).toBe('Otitis leve');
  });

  it('ActivityTimeline shows creator & editor attribution and filters by member', async () => {
    mockGetConsultations.mockResolvedValue([
      {
        id: 'cons-1',
        patientId: 'pat-1',
        reason: 'Control',
        observation: 'Estable',
        diagnosis: 'Buen estado',
        treatment: 'Ninguno',
        createdAt: '2026-11-05T12:00:00Z',
        updatedAt: '2026-11-06T09:00:00Z',
        createdBy: 'user-bob',
        updatedBy: 'user-alice',
      },
    ]);
    mockGetPrescriptions.mockResolvedValue([]);
    mockGetVaccines.mockResolvedValue([
      {
        id: 'vac-1',
        patientId: 'pat-1',
        vaccineName: 'Rabia',
        applicationDate: '2026-11-02',
        observations: 'Sin novedad',
        createdAt: '2026-11-02T11:00:00Z',
        updatedAt: '2026-11-02T11:00:00Z',
        createdBy: 'user-bob',
        updatedBy: 'user-bob',
      },
    ]);
    mockGetLabs.mockResolvedValue([]);
    mockGetSurgeries.mockResolvedValue([]);
    mockGetGroomings.mockResolvedValue([]);

    render(<ActivityTimeline patientId="pat-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Consulta: Control/)).toBeTruthy();
    });

    expect(screen.getAllByText(/Registrado por: Dr. Bob/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Editado por: Dra. Alice/)).toBeTruthy();
    expect(screen.getByText(/Registrado por: Dra. Alice/)).toBeTruthy();

    const filter = screen.getByLabelText(/Miembro:/);
    fireEvent.change(filter, { target: { value: 'user-bob' } });

    expect(screen.getByText(/Vacuna: Rabia/)).toBeTruthy();
    expect(screen.queryByText(/Primer Registro/)).toBeNull();
  });
});
