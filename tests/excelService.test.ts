import { describe, it, expect, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { 
  exportFullBackupToExcel, 
  exportPatientsListToExcel, 
  downloadMigrationTemplate, 
  parseAndValidateMigrationFile 
} from '../src/utils/excelService';
import type { Patient, Consultation } from '../src/services/types';

vi.mock('xlsx', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    writeFile: vi.fn(),
  };
});

describe('excelService - Export and Migration Utilities', () => {
  it('exportPatientsListToExcel creates a valid workbook and calls XLSX.writeFile', () => {
    const mockPatients: Patient[] = [
      {
        id: 'pat-1',
        name: 'Firulais',
        species: 'Perro',
        breed: 'Labrador',
        gender: 'M',
        birthDate: '2021-05-10',
        weight: '25 kg',
        ownerName: 'Juan Pérez',
        ownerPhone: '0991234567',
        status: 'NORMAL',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'user-1',
      }
    ];

    const filename = exportPatientsListToExcel(mockPatients, 'ClinicaTest');
    expect(filename).toContain('Pacientes_ClinicaTest_');
    expect(XLSX.writeFile).toHaveBeenCalled();
  });

  it('exportFullBackupToExcel creates multi-sheet workbook with all clinical data', async () => {
    const mockPatients: Patient[] = [
      {
        id: 'pat-1',
        name: 'Michi',
        species: 'Gato',
        gender: 'F',
        birthDate: '2022-03-01',
        ownerName: 'Ana',
        ownerPhone: '0987654321',
        status: 'NORMAL',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'user-1',
      }
    ];

    const mockConsultations: Consultation[] = [
      {
        id: 'c-1',
        patientId: 'pat-1',
        reason: 'Consulta',
        observation: 'Todo bien',
        diagnosis: 'Sano',
        treatment: 'Vitaminas',
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-02-01T00:00:00Z',
        createdBy: 'user-1',
      }
    ];

    const filename = await exportFullBackupToExcel({
      clinicName: 'Veterinaria Sur',
      patients: mockPatients,
      consultations: mockConsultations,
      prescriptions: [],
      vaccines: [],
      surgeries: [],
      labs: [],
      groomings: [],
      weights: [],
    });

    expect(filename).toContain('Respaldo_Completo_Veterinaria_Sur_');
    expect(XLSX.writeFile).toHaveBeenCalled();
  });

  it('downloadMigrationTemplate generates template with instructions and sample rows', () => {
    downloadMigrationTemplate();
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'Plantilla_Migracion_AxiomaVet.xlsx');
  });

  it('parseAndValidateMigrationFile correctly parses valid rows and flags incongruent rows', async () => {
    // Construct an in-memory workbook with both valid and invalid rows
    const wb = XLSX.utils.book_new();
    const sheetData = [
      {
        'Nombre Mascota': 'Thor',
        'Especie': 'Perro',
        'Raza': 'Husky',
        'Sexo': 'Macho',
        'Fecha Nacimiento': '2020-08-12',
        'Tutor': 'Mario Bros',
        'Teléfono': '0990001111',
      },
      {
        'Nombre Mascota': 'Princesa',
        'Especie': 'Gata',
        'Raza': '',
        'Sexo': 'Hembra',
        'Fecha Nacimiento': '15/04/2021',
        'Tutor': '', // Missing owner, will get warning
        'Teléfono': '',
      },
      {
        'Nombre Mascota': '', // Missing name, will be marked incongruent / skipped
        'Especie': 'Perro',
        'Tutor': 'Fantasma',
        'Teléfono': '0999999999',
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');

    const u8 = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const mockFile = new File([u8], 'test_migracion.xlsx', { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });

    const result = await parseAndValidateMigrationFile(mockFile);

    expect(result.totalRows).toBe(3);
    expect(result.readyCount).toBe(2);
    expect(result.skippedCount).toBe(1);

    // First row checks
    const row1 = result.validRows[0];
    expect(row1.data.name).toBe('Thor');
    expect(row1.data.species).toBe('Perro');
    expect(row1.data.gender).toBe('M');
    expect(row1.data.ownerName).toBe('Mario Bros');
    expect(row1.data.ownerPhone).toBe('0990001111');
    expect(row1.data.birthDate).toBe('2020-08-12');

    // Second row checks (warnings for owner defaults)
    const row2 = result.validRows[1];
    expect(row2.data.name).toBe('Princesa');
    expect(row2.data.species).toBe('Gata');
    expect(row2.data.gender).toBe('F');
    expect(row2.data.birthDate).toBe('2021-04-15');
    expect(row2.data.ownerName).toBe('Tutor por asignar');
    expect(row2.data.ownerPhone).toBe('Sin teléfono');
    expect(row2.warnings.length).toBeGreaterThanOrEqual(1);

    // Incongruent row check (missing pet name)
    expect(result.incongruentRows[0].reason).toContain('Nombre de mascota ausente');
  });
});
