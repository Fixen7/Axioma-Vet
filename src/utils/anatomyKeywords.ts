import type { Consultation, Patient } from '../services/types';

export type AnatomicalRegionId = 
  | 'head'
  | 'neck'
  | 'thorax'
  | 'abdomen'
  | 'spine'
  | 'front_limbs'
  | 'hind_limbs'
  | 'skin';

export interface AnatomicalFindingDetail {
  source: string;
  text: string;
  date: string;
}

export interface AnatomicalRegionInfo {
  id: AnatomicalRegionId;
  label: string;
  sublabel: string;
  keywords: string[];
  findings: AnatomicalFindingDetail[];
}

export const ANATOMICAL_REGIONS: Omit<AnatomicalRegionInfo, 'findings'>[] = [
  {
    id: 'head',
    label: 'Cabeza y Sentidos',
    sublabel: 'Ojos, oídos, cavidad oral y dentadura',
    keywords: [
      'otitis', 'oido', 'oído', 'ojo', 'ocular', 'conjuntiv', 'boca', 'dental', 
      'diente', 'encias', 'encías', 'sarro', 'hocico', 'nariz', 'cabeza', 'cornea', 
      'córnea', 'pupila', 'gingivitis', 'estomatitis', 'lagrimeo'
    ]
  },
  {
    id: 'neck',
    label: 'Cuello y Vía Alta',
    sublabel: 'Garganta, tráquea y tiroides',
    keywords: [
      'cuello', 'garganta', 'traquea', 'tráquea', 'tiroides', 'faring', 'laring', 
      'colapso traqueal', 'ganglio'
    ]
  },
  {
    id: 'thorax',
    label: 'Tórax y Cardiorrespiratorio',
    sublabel: 'Pulmones, corazón y caja torácica',
    keywords: [
      'torax', 'tórax', 'pulmon', 'pulmón', 'respirat', 'tos', 'disnea', 'corazon', 
      'corazón', 'cardio', 'soplo', 'arritmia', 'costilla', 'bronqu', 'neumon', 'asma'
    ]
  },
  {
    id: 'abdomen',
    label: 'Abdomen y Digestivo',
    sublabel: 'Estómago, intestinos, hígado y urogenital',
    keywords: [
      'abdomen', 'vomit', 'vómit', 'diarrea', 'gastr', 'digestiv', 'higado', 'hígado', 
      'pancrea', 'renal', 'riñon', 'riñón', 'vejiga', 'orina', 'cistitis', 'prostata', 
      'próstata', 'utero', 'útero', 'piometra', 'copro', 'heces', 'estreñimiento'
    ]
  },
  {
    id: 'spine',
    label: 'Columna y Dorso',
    sublabel: 'Vértebras cervicales, torácicas y lumbares',
    keywords: [
      'columna', 'vertebra', 'vértebra', 'lomo', 'espalda', 'disco', 'hernia', 
      'lumbar', 'cervical'
    ]
  },
  {
    id: 'front_limbs',
    label: 'Extremidades Anteriores',
    sublabel: 'Hombros, codos, carpos y manos',
    keywords: [
      'pata delantera', 'mano', 'hombro', 'codo', 'carpo', 'brazo anterior', 'pezuña delantera'
    ]
  },
  {
    id: 'hind_limbs',
    label: 'Extremidades Posteriores y Pelvis',
    sublabel: 'Caderas, rodillas, tarsos y patas traseras',
    keywords: [
      'cadera', 'displasia', 'rodilla', 'pata trasera', 'tarso', 'femur', 'fémur', 
      'ligamento', 'cojera', 'claudic', 'patas traseras', 'rodillas'
    ]
  },
  {
    id: 'skin',
    label: 'Piel y Pelaje (Dermatología)',
    sublabel: 'Dermis, prurito, ectoparásitos y heridas',
    keywords: [
      'piel', 'dermat', 'prurito', 'rasca', 'alergia', 'pulga', 'garrapata', 'sarna', 
      'alopecia', 'herida', 'absceso', 'hongos', 'pioderma', 'costras', 'pelo'
    ]
  }
];

export function analyzeAnatomicalFindings(
  patient: Patient,
  consultations: Consultation[]
): AnatomicalRegionInfo[] {
  return ANATOMICAL_REGIONS.map(regionDef => {
    const findings: AnatomicalFindingDetail[] = [];

    // Revisar consultas
    (consultations || []).forEach(c => {
      const fullText = `${c.diagnosis || ''} ${c.observation || ''} ${c.treatment || ''}`.toLowerCase();
      
      const matched = regionDef.keywords.some(kw => fullText.includes(kw.toLowerCase()));
      if (matched) {
        findings.push({
          source: `Consulta (${c.reason || 'Atención'})`,
          text: c.diagnosis || c.observation || 'Registro clínico relacionado',
          date: c.createdAt
        });
      }
    });

    // Revisar observación de manejo del paciente
    if (patient.behaviorObservation) {
      const text = patient.behaviorObservation.toLowerCase();
      if (regionDef.keywords.some(kw => text.includes(kw.toLowerCase()))) {
        findings.push({
          source: 'Observación en ficha',
          text: patient.behaviorObservation,
          date: patient.createdAt || ''
        });
      }
    }

    return {
      ...regionDef,
      findings
    };
  });
}
