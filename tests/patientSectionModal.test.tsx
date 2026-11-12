import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { PatientSectionModal } from '../src/components/patient/PatientSectionModal';
import PatientRecord from '../src/pages/PatientRecord';

vi.mock('../src/components/layout/TopAppBar', () => ({
  TopAppBar: ({ title }: { title: string }) => <div data-testid="topbar">{title}</div>,
}));

vi.mock('../src/components/patient/AnatomicalBodyMap', () => ({
  AnatomicalBodyMap: () => <div data-testid="anatomy-map">BodyMap</div>,
}));

vi.mock('../src/components/patient/ClinicalMemoryCard', () => ({
  ClinicalMemoryCard: () => <div data-testid="clinical-memory">MemoryCard</div>,
}));

vi.mock('../src/components/patient/ActivityTimeline', () => ({
  ActivityTimeline: () => <div data-testid="tab-activity-content">Activity Content</div>,
}));

vi.mock('../src/components/patient/ClinicalHistoryTab', () => ({
  ClinicalHistoryTab: () => <div data-testid="tab-history-content">History Content</div>,
}));

vi.mock('../src/components/patient/VaccinesTab', () => ({
  VaccinesTab: () => <div data-testid="tab-vaccines-content">Vaccines Content</div>,
}));

vi.mock('../src/components/patient/SurgeriesTab', () => ({
  SurgeriesTab: () => <div data-testid="tab-surgeries-content">Surgeries Content</div>,
}));

vi.mock('../src/components/patient/LabResultsTab', () => ({
  LabResultsTab: () => <div data-testid="tab-labs-content">Labs Content</div>,
}));

vi.mock('../src/components/patient/PrescriptionsTab', () => ({
  PrescriptionsTab: () => <div data-testid="tab-prescriptions-content">Prescriptions Content</div>,
}));

vi.mock('../src/components/patient/GroomingTab', () => ({
  GroomingTab: () => <div data-testid="tab-grooming-content">Grooming Content</div>,
}));

vi.mock('../src/context/VetContext', () => ({
  useVetContext: () => ({
    patients: [
      {
        id: 'pat-1',
        name: 'Luna',
        species: 'Perro',
        breed: 'Mestizo',
        status: 'NORMAL',
        weight: '12',
        birthDate: '2022-01-01',
        ownerName: 'Ana',
        ownerPhone: '0999999999',
        isSterilized: true,
        behaviorObservation: '',
      },
    ],
    updatePatientStatus: vi.fn(),
    deletePatient: vi.fn(),
    getConsultations: vi.fn().mockResolvedValue([]),
    getPrescriptions: vi.fn().mockResolvedValue([]),
    getWeightRecords: vi.fn().mockResolvedValue([]),
    getSurgeries: vi.fn().mockResolvedValue([]),
    updatePatient: vi.fn(),
    saveWeightRecord: vi.fn(),
  }),
}));

describe('PatientSectionModal & PatientRecord popups', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('axioma-vet-lang-pref', 'es');
    document.body.style.overflow = '';
  });

  it('PatientSectionModal abre, bloquea scroll, y cierra con Escape o botón X', () => {
    const onClose = vi.fn();
    render(
      <PatientSectionModal
        isOpen={true}
        title="Actividad"
        subtitle="Luna · Perro"
        icon={Activity}
        onClose={onClose}
        closeLabel="Cerrar ventana"
      >
        <div>Contenido modal</div>
      </PatientSectionModal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText('Cerrar ventana'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('PatientRecord inicia sin ninguna pestaña seleccionada y abre cada módulo en pop-up al hacer clic', () => {
    render(
      <MemoryRouter initialEntries={['/patient/pat-1']}>
        <Routes>
          <Route path="/patient/:id" element={<PatientRecord />} />
        </Routes>
      </MemoryRouter>
    );

    // Ningún contenido debe abrirse abajo por defecto
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tab-activity-content')).not.toBeInTheDocument();

    const activityBtn = screen.getByRole('button', { name: 'Actividad' });
    expect(activityBtn).toHaveAttribute('aria-expanded', 'false');

    // Al hacer clic abre el pop-up correspondiente
    fireEvent.click(activityBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('tab-activity-content')).toBeInTheDocument();
    expect(activityBtn).toHaveAttribute('aria-expanded', 'true');

    // Al cerrar regresa sin botón seleccionado
    fireEvent.click(screen.getByLabelText('Cerrar ventana'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(activityBtn).toHaveAttribute('aria-expanded', 'false');

    // Abrir otro módulo (Vacunas)
    const vaccinesBtn = screen.getByRole('button', { name: 'Vacunas' });
    fireEvent.click(vaccinesBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('tab-vaccines-content')).toBeInTheDocument();
  });
});
