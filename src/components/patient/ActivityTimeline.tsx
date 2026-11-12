import { useEffect, useMemo, useState } from 'react';
import { Syringe, FileText, Pill, Scissors, TestTube, Flag, MapPin, UserCheck, PencilLine } from 'lucide-react';
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
  createdBy?: string | null;
  updatedBy?: string | null;
}

export function ActivityTimeline({ patientId }: { patientId: string }) {
  const { lang, t } = useTranslation();
  const {
    getConsultations,
    getPrescriptions,
    getVaccines,
    getLabs,
    getSurgeries,
    getGroomings,
    patients,
    resolveMemberLabel,
    workspaceMembers,
  } = useVetContext();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');

  useEffect(() => {
    const pick = (esText: string, enText: string) => (lang === 'en' ? enText : esText);
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
            title: `${pick('Consulta', 'Consultation')}: ${c.reason}`,
            description: c.diagnosis || pick('Sin diagnóstico registrado', 'No diagnosis recorded'),
            icon: FileText,
            colorClass: 'text-blue-500 border-blue-200 bg-blue-50',
            anatomyPointsCount: points.length,
            quadrants: uniqueQuadrants,
            createdBy: c.createdBy,
            updatedBy: c.updatedBy,
          });
        });

        // Add Prescriptions
        prescriptions.forEach((p: Prescription) => {
          allEvents.push({
            id: p.id,
            type: 'prescription',
            date: parseLocalDate(p.date),
            title: pick('Receta Emitida', 'Prescription Issued'),
            description: `${p.medication} - ${p.dosage} (${p.duration})`,
            icon: Pill,
            colorClass: 'text-purple-500 border-purple-200 bg-purple-50',
            createdBy: p.createdBy,
            updatedBy: p.updatedBy,
          });
        });

        // Add Vaccines
        vaccines.forEach((v: Vaccine) => {
          allEvents.push({
            id: v.id,
            type: 'vaccine',
            date: parseLocalDate(v.applicationDate),
            title: `${pick('Vacuna', 'Vaccine')}: ${v.vaccineName}`,
            description: v.observations || pick('Aplicación exitosa', 'Successfully administered'),
            icon: Syringe,
            colorClass: 'text-emerald-500 border-emerald-200 bg-emerald-50',
            createdBy: v.createdBy,
            updatedBy: v.updatedBy,
          });
        });

        // Add Labs
        labs.forEach((l: LabResult) => {
          allEvents.push({
            id: l.id,
            type: 'lab',
            date: parseLocalDate(l.date),
            title: `${pick('Laboratorio', 'Lab')}: ${l.examType}`,
            description: l.result || pick('Sin resultados detallados', 'No detailed results'),
            icon: TestTube,
            colorClass: 'text-amber-500 border-amber-200 bg-amber-50',
            createdBy: l.createdBy,
            updatedBy: l.updatedBy,
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
            title: `${pick('Cirugía', 'Surgery')}: ${s.procedure}`,
            description: s.evolutionResult || pick('Procedimiento completado', 'Procedure completed'),
            icon: Scissors,
            colorClass: 'text-rose-500 border-rose-200 bg-rose-50',
            anatomyPointsCount: points.length,
            quadrants: uniqueQuadrants,
            createdBy: s.createdBy,
            updatedBy: s.updatedBy,
          });
        });

        // Add Groomings
        groomings.forEach((g: any) => {
          allEvents.push({
            id: g.id,
            type: 'grooming',
            date: parseLocalDate(g.date),
            title: `${pick('Peluquería', 'Grooming')}: ${g.service}`,
            description: g.observations || pick('Servicio realizado', 'Service completed'),
            icon: Scissors,
            colorClass: 'text-cyan-500 border-cyan-200 bg-cyan-50',
            createdBy: g.createdBy,
            updatedBy: g.updatedBy,
          });
        });

        // Add Registration Event (Fallback to patient creation date)
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
          allEvents.push({
            id: `reg-${patient.id}`,
            type: 'registration',
            date: parseLocalDate(patient.createdAt),
            title: pick('Primer Registro', 'Initial Registration'),
            description: pick('Creación del expediente médico inicial.', 'Initial medical record creation.'),
            icon: Flag,
            colorClass: 'text-outline border-outline-variant bg-surface-container',
            createdBy: patient.createdBy,
            updatedBy: patient.updatedBy,
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
  }, [patientId, lang, getConsultations, getPrescriptions, getVaccines, getLabs, getSurgeries, getGroomings, patients]);

  const actorOptions = useMemo(() => {
    const map = new Map<string, string>();
    workspaceMembers.forEach((m) => {
      map.set(m.id, m.name || m.email || m.id.slice(0, 8));
    });
    events.forEach((e) => {
      if (e.createdBy && !map.has(e.createdBy)) {
        map.set(e.createdBy, resolveMemberLabel(e.createdBy));
      }
      if (e.updatedBy && !map.has(e.updatedBy)) {
        map.set(e.updatedBy, resolveMemberLabel(e.updatedBy));
      }
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [workspaceMembers, events, resolveMemberLabel]);

  const filteredEvents = useMemo(() => {
    if (selectedMemberId === 'all') return events;
    return events.filter(
      (e) => e.createdBy === selectedMemberId || e.updatedBy === selectedMemberId
    );
  }, [events, selectedMemberId]);

  if (isLoading) {
    return <div className="py-12 flex justify-center text-outline">{t('Cargando actividad...', 'Loading activity...')}</div>;
  }

  if (events.length === 0) {
    return <div className="py-12 flex justify-center text-outline">{t('No hay actividad registrada.', 'No recorded activity.')}</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-outline-variant pb-6">
        <h3 className="font-headline-lg text-headline-lg text-on-surface m-0">{t('Historial de Actividad', 'Activity History')}</h3>
        {actorOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="timeline-member-filter" className="text-xs font-medium text-on-surface-variant whitespace-nowrap">
              {t('Miembro:', 'Member:')}
            </label>
            <select
              id="timeline-member-filter"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">{t('Todos', 'All')}</option>
              {actorOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>
      
      <div className="relative pl-8 flex flex-col gap-12 before:content-[''] before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gradient-to-b before:from-primary-container before:via-outline-variant before:to-transparent">
        {filteredEvents.length === 0 ? (
          <div className="py-8 text-sm text-outline">{t('Sin actividad registrada para este miembro.', 'No recorded activity for this member.')}</div>
        ) : (
          filteredEvents.map((event) => {
          const Icon = event.icon;
          const creatorLabel = resolveMemberLabel(event.createdBy);
          const editorLabel =
            event.updatedBy && event.updatedBy !== event.createdBy
              ? resolveMemberLabel(event.updatedBy)
              : '';
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
                {(creatorLabel || editorLabel) && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 mt-1 border-t border-outline-variant/40 text-[11px] text-on-surface-variant">
                    {creatorLabel && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-medium">
                        <UserCheck className="w-3 h-3 text-primary" />
                        <span>{t('Registrado por:', 'Recorded by:')} {creatorLabel}</span>
                      </span>
                    )}
                    {editorLabel && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                        <PencilLine className="w-3 h-3" />
                        <span>{t('Editado por:', 'Edited by:')} {editorLabel}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })
        )}
      </div>
    </div>
  );
}
