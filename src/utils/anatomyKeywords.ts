import type { Consultation, Patient } from '../services/types';
import { getCurrentLanguage, pickLang, type AppLanguage } from '../i18n';

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

interface BilingualRegionDef {
  id: AnatomicalRegionId;
  labelEs: string;
  labelEn: string;
  sublabelEs: string;
  sublabelEn: string;
  keywords: string[];
}

const REGION_DEFS: BilingualRegionDef[] = [
  {
    id: 'head',
    labelEs: 'Cabeza y Sentidos',
    labelEn: 'Head & Senses',
    sublabelEs: 'Ojos, oídos, cavidad oral y dentadura',
    sublabelEn: 'Eyes, ears, oral cavity, and teeth',
    keywords: [
      'otitis', 'oido', 'oído', 'ojo', 'ocular', 'conjuntiv', 'boca', 'dental', 
      'diente', 'encias', 'encías', 'sarro', 'hocico', 'nariz', 'cabeza', 'cornea', 
      'córnea', 'pupila', 'gingivitis', 'estomatitis', 'lagrimeo',
      'ear', 'eye', 'mouth', 'tooth', 'teeth', 'gums', 'tartar', 'snout', 'nose', 'head', 'pupil', 'tearing'
    ]
  },
  {
    id: 'neck',
    labelEs: 'Cuello y Vía Alta',
    labelEn: 'Neck & Upper Airway',
    sublabelEs: 'Garganta, tráquea y tiroides',
    sublabelEn: 'Throat, trachea, and thyroid',
    keywords: [
      'cuello', 'garganta', 'traquea', 'tráquea', 'tiroides', 'faring', 'laring', 
      'colapso traqueal', 'ganglio',
      'neck', 'throat', 'trachea', 'thyroid', 'pharyn', 'laryn', 'lymph node'
    ]
  },
  {
    id: 'thorax',
    labelEs: 'Tórax y Cardiorrespiratorio',
    labelEn: 'Thorax & Cardiorespiratory',
    sublabelEs: 'Pulmones, corazón y caja torácica',
    sublabelEn: 'Lungs, heart, and rib cage',
    keywords: [
      'torax', 'tórax', 'pulmon', 'pulmón', 'respirat', 'tos', 'disnea', 'corazon', 
      'corazón', 'cardio', 'soplo', 'arritmia', 'costilla', 'bronqu', 'neumon', 'asma',
      'thorax', 'chest', 'lung', 'cough', 'dyspnea', 'heart', 'murmur', 'arrhythmia', 'rib', 'bronch', 'pneumon', 'asthma'
    ]
  },
  {
    id: 'abdomen',
    labelEs: 'Abdomen y Digestivo',
    labelEn: 'Abdomen & Digestive',
    sublabelEs: 'Estómago, intestinos, hígado y urogenital',
    sublabelEn: 'Stomach, intestines, liver, and urogenital',
    keywords: [
      'abdomen', 'vomit', 'vómit', 'diarrea', 'gastr', 'digestiv', 'higado', 'hígado', 
      'pancrea', 'renal', 'riñon', 'riñón', 'vejiga', 'orina', 'cistitis', 'prostata', 
      'próstata', 'utero', 'útero', 'piometra', 'copro', 'heces', 'estreñimiento',
      'diarrhea', 'liver', 'kidney', 'bladder', 'urine', 'cystitis', 'prostate', 'uterus', 'pyometra', 'stool', 'constipation'
    ]
  },
  {
    id: 'spine',
    labelEs: 'Columna y Dorso',
    labelEn: 'Spine & Back',
    sublabelEs: 'Vértebras cervicales, torácicas y lumbares',
    sublabelEn: 'Cervical, thoracic, and lumbar vertebrae',
    keywords: [
      'columna', 'vertebra', 'vértebra', 'lomo', 'espalda', 'disco', 'hernia', 
      'lumbar', 'cervical',
      'spine', 'back', 'disc'
    ]
  },
  {
    id: 'front_limbs',
    labelEs: 'Extremidades Anteriores',
    labelEn: 'Forelimbs',
    sublabelEs: 'Hombros, codos, carpos y manos',
    sublabelEn: 'Shoulders, elbows, carpus, and front paws',
    keywords: [
      'pata delantera', 'mano', 'hombro', 'codo', 'carpo', 'brazo anterior', 'pezuña delantera',
      'forelimb', 'front leg', 'front paw', 'shoulder', 'elbow', 'carpus'
    ]
  },
  {
    id: 'hind_limbs',
    labelEs: 'Extremidades Posteriores y Pelvis',
    labelEn: 'Hindlimbs & Pelvis',
    sublabelEs: 'Caderas, rodillas, tarsos y patas traseras',
    sublabelEn: 'Hips, stifles, hocks, and hind paws',
    keywords: [
      'cadera', 'displasia', 'rodilla', 'pata trasera', 'tarso', 'femur', 'fémur', 
      'ligamento', 'cojera', 'claudic', 'patas traseras', 'rodillas',
      'hip', 'dysplasia', 'knee', 'stifle', 'hind limb', 'hind leg', 'hock', 'tarsus', 'ligament', 'limp', 'lameness'
    ]
  },
  {
    id: 'skin',
    labelEs: 'Piel y Pelaje (Dermatología)',
    labelEn: 'Skin & Coat (Dermatology)',
    sublabelEs: 'Dermis, prurito, ectoparásitos y heridas',
    sublabelEn: 'Dermis, pruritus, ectoparasites, and wounds',
    keywords: [
      'piel', 'dermat', 'prurito', 'rasca', 'alergia', 'pulga', 'garrapata', 'sarna', 
      'alopecia', 'herida', 'absceso', 'hongos', 'pioderma', 'costras', 'pelo',
      'skin', 'pruritus', 'itch', 'allergy', 'flea', 'tick', 'mange', 'wound', 'abscess', 'fungus', 'pyoderma', 'crust', 'coat', 'fur'
    ]
  }
];

