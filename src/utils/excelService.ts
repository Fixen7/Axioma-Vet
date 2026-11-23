import * as XLSX from 'xlsx';
import type { 
  Patient, 
  Consultation, 
  Prescription, 
  Vaccine, 
  Surgery, 
  LabResult, 
  Grooming, 
  WeightRecord 
} from '../services/types';

/**
 * Utility to calculate column width based on content length
 */
function getColWidths(data: Record<string, any>[]): { wch: number }[] {
  if (!data || data.length === 0) return [];
  const keys = Object.keys(data[0]);
  return keys.map(key => {
    let maxLen = key.length;
    for (const row of data) {
      const val = row[key];
      if (val !== undefined && val !== null) {
        const strLen = String(val).length;
        if (strLen > maxLen) maxLen = strLen;
      }
    }
    return { wch: Math.min(Math.max(maxLen + 3, 12), 50) };
  });
}

/**
 * EXPORT 1: Full Backup of Clinic Data into structured multi-sheet XLSX
 */
export async function exportFullBackupToExcel(params: {
  clinicName?: string;
  patients: Patient[];
  consultations: Consultation[];
  prescriptions: Prescription[];
  vaccines: Vaccine[];
  surgeries: Surgery[];
  labs: LabResult[];
  groomings: Grooming[];
  weights: WeightRecord[];
}): Promise<string> {
  const {
    clinicName = 'AxiomaVet',
    patients,
    consultations,
    prescriptions,
    vaccines,
    surgeries,
    labs,
    groomings,
    weights,
  } = params;

  const wb = XLSX.utils.book_new();

  // Create a patient lookup map for adding patient names to related clinical sheets
  const patientMap = new Map<string, string>();
  patients.forEach(p => {
    patientMap.set(p.id, `${p.name} (${p.ownerName})`);
  });

  // 1. Hoja Pacientes
  const patientsRows = patients.map(p => ({
    'ID Paciente': p.id,
    'Nombre Mascota': p.name,
    'Especie': p.species,
    'Raza': p.breed || 'Mestizo / No especificada',
    'Sexo': p.gender === 'M' ? 'Macho' : p.gender === 'F' ? 'Hembra' : 'Indeterminado',
    'Fecha Nacimiento': p.birthDate || '',
    'Peso Actual': p.weight || '',
    'Nombre Tutor / Dueño': p.ownerName,
    'Teléfono Tutor': p.ownerPhone,
    'Email Tutor': p.ownerEmail || '',
    'Cédula / ID Tutor': p.ownerId || '',
    'Color': p.color || '',
    'Esterilizado': p.isSterilized ? 'Sí' : 'No',
    'Estado Clínico': p.status,
    'Observación Conducta': p.behaviorObservation || '',
    'Fecha Fallecimiento': p.deceasedDate || '',
    'Motivo Fallecimiento': p.deceasedReason || '',
    'Fecha Registro': p.createdAt ? p.createdAt.split('T')[0] : '',
  }));
  const wsPatients = XLSX.utils.json_to_sheet(patientsRows);
  wsPatients['!cols'] = getColWidths(patientsRows);
  XLSX.utils.book_append_sheet(wb, wsPatients, 'Pacientes');

  // 2. Hoja Consultas
  const consultationsRows = consultations.map(c => ({
    'ID Consulta': c.id,
    'Paciente': patientMap.get(c.patientId) || c.patientId,
    'Fecha Consulta': c.createdAt ? c.createdAt.split('T')[0] : '',
    'Motivo': c.reason,
    'Diagnóstico': c.diagnosis || '',
    'Tratamiento': c.treatment || '',
    'Observaciones': c.observation || '',
    'Próximo Control': c.nextControl || '',
  }));
  const wsConsultations = XLSX.utils.json_to_sheet(consultationsRows);
  wsConsultations['!cols'] = getColWidths(consultationsRows);
  XLSX.utils.book_append_sheet(wb, wsConsultations, 'Consultas');

  // 3. Hoja Recetas Médicas
  const prescriptionsRows = prescriptions.map(p => ({
    'ID Receta': p.id,
    'Paciente': patientMap.get(p.patientId) || p.patientId,
    'Fecha Emisión': p.date ? p.date.split('T')[0] : '',
    'Médico Veterinario': p.veterinarian,
    'Medicamento(s)': p.medication,
    'Presentación': p.presentation || '',
    'Dosis': p.dosage,
    'Frecuencia': p.frequency || '',
    'Duración': p.duration || '',
    'Indicaciones': p.indications || '',
  }));
  const wsPrescriptions = XLSX.utils.json_to_sheet(prescriptionsRows);
  wsPrescriptions['!cols'] = getColWidths(prescriptionsRows);
  XLSX.utils.book_append_sheet(wb, wsPrescriptions, 'Recetas Médicas');

  // 4. Hoja Vacunas
  const vaccinesRows = vaccines.map(v => ({
    'ID Vacuna': v.id,
    'Paciente': patientMap.get(v.patientId) || v.patientId,
    'Fecha Aplicación': v.applicationDate,
    'Nombre Vacuna': v.vaccineName,
    'Lote': v.batch || '',
    'Fabricante': v.manufacturer || '',
    'Próxima Dosis': v.nextDose || '',
    'Observaciones': v.observations || '',
  }));
  const wsVaccines = XLSX.utils.json_to_sheet(vaccinesRows);
  wsVaccines['!cols'] = getColWidths(vaccinesRows);
  XLSX.utils.book_append_sheet(wb, wsVaccines, 'Vacunas');

  // 5. Hoja Cirugías
  const surgeriesRows = surgeries.map(s => ({
    'ID Cirugía': s.id,
    'Paciente': patientMap.get(s.patientId) || s.patientId,
    'Fecha Procedimiento': s.date,
    'Procedimiento': s.procedure,
    'Cirujano / Veterinario': s.veterinarian,
    'Anestesia': s.anesthesia || '',
    'Motivo': s.reason || '',
    'Observaciones': s.observations || '',
    'Resultado Evolución': s.evolutionResult || '',
    'Próximo Control': s.nextControl || '',
  }));
  const wsSurgeries = XLSX.utils.json_to_sheet(surgeriesRows);
  wsSurgeries['!cols'] = getColWidths(surgeriesRows);
  XLSX.utils.book_append_sheet(wb, wsSurgeries, 'Cirugías');

  // 6. Hoja Laboratorio
  const labsRows = labs.map(l => ({
    'ID Examen': l.id,
    'Paciente': patientMap.get(l.patientId) || l.patientId,
    'Fecha': l.date,
    'Tipo de Examen': l.examType,
    'Resultado': l.result,
    'Interpretación': l.interpretation || '',
    'Veterinario': l.veterinarian || '',
  }));
  const wsLabs = XLSX.utils.json_to_sheet(labsRows);
  wsLabs['!cols'] = getColWidths(labsRows);
  XLSX.utils.book_append_sheet(wb, wsLabs, 'Laboratorio');

  // 7. Hoja Peluquería / Grooming
  const groomingsRows = groomings.map(g => ({
    'ID Servicio': g.id,
    'Paciente': patientMap.get(g.patientId) || g.patientId,
    'Fecha': g.date ? g.date.split('T')[0] : '',
    'Servicio': g.service,
    'Observaciones': g.observations || '',
  }));
  const wsGroomings = XLSX.utils.json_to_sheet(groomingsRows);
  wsGroomings['!cols'] = getColWidths(groomingsRows);
  XLSX.utils.book_append_sheet(wb, wsGroomings, 'Peluquería');

  // 8. Hoja Control de Peso
  const weightsRows = weights.map(w => ({
    'ID Registro': w.id,
    'Paciente': patientMap.get(w.patientId) || w.patientId,
    'Fecha': w.date ? w.date.split('T')[0] : '',
    'Peso (kg)': w.weightKg,
    'Notas': w.notes || '',
  }));
  const wsWeights = XLSX.utils.json_to_sheet(weightsRows);
  wsWeights['!cols'] = getColWidths(weightsRows);
  XLSX.utils.book_append_sheet(wb, wsWeights, 'Control de Peso');

  // Write file
  const today = new Date().toISOString().split('T')[0];
  const sanitizedClinic = clinicName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Respaldo_Completo_${sanitizedClinic}_${today}.xlsx`;
  XLSX.writeFile(wb, filename);

  return filename;
}

/**
 * EXPORT 2: Export only patients list
 */
export function exportPatientsListToExcel(patients: Patient[], clinicName = 'AxiomaVet'): string {
  const wb = XLSX.utils.book_new();
  const rows = patients.map(p => ({
    'ID Paciente': p.id,
    'Nombre Mascota': p.name,
    'Especie': p.species,
    'Raza': p.breed || 'Mestizo',
    'Sexo': p.gender === 'M' ? 'Macho' : p.gender === 'F' ? 'Hembra' : 'Indeterminado',
    'Fecha Nacimiento': p.birthDate || '',
    'Peso Actual': p.weight || '',
    'Nombre Tutor': p.ownerName,
    'Teléfono Tutor': p.ownerPhone,
    'Email Tutor': p.ownerEmail || '',
    'Cédula / ID': p.ownerId || '',
    'Color': p.color || '',
    'Esterilizado': p.isSterilized ? 'Sí' : 'No',
    'Estado': p.status,
    'Notas / Conducta': p.behaviorObservation || '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = getColWidths(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Pacientes');

  const today = new Date().toISOString().split('T')[0];
  const filename = `Pacientes_${clinicName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${today}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}

/**
 * TEMPLATE GENERATION: Official Excel Migration Template
 */
export function downloadMigrationTemplate(): void {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Plantilla con ejemplos
  const sampleData = [
    {
      'nombre_mascota': 'Max',
      'especie': 'Perro',
      'raza': 'Golden Retriever',
      'sexo': 'M',
      'fecha_nacimiento': '2021-06-15',
      'peso': '32 kg',
      'nombre_tutor': 'Carlos Pérez',
      'telefono_tutor': '0991234567',
      'email_tutor': 'carlos.perez@email.com',
      'cedula_tutor': '1712345678',
      'color': 'Dorado',
      'esterilizado': 'SI',
      'notas_clinicas': 'Alérgico a picadura de pulgas, paciente sociable.',
    },
    {
      'nombre_mascota': 'Luna',
      'especie': 'Gato',
      'raza': 'Siamés',
      'sexo': 'F',
      'fecha_nacimiento': '2023-02-10',
      'peso': '4.2 kg',
      'nombre_tutor': 'María Rodríguez',
      'telefono_tutor': '0987654321',
      'email_tutor': 'maria.rodriguez@email.com',
      'cedula_tutor': '1798765432',
      'color': 'Crema y marrón',
      'esterilizado': 'NO',
      'notas_clinicas': 'Temperamento nervioso en consulta.',
    },
    {
      'nombre_mascota': 'Rocky',
      'especie': 'Perro',
      'raza': 'Bulldog Francés',
      'sexo': 'M',
      'fecha_nacimiento': '2022-11-05',
      'peso': '12.5 kg',
      'nombre_tutor': 'Andrés Gómez',
      'telefono_tutor': '0995551122',
      'email_tutor': '',
      'cedula_tutor': '',
      'color': 'Atigrado',
      'esterilizado': 'SI',
      'notas_clinicas': '',
    }
  ];

  const wsTemplate = XLSX.utils.json_to_sheet(sampleData);
  wsTemplate['!cols'] = [
    { wch: 18 }, // nombre_mascota
    { wch: 12 }, // especie
    { wch: 18 }, // raza
    { wch: 8 },  // sexo
    { wch: 18 }, // fecha_nacimiento
    { wch: 12 }, // peso
    { wch: 22 }, // nombre_tutor
    { wch: 16 }, // telefono_tutor
    { wch: 24 }, // email_tutor
    { wch: 16 }, // cedula_tutor
    { wch: 15 }, // color
    { wch: 14 }, // esterilizado
    { wch: 35 }, // notas_clinicas
  ];
  XLSX.utils.book_append_sheet(wb, wsTemplate, 'Pacientes_Migracion');

  // Hoja 2: Instrucciones de llenado
  const instructions = [
    { 'Instrucción': '1. CAMPOS OBLIGATORIOS', 'Detalle': 'nombre_mascota, especie, nombre_tutor y telefono_tutor son campos esenciales para la ficha.' },
    { 'Instrucción': '2. FORMATO DE SEXO', 'Detalle': 'Coloca "M" para Macho, "F" para Hembra o "U" si no se conoce.' },
    { 'Instrucción': '3. FORMATO DE FECHA', 'Detalle': 'Preferiblemente AAAA-MM-DD (ej: 2022-04-15) o DD/MM/AAAA. Si no la conoces exacta, puedes estimar el año.' },
    { 'Instrucción': '4. FILAS INCONGRUENTES', 'Detalle': 'Filas sin nombre de mascota o vacías serán omitidas automáticamente para no alterar tu base de datos.' },
    { 'Instrucción': '5. FORMATOS COMPATIBLES', 'Detalle': 'Puedes subir este archivo guardado como .xlsx, .xls o .csv directamente en Axioma Vet.' },
  ];
  const wsInstructions = XLSX.utils.json_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 28 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instrucciones_Llenado');

  XLSX.writeFile(wb, 'Plantilla_Migracion_AxiomaVet.xlsx');
}

/**
 * PARSER & VALIDATOR: Inspects an uploaded Excel/CSV file, normalizes columns,
 * classifies valid vs incongruent rows, and provides a clear audit trail.
 */
export interface ValidatedPatientRow {
  rowNumber: number;
  data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
  warnings: string[];
}

export interface IncongruentRow {
  rowNumber: number;
  raw: Record<string, any>;
  reason: string;
}

export interface MigrationAnalysisResult {
  totalRows: number;
  validRows: ValidatedPatientRow[];
  incongruentRows: IncongruentRow[];
  readyCount: number;
  skippedCount: number;
}

export async function parseAndValidateMigrationFile(file: File): Promise<MigrationAnalysisResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  
  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new Error('El archivo no contiene ninguna hoja de cálculo.');
  }

  // Read first sheet as array of raw objects
  const firstSheetName = wb.SheetNames[0];
  const worksheet = wb.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (rawRows.length === 0) {
    throw new Error('La hoja seleccionada está vacía. Asegúrate de incluir datos en las filas.');
  }

  const validRows: ValidatedPatientRow[] = [];
  const incongruentRows: IncongruentRow[] = [];

  // Helper to normalize header key
  const normalizeKey = (key: string): string => {
    return key
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_');
  };

  rawRows.forEach((rawRow, idx) => {
    const rowNum = idx + 2; // Row 1 is header in Excel

    // Map keys to normalized form
    const normalized: Record<string, any> = {};
    Object.keys(rawRow).forEach(k => {
      normalized[normalizeKey(k)] = rawRow[k];
    });

    // Helper to find value from possible aliases
    const findValue = (...aliases: string[]): any => {
      for (const a of aliases) {
        if (normalized[a] !== undefined && normalized[a] !== null && String(normalized[a]).trim() !== '') {
          return normalized[a];
        }
      }
      return '';
    };

    // Extract fields
    const rawName = String(findValue('nombre_mascota', 'mascota', 'nombre', 'paciente', 'nombre_paciente')).trim();
    const rawSpecies = String(findValue('especie', 'tipo', 'tipo_animal', 'species')).trim();
    const rawBreed = String(findValue('raza', 'breed')).trim();
    const rawGender = String(findValue('sexo', 'genero', 'gender')).trim();
    const rawBirthDate = findValue('fecha_nacimiento', 'nacimiento', 'f_nacimiento', 'fecha_de_nacimiento', 'birth_date');
    const rawWeight = String(findValue('peso', 'peso_actual', 'weight')).trim();
    const rawOwnerName = String(findValue('nombre_tutor', 'tutor', 'dueno', 'propietario', 'nombre_dueno', 'cliente')).trim();
    const rawOwnerPhone = String(findValue('telefono_tutor', 'telefono', 'celular', 'cel', 'contacto', 'phone')).trim();
    const rawOwnerEmail = String(findValue('email_tutor', 'email', 'correo', 'mail')).trim();
    const rawOwnerId = String(findValue('cedula_tutor', 'cedula', 'identificacion', 'dni', 'ci', 'id_tutor')).trim();
    const rawColor = String(findValue('color', 'pelaje')).trim();
    const rawSterilized = String(findValue('esterilizado', 'castrado', 'esterilizada')).trim();
    const rawNotes = String(findValue('notas_clinicas', 'notas', 'observaciones', 'conducta', 'historial')).trim();

    // Check if entire row is empty
    const allValuesEmpty = Object.values(rawRow).every(v => String(v).trim() === '');
    if (allValuesEmpty) {
      // Skip empty line silently or as excluded
      return;
    }

    // CRITICAL VALIDATION: Patient Name is indispensable
    if (!rawName) {
      incongruentRows.push({
        rowNumber: rowNum,
        raw: rawRow,
        reason: 'Nombre de mascota ausente o vacío (Fila omitida por seguridad clínica).'
      });
      return;
    }

    const warnings: string[] = [];

    // Species resolution
    let finalSpecies = rawSpecies;
    if (!finalSpecies) {
      finalSpecies = 'Perro';
      warnings.push('Especie no especificada: se asignó "Perro" por defecto.');
    }

    // Gender resolution (M, F, U)
    let finalGender: 'M' | 'F' | 'U' = 'U';
    const gLower = rawGender.toLowerCase();
    if (gLower.startsWith('m') || gLower.includes('macho') || gLower.includes('male')) {
      finalGender = 'M';
    } else if (gLower.startsWith('f') || gLower.startsWith('h') || gLower.includes('hembra') || gLower.includes('female')) {
      finalGender = 'F';
    } else if (rawGender) {
      warnings.push(`Sexo "${rawGender}" no reconocido: se estableció como Indeterminado.`);
    }

    // BirthDate resolution
    let finalBirthDate = '';
    if (rawBirthDate instanceof Date && !isNaN(rawBirthDate.getTime())) {
      finalBirthDate = rawBirthDate.toISOString().split('T')[0];
    } else if (typeof rawBirthDate === 'string' && rawBirthDate.trim()) {
      const trimmed = rawBirthDate.trim();
      // Match YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        finalBirthDate = trimmed;
      } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
        // DD/MM/YYYY
        const parts = trimmed.split('/');
        finalBirthDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
        // DD-MM-YYYY
        const parts = trimmed.split('-');
        finalBirthDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      } else {
        warnings.push(`Fecha de nacimiento "${trimmed}" ilegible: se dejó pendiente para completar en consulta.`);
      }
    }

    // If still no birthDate, default to a safe standard date (e.g. 1 year ago)
    if (!finalBirthDate) {
      const fallbackYear = new Date().getFullYear() - 1;
      finalBirthDate = `${fallbackYear}-01-01`;
    }

    // Owner resolution
    let finalOwnerName = rawOwnerName;
    if (!finalOwnerName) {
      finalOwnerName = 'Tutor por asignar';
      warnings.push('Nombre de tutor vacío: se asignó "Tutor por asignar".');
    }

    let finalOwnerPhone = rawOwnerPhone;
    if (!finalOwnerPhone) {
      finalOwnerPhone = 'Sin teléfono';
      warnings.push('Teléfono de tutor vacío: se asignó "Sin teléfono".');
    }

    // Sterilized boolean
    const sLower = rawSterilized.toLowerCase();
    const isSterilized = sLower === 'si' || sLower === 'sí' || sLower === 'true' || sLower === '1' || sLower === 'yes';

    validRows.push({
      rowNumber: rowNum,
      data: {
        name: rawName,
        species: finalSpecies,
        breed: rawBreed || undefined,
        gender: finalGender,
        birthDate: finalBirthDate,
        weight: rawWeight || undefined,
        ownerName: finalOwnerName,
        ownerPhone: finalOwnerPhone,
        ownerEmail: rawOwnerEmail || undefined,
        ownerId: rawOwnerId || undefined,
        color: rawColor || undefined,
        isSterilized,
        status: 'NORMAL',
        behaviorObservation: rawNotes || undefined,
      },
      warnings,
    });
  });

  return {
    totalRows: rawRows.length,
    validRows,
    incongruentRows,
    readyCount: validRows.length,
    skippedCount: incongruentRows.length,
  };
}
