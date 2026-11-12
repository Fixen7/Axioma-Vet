import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Syringe, FileText, Scissors, Cake, ArrowLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useVetContext } from '../context/VetContext';
import type { Patient } from '../services/types';
import { parseLocalDate } from '../utils/date';
import { useTranslation } from '../i18n';

interface UpcomingEvent {
  id: string;
  patientId: string;
  patientName: string;
  date: Date;
  type: 'vaccine' | 'consultation' | 'surgery' | 'birthday';
  title: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
}

export default function UpcomingEvents() {
  const navigate = useNavigate();
  const { patients, getAllVaccines, getAllConsultations, getAllSurgeries } = useVetContext();
  const { lang, intlLocale, t } = useTranslation();
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      setIsLoading(true);
      try {
        const [vaccines, consultations, surgeries] = await Promise.all([
          getAllVaccines(),
          getAllConsultations(),
          getAllSurgeries()
        ]);

        const allEvents: UpcomingEvent[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const patientMap = new Map<string, Patient>();
        patients.forEach(p => patientMap.set(p.id, p));

        vaccines.forEach(v => {
          if (v.nextDose) {
            const date = parseLocalDate(v.nextDose);
            date.setHours(0, 0, 0, 0);
            if (date >= today && date <= thirtyDaysFromNow) {
              const patient = patientMap.get(v.patientId);
              if (patient && patient.status !== 'DECEASED') {
                allEvents.push({
                  id: `vac-${v.id}`,
                  patientId: v.patientId,
                  patientName: patient.name,
                  date,
                  type: 'vaccine',
                  title: t(`Refuerzo de Vacuna: ${v.vaccineName}`, `Vaccine Booster: ${v.vaccineName}`),
                  description: t('Aplicación programada', 'Scheduled dose'),
                  icon: Syringe,
                  colorClass: 'text-emerald-500 bg-emerald-50 border-emerald-200'
                });
              }
            }
          }
        });

        consultations.forEach(c => {
          if (c.nextControl) {
            const date = parseLocalDate(c.nextControl);
            date.setHours(0, 0, 0, 0);
            if (date >= today && date <= thirtyDaysFromNow) {
              const patient = patientMap.get(c.patientId);
              if (patient && patient.status !== 'DECEASED') {
                allEvents.push({
                  id: `con-${c.id}`,
                  patientId: c.patientId,
                  patientName: patient.name,
                  date,
                  type: 'consultation',
                  title: t('Control Clínico', 'Clinical Follow-up'),
                  description: t(`Motivo original: ${c.reason}`, `Original reason: ${c.reason}`),
                  icon: FileText,
                  colorClass: 'text-blue-500 bg-blue-50 border-blue-200'
                });
              }
            }
          }
        });

        surgeries.forEach(s => {
          if (s.nextControl) {
            const date = parseLocalDate(s.nextControl);
            date.setHours(0, 0, 0, 0);
            if (date >= today && date <= thirtyDaysFromNow) {
              const patient = patientMap.get(s.patientId);
              if (patient && patient.status !== 'DECEASED') {
                allEvents.push({
                  id: `sur-${s.id}`,
                  patientId: s.patientId,
                  patientName: patient.name,
                  date,
                  type: 'surgery',
                  title: t('Control Posquirúrgico', 'Post-Surgery Checkup'),
                  description: t(`Procedimiento: ${s.procedure}`, `Procedure: ${s.procedure}`),
                  icon: Scissors,
                  colorClass: 'text-rose-500 bg-rose-50 border-rose-200'
                });
              }
            }
          }
        });

        patients.forEach(p => {
          if (p.status !== 'DECEASED' && p.birthDate) {
            const birthDate = parseLocalDate(p.birthDate);
            const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
            
            if (nextBirthday < today) {
              nextBirthday.setFullYear(today.getFullYear() + 1);
            }

            if (nextBirthday >= today && nextBirthday <= thirtyDaysFromNow) {
              const age = nextBirthday.getFullYear() - birthDate.getFullYear();
              allEvents.push({
                id: `birth-${p.id}-${nextBirthday.getFullYear()}`,
                patientId: p.id,
                patientName: p.name,
                date: nextBirthday,
                type: 'birthday',
                title: t(
                  `Cumpleaños (${age} ${age === 1 ? 'año' : 'años'})`,
                  `Birthday (${age} ${age === 1 ? 'year' : 'years'} old)`
                ),
                description: t(`¡Felicitar a su tutor ${p.ownerName}!`, `Congratulate owner ${p.ownerName}!`),
                icon: Cake,
                colorClass: 'text-purple-500 bg-purple-50 border-purple-200'
              });
            }
          }
        });

        allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
        setEvents(allEvents);
      } catch (error) {
        console.error('Failed to load upcoming events', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadEvents();
  }, [patients, getAllVaccines, getAllConsultations, getAllSurgeries, lang]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(intlLocale, { 
      day: '2-digit', month: 'short', year: 'numeric' 
    }).format(date);
  };

  const getRelativeDayInfo = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);
    
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { label: t('Hoy', 'Today'), isUrgent: true };
    if (diffDays === 1) return { label: t('Mañana', 'Tomorrow'), isUrgent: true };
    if (diffDays < 0) return { label: t('Atrasado', 'Overdue'), isUrgent: false };
    return { label: t(`En ${diffDays} días`, `In ${diffDays} days`), isUrgent: false };
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col items-center p-4 md:p-container-padding antialiased">
      <header className="w-full max-w-4xl flex items-center justify-between mb-8 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="!p-3">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h2 className="font-display text-headline-lg md:text-display text-on-background m-0">
            {t('Próximos Eventos', 'Upcoming Events')}
          </h2>
        </div>
      </header>

      <main className="w-full max-w-4xl z-10">
        <div className="bg-surface-container rounded-[32px] p-4 md:p-stack-padding shadow-sm min-h-[500px]">
          <div className="mb-8">
            <h3 className="font-headline-md text-on-surface m-0 mb-2">{t('Próximos 30 días', 'Next 30 days')}</h3>
            <p className="font-body-md text-on-surface-variant m-0">
              {t('Vista consolidada de vacunas, controles y cumpleaños.', 'Consolidated view of vaccines, follow-ups, and birthdays.')}
            </p>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center text-outline">{t('Calculando eventos...', 'Calculating events...')}</div>
          ) : events.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-outline border border-dashed border-outline-variant rounded-2xl bg-surface-container-lowest">
              <Calendar className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-body-lg m-0">
                {t('No hay eventos programados para los próximos 30 días.', 'No events scheduled for the next 30 days.')}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {events.map((event) => {
                const Icon = event.icon;
                const { label: daysRemaining, isUrgent } = getRelativeDayInfo(event.date);

                return (
                  <article 
                    key={event.id} 
                    onClick={() => navigate(`/patient/${event.patientId}`)}
                    className={`bg-surface-container-lowest border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all cursor-pointer group ${isUrgent ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-outline-variant hover:border-primary hover:shadow-md'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shadow-sm ${event.colorClass}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-headline-sm text-on-surface flex items-center gap-2">
                          {event.patientName}
                          {isUrgent && <AlertCircle className="w-4 h-4 text-primary" />}
                        </span>
                        <span className="font-body-md text-on-surface-variant font-medium">{event.title}</span>
                        <span className="font-body-sm text-on-surface-variant">{event.description}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 md:border-l border-surface-variant pt-4 md:pt-0 md:pl-6">
                      <div className="flex flex-col md:items-end">
                        <span className={`font-headline-sm ${isUrgent ? 'text-primary font-bold' : 'text-primary'}`}>{daysRemaining}</span>
                        <span className="font-body-sm text-on-surface-variant flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {formatDate(event.date)}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-outline group-hover:text-primary transition-colors" />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