export function getAnatomicalRegions(lang: AppLanguage = getCurrentLanguage()): Omit<AnatomicalRegionInfo, 'findings'>[] {
  return REGION_DEFS.map(def => ({
    id: def.id,
    label: lang === 'en' ? def.labelEn : def.labelEs,
    sublabel: lang === 'en' ? def.sublabelEn : def.sublabelEs,
    keywords: def.keywords,
  }));
}

export const ANATOMICAL_REGIONS: Omit<AnatomicalRegionInfo, 'findings'>[] = getAnatomicalRegions('es');

export function analyzeAnatomicalFindings(
  patient: Patient,
  consultations: Consultation[]
): AnatomicalRegionInfo[] {
  const lang = getCurrentLanguage();
  const regions = getAnatomicalRegions(lang);

  return regions.map(regionDef => {
    const findings: AnatomicalFindingDetail[] = [];

    (consultations || []).forEach(c => {
      const fullText = `${c.diagnosis || ''} ${c.observation || ''} ${c.treatment || ''}`.toLowerCase();
      
      const matched = regionDef.keywords.some(kw => fullText.includes(kw.toLowerCase()));
      if (matched) {
        findings.push({
          source: `${pickLang('Consulta', 'Consultation', lang)} (${c.reason || pickLang('Atención', 'Visit', lang)})`,
          text: c.diagnosis || c.observation || pickLang('Registro clínico relacionado', 'Related clinical record', lang),
          date: c.createdAt
        });
      }
    });

    if (patient.behaviorObservation) {
      const text = patient.behaviorObservation.toLowerCase();
      if (regionDef.keywords.some(kw => text.includes(kw.toLowerCase()))) {
        findings.push({
          source: pickLang('Observación en ficha', 'Profile observation', lang),
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
