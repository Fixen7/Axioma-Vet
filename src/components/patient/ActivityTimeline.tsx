import { useEffect, useState } from 'react';
import { Syringe, FileText, Pill, Scissors, TestTube, Flag, MapPin } from 'lucide-react';
import { useVetContext } from '../../context/VetContext';
import type { Consultation, Prescription, Vaccine, LabResult, Surgery } from '../../services/types';
import { parseLocalDate, formatLocalDate } from '../../utils/date';
import { getPointsBySource, getQuadrantLabels } from '../../utils/customAnatomyPoints';
import { useTranslation } from '../../i18n';

interface TimelineEvent {
  id: string;
  type: 'consultation' | 'prescription' | 'vaccine' | 'lab' | 'surgery' | 'registration' | 'grooming';
  date: Date;
  title: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
  anatomyPointsCount?: number;
  quadrants?: string[];
}

export function ActivityTimeline({ patientId }: { patientId: string }) {
  const { lang, t } = useTranslation();
  const { getConsultations, getPrescriptions, getVaccines, getLabs, getSurgeries, getGroomings, patients } = useVetContext();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const quadrantLabels = getQuadrantLabels(lang);
    async function loadEvents() {
      setIsLoading(true);
      try {
        const [consultations, prescriptions, vaccines, labs, surgeries, groomings] = await Promise.all([
          getConsultations(patientId),
          getPrescriptions(patientId),
          getVaccines(patientId),
          getLabs(patientId),
          getSurgeries(patientId),
          getGroomings(patientId)
        ]);

        const allEvents: TimelineEvent[] = [];

        // Add Consultations
        consultations.forEach((c: Consultation) => {
          const points = getPointsBySource(patientId, c.id);
          const uniqueQuadrants = Array.from(new Set(points.map(p => quadrantLabels[p.quadrant])));

          allEvents.push({
            id: c.id,
            type: 'consultation',
            date: parseLocalDate(c.createdAt),
            title: `${t('Consulta', 'Consultation')}: ${c.reason}`,
            description: c.diagnosis || t('Sin diagnóstico registrado', 'No diagnosis recorded'),
            icon: FileText,
            colorClass: 'text-blue-500 border-blue-200 bg-blue-50',
            anatomyPointsCount: points.length,
            quadrants: uniqueQuadrants
          });
        });

        // Add Prescriptions
        prescriptions.forEach((p: Prescription) => {
          allEvents.push({
            id: p.id,
            type: 'prescription',
            date: parseLocalDate(p.date),
            title: t('Receta Emitida', 'Prescription Issued'),
            description: `${p.medication} - ${p.dosage} (${p.duration})`,
            icon: Pill,
            colorClass: 'text-purple-500 border-purple-200 bg-purple-50'
          });
        });

        // Add Vaccines
        vaccines.forEach((v: Vaccine) => {
          allEvents.push({
            id: v.id,
            type: 'vaccine',
            date: parseLocalDate(v.applicationDate),
            title: `${t('Vacuna', 'Vaccine')}: ${v.vaccineName}`,
            description: v.observations || t('Aplicación exitosa', 'Successfully administered'),
            icon: Syringe,
            colorClass: 'text-emerald-500 border-emerald-200 bg-emerald-50'
          });
        });

        // Add Labs
        labs.forEach((l: LabResult) => {
          allEvents.push({
            id: l.id,
            type: 'lab',
            date: parseLocalDate(l.date),
            title: `${t('Laboratorio', 'Lab')}: ${l.examType}`,
            description: l.result || t('Sin resultados detallados', 'No detailed results'),
            icon: TestTube,
            colorClass: 'text-amber-500 border-amber-200 bg-amber-50'
          });
        });

        // Add Surgeries
        surgeries.forEach((s: Surgery) => {
          const points = getPointsBySource(patientId, s.id);
          const uniqueQuadrants = Array.from(new Set(points.map(p => quadrantLabels[p.quadrant])));

          allEvents.push({
            id: s.id,
            type: 'surgery',
            date: parseLocalDate(s.date),
            title: `${t('Cirugía', 'Surgery')}: ${s.procedure}`,
            description: s.evolutionResult || t('Procedimiento completado', 'Procedure completed'),
            icon: Scissors,
            colorClass: 'text-rose-500 border-rose-200 bg-rose-50',
            anatomyPointsCount: points.length,
            quadrants: uniqueQuadrants
          });
        });

        // Add Groomings
        groomings.forEach((g: any) => {
          allEvents.push({
            id: g.id,
            type: 'grooming',
            date: parseLocalDate(g.date),
            title: `${t('Peluquería', 'Grooming')}: ${g.service}`,
            description: g.observations || t('Servicio realizado', 'Service completed'),
            icon: Scissors,
            colorClass: 'text-cyan-500 border-cyan-200 bg-cyan-50'
          });
        });

        // Add Registration Event (Fallback to patient creation date)
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
          allEvents.push({
            id: `reg-${patient.id}`,
            type: 'registration',
            date: parseLocalDate(patient.createdAt),
            title: t('Primer Registro', 'Initial Registration'),
            description: t('Creación del expediente médico inicial.', 'Initial medical record creation.'),
            icon: Flag,
            colorClass: 'text-outline border-outline-variant bg-surface-container'
          });
        }

        // Sort by date descending (newest first)
        allEvents.sort((a, b) => {
          const timeA = isNaN(a.date.getTime()) ? 0 : a.date.getTime();
          const timeB = isNaN(b.date.getTime()) ? 0 : b.date.getTime();
          return timeB - timeA;
        });
        setEvents(allEvents);
      } catch (error) {
        console.error("Failed to load timeline events", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadEvents();
  }, [patientId, lang, t, getConsultations, getPrescriptions, getVaccines, getLabs, getSurgeries, getGroomings, patients]);

  if (isLoading) {
    return <div className="py-12 flex justify-center text-outline">{t('Cargando actividad...', 'Loading activity...')}</div>;
  }

  if (events.length === 0) {
    return <div className="py-12 flex justify-center text-outline">{t('No hay actividad registrada.', 'No recorded activity.')}</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-center border-b border-outline-variant pb-6">
        <h3 className="font-headline-lg text-headline-lg text-on-surface m-0">{t('Historial de Actividad', 'Activity History')}</h3>
      </header>
      
      <div className="relative pl-8 flex flex-col gap-12 before:content-[''] before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gradient-to-b before:from-primary-container before:via-outline-variant before:to-transparent">
        {events.map((event) => {
          const Icon = event.icon;
          return (
            <article key={event.id} className="relative flex flex-col gap-3 group">
              <div className={`absolute -left-8 top-1 w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-md z-10 group-hover:scale-110 transition-transform ${event.colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-3">
                <span className="font-label-caps text-label-caps tracking-widest uppercase text-on-surface-variant">
                  {formatLocalDate(event.date, true)}
                </span>
                <div className="h-[1px] flex-grow bg-gradient-to-r from-outline-variant to-transparent"></div>
              </div>
              <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant hover:border-primary/50 shadow-sm transition-colors cursor-pointer flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="font-headline-md text-headline-md text-on-surface m-0 text-lg">{event.title}</h4>
                  {event.anatomyPointsCount !== undefined && event.anatomyPointsCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      <MapPin className="w-3 h-3" />
                      <span>{event.anatomyPointsCount} {event.anatomyPointsCount === 1 ? t('cuadrante', 'quadrant') : t('cuadrantes', 'quadrants')}</span>
                    </span>
                  )}
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant m-0">{event.description}</p>
                {event.quadrants && event.quadrants.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {event.quadrants.map((q, idx) => (
                      <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant border border-outline-variant/40">
                        {q}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
