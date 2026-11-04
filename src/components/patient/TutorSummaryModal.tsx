import { useState } from 'react';
import { X, Copy, Check, Printer, UserCheck, Calendar, Pill, AlertCircle, Heart } from 'lucide-react';
import type { Patient, Consultation, Prescription, WeightRecord } from '../../services/types';
import { formatLocalDate, calculateAge } from '../../utils/date';

interface TutorSummaryModalProps {
  patient: Patient;
  consultations: Consultation[];
  prescriptions: Prescription[];
  weights: WeightRecord[];
  onClose: () => void;
}

export function TutorSummaryModal({
  patient,
  consultations,
  prescriptions,
  weights,
  onClose
}: TutorSummaryModalProps) {
  const [copied, setCopied] = useState(false);

  // Ordenar consultas y recetas por fecha más reciente
  const sortedConsultations = [...(consultations || [])].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const latestConsultation = sortedConsultations.length > 0 ? sortedConsultations[0] : null;

  const sortedPrescriptions = [...(prescriptions || [])].sort((a, b) => {
    const dateA = new Date(a.date || a.createdAt).getTime();
    const dateB = new Date(b.date || b.createdAt).getTime();
    return dateB - dateA;
  });
  const latestPrescription = sortedPrescriptions.length > 0 ? sortedPrescriptions[0] : null;

  const sortedWeights = [...(weights || [])].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  const latestWeight = sortedWeights.length > 0 ? sortedWeights[0] : null;
  const previousWeight = sortedWeights.length > 1 ? sortedWeights[1] : null;

  // Próximo control programado
  const nextControlDate = latestConsultation?.nextControl;

  // Generar texto para WhatsApp o portapapeles
  const generateClipboardText = () => {
    const lines: string[] = [];
    lines.push(`🐾 *RESUMEN DE ATENCIÓN VETERINARIA*`);
    lines.push(`*Paciente:* ${patient.name} (${patient.species}${patient.breed ? ` - ${patient.breed}` : ''})`);
    lines.push(`*Tutor:* ${patient.ownerName || 'No registrado'}`);
    if (latestWeight) {
      lines.push(`*Peso registrado:* ${latestWeight.weightKg} kg (${formatLocalDate(latestWeight.date)})`);
    }
    lines.push('');

    if (latestConsultation) {
      lines.push(`📋 *Última Consulta:* ${formatLocalDate(latestConsultation.createdAt)}`);
      lines.push(`*Diagnóstico / Motivo:* ${latestConsultation.diagnosis || 'Revisión general'}`);
      if (latestConsultation.treatment) {
        lines.push(`*Tratamiento indicado:* ${latestConsultation.treatment}`);
      }
      lines.push('');
    }

    if (latestPrescription) {
      lines.push(`💊 *Receta Médica:*`);
      lines.push(`• *Medicamento:* ${latestPrescription.medication}`);
      lines.push(`• *Dosis:* ${latestPrescription.dosage}`);
      lines.push(`• *Frecuencia:* ${latestPrescription.frequency}`);
      lines.push(`• *Duración:* ${latestPrescription.duration}`);
      lines.push('');
    }

    if (nextControlDate) {
      lines.push(`📅 *Próximo Control Programado:* ${formatLocalDate(nextControlDate)}`);
      lines.push('');
    }

    if (patient.behaviorObservation) {
      lines.push(`⚠️ *Observaciones especiales:* ${patient.behaviorObservation}`);
      lines.push('');
    }

    lines.push(`_Axioma Vet · Cuidado y salud para tus pacientes_`);
    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateClipboardText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest text-on-surface w-full max-w-xl rounded-[24px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-outline-variant/40">
        
        {/* ENCABEZADO */}
        <div className="flex items-center justify-between p-6 border-b border-surface-container-high bg-surface-container-low/50 print:hidden">
          <div className="flex items-center gap-2.5 text-primary">
            <UserCheck className="w-6 h-6" />
            <div>
              <h3 className="font-headline-sm m-0 text-base md:text-lg">Resumen para el Tutor</h3>
              <p className="text-xs text-on-surface-variant m-0">Información clara y formal lista para entregar al propietario</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-outline hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENIDO IMPRIMIBLE Y VISUAL */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5 print:p-0">
          
          {/* TARJETA MEMBRETADA */}
          <div className="border border-outline-variant/60 rounded-2xl p-5 bg-surface-container-lowest shadow-xs flex flex-col gap-4">
            
            {/* Header del Paciente */}
            <div className="flex justify-between items-start border-b border-outline-variant/40 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary">Ficha Informativa</span>
                <h2 className="text-2xl font-bold text-on-surface m-0">{patient.name}</h2>
                <p className="text-xs text-on-surface-variant m-0 capitalize">
                  {patient.species} {patient.breed ? `· ${patient.breed}` : ''} {patient.birthDate ? `· ${calculateAge(patient.birthDate)}` : ''}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-outline">Tutor Responsable</span>
                <p className="text-sm font-semibold text-on-surface m-0">{patient.ownerName || 'Sin tutor registrado'}</p>
                {patient.ownerPhone && (
                  <p className="text-xs text-on-surface-variant m-0">{patient.ownerPhone}</p>
                )}
              </div>
            </div>

            {/* Evolución de Peso */}
            {latestWeight && (
              <div className="flex items-center justify-between bg-surface-container-low/60 px-4 py-2.5 rounded-xl">
                <span className="text-xs font-medium text-on-surface-variant">Peso actual registrado:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold text-on-surface">{latestWeight.weightKg} kg</span>
                  <span className="text-[11px] text-outline">({formatLocalDate(latestWeight.date)})</span>
                  {previousWeight && (
                    <span className="text-[11px] text-on-surface-variant">
                      · Anterior: {previousWeight.weightKg} kg
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Diagnóstico y Consulta */}
            {latestConsultation ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  <Heart className="w-3.5 h-3.5 text-primary" />
                  <span>Última Atención Médica ({formatLocalDate(latestConsultation.createdAt)})</span>
                </div>
                <div className="bg-surface-container-low/30 border border-outline-variant/30 rounded-xl p-3.5">
                  <p className="text-xs text-outline font-semibold mb-1 uppercase tracking-wider">Diagnóstico / Evaluación</p>
                  <p className="text-sm text-on-surface font-medium m-0 leading-relaxed">
                    {latestConsultation.diagnosis || 'Revisión preventiva'}
                  </p>
                  {latestConsultation.treatment && (
                    <div className="mt-2.5 pt-2 border-t border-outline-variant/30">
                      <p className="text-xs text-outline font-semibold mb-1 uppercase tracking-wider">Tratamiento e Indicaciones</p>
                      <p className="text-xs text-on-surface leading-relaxed m-0 whitespace-pre-line">
                        {latestConsultation.treatment}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-outline italic text-center py-2">
                No hay consultas registradas para este paciente.
              </p>
            )}

            {/* Receta estructurada si existe */}
            {latestPrescription && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  <Pill className="w-3.5 h-3.5 text-primary" />
                  <span>Prescripción Farmacológica</span>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-primary">{latestPrescription.medication}</span>
                    <span className="text-[11px] text-outline">{latestPrescription.duration}</span>
                  </div>
                  <p className="text-xs text-on-surface m-0">
                    <strong>Dosis:</strong> {latestPrescription.dosage} · <strong>Frecuencia:</strong> {latestPrescription.frequency}
                  </p>
                </div>
              </div>
            )}

            {/* Próximo Control */}
            {nextControlDate && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider m-0">Próximo Control Programado</p>
                    <p className="text-sm font-semibold m-0">{formatLocalDate(nextControlDate)}</p>
                  </div>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100">
                  Confirmado
                </span>
              </div>
            )}

            {/* Observaciones de comportamiento o cuidados */}
            {patient.behaviorObservation && (
              <div className="bg-surface-container-high/40 rounded-xl p-3 flex items-start gap-2 text-xs text-on-surface-variant">
                <AlertCircle className="w-4 h-4 text-outline shrink-0 mt-0.5" />
                <div>
                  <strong className="text-on-surface">Observación del paciente:</strong> {patient.behaviorObservation}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* ACCIONES INFERIORES */}
        <div className="p-4 border-t border-surface-container-high bg-surface flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden">
          <span className="text-[11px] text-outline">
            Listo para copiar y enviar al tutor por mensaje o imprimir
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container transition-colors flex items-center justify-center gap-2 text-xs font-medium"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-primary text-on-primary hover:opacity-90'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? '¡Copiado!' : 'Copiar Resumen'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
