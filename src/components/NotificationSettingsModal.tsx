import { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Users, 
  User, 
  ExternalLink,
  Power,
  Loader2,
  Sliders,
  Check
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { useVetContext } from '../context/VetContext';
import {
  type ClinicTelegramNotificationConfig,
  type NotificationChannelType,
  loadTelegramNotificationConfig,
  saveTelegramNotificationConfig,
  dispatchVetTelegramNotification
} from '../services/vetTelegramNotificationService';

const DAYS_OF_WEEK = [
  { id: 1, labelEs: 'Lun', labelEn: 'Mon' },
  { id: 2, labelEs: 'Mar', labelEn: 'Tue' },
  { id: 3, labelEs: 'Mié', labelEn: 'Wed' },
  { id: 4, labelEs: 'Jue', labelEn: 'Thu' },
  { id: 5, labelEs: 'Vie', labelEn: 'Fri' },
  { id: 6, labelEs: 'Sáb', labelEn: 'Sat' },
  { id: 0, labelEs: 'Dom', labelEn: 'Sun' }
];

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationSettingsModal({ isOpen, onClose }: NotificationSettingsModalProps) {
  const { lang, t } = useTranslation();
  const isEs = lang === 'es';
  const { activeWorkspaceId, user } = useAuth();
  const { settings } = useVetContext();

  const clinicName = settings?.clinicName || 'Axioma Vet';
  const doctorName = settings?.doctorName || user?.email?.split('@')[0] || 'Doctor';

  const [config, setConfig] = useState<ClinicTelegramNotificationConfig>(() => 
    loadTelegramNotificationConfig(activeWorkspaceId)
  );

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = loadTelegramNotificationConfig(activeWorkspaceId);
      if (!current.recipientLabel && doctorName) {
        current.recipientLabel = doctorName;
      }
      setConfig(current);
      setTestResult(null);
      setSaveStatus(null);
    }
  }, [isOpen, activeWorkspaceId, doctorName]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveTelegramNotificationConfig(config, activeWorkspaceId);
    setSaveStatus(t('Ajustes guardados con éxito', 'Settings saved successfully'));
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleToggleEnable = () => {
    const updated = { ...config, enabled: !config.enabled };
    setConfig(updated);
    saveTelegramNotificationConfig(updated, activeWorkspaceId);
  };

  const handleTriggerToggle = (key: keyof ClinicTelegramNotificationConfig['triggers']) => {
    const updated = {
      ...config,
      triggers: {
        ...config.triggers,
        [key]: !config.triggers[key]
      }
    };
    setConfig(updated);
    saveTelegramNotificationConfig(updated, activeWorkspaceId);
  };

  const handleDayToggle = (dayId: number) => {
    const exists = config.schedule.daysOfWeek.includes(dayId);
    let newDays = exists 
      ? config.schedule.daysOfWeek.filter(d => d !== dayId)
      : [...config.schedule.daysOfWeek, dayId];

    // Ensure at least one day is selected
    if (newDays.length === 0) newDays = [dayId];

    const updated = {
      ...config,
      schedule: {
        ...config.schedule,
        daysOfWeek: newDays
      }
    };
    setConfig(updated);
    saveTelegramNotificationConfig(updated, activeWorkspaceId);
  };

  const handleTestConnection = async () => {
    if (!config.chatId.trim()) {
      setTestResult({
        success: false,
        message: t('Por favor ingresa primero tu Chat ID de Telegram.', 'Please enter your Telegram Chat ID first.')
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await dispatchVetTelegramNotification({
        type: 'test',
        clinicName,
        forceIgnoreSchedule: true
      }, config, activeWorkspaceId);

      if (res.success) {
        setTestResult({
          success: true,
          message: t(
            '¡Mensaje de prueba enviado con éxito a tu Telegram!',
            'Test message successfully delivered to your Telegram!'
          )
        });
        const updated = {
          ...config,
          lastTestedAt: new Date().toISOString(),
          lastTestStatus: 'success' as const,
          lastErrorMessage: undefined
        };
        setConfig(updated);
        saveTelegramNotificationConfig(updated, activeWorkspaceId);
      } else {
        setTestResult({
          success: false,
          message: res.error || t('Error al conectar con Telegram API', 'Telegram API connection error')
        });
        const updated = {
          ...config,
          lastTestedAt: new Date().toISOString(),
          lastTestStatus: 'error' as const,
          lastErrorMessage: res.error
        };
        setConfig(updated);
        saveTelegramNotificationConfig(updated, activeWorkspaceId);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || t('Error inesperado de red', 'Unexpected network error')
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-headline" className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                {t('Notificaciones en Telegram', 'Telegram Notifications')}
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700">
                  {t('Doctores & Clínicas', 'Doctors & Clinics')}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {t('Configura dónde, cuáles y cuándo recibir tus alertas clínicas', 'Configure where, which, and when to receive your clinical alerts')}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-600">

          {/* 1. MASTER SWITCH & STATUS */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
                config.enabled ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-200 text-slate-500'
              }`}>
                <Power className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">
                  {config.enabled 
                    ? t('Notificaciones Activas', 'Notifications Active') 
                    : t('Notificaciones Desconectadas', 'Notifications Disconnected')}
                </p>
                <p className="text-xs text-slate-500">
                  {config.enabled 
                    ? t('Tu clínica recibirá alertas en Telegram según la configuración.', 'Your clinic will receive alerts on Telegram based on settings.')
                    : t('El envío de alertas hacia Telegram está pausado.', 'Dispatch of Telegram alerts is paused.')}
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleEnable}
              className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                config.enabled ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  config.enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 2. DÓNDE: DESTINO Y PASOS SIMPLES */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500" />
              {t('1. Conexión Rápida en 2 Pasos', '1. Quick 2-Step Connection')}
            </h3>

            {/* Canal Switch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div 
                onClick={() => {
                  const updated = { ...config, channelType: 'private_doctor' as NotificationChannelType };
                  setConfig(updated);
                  saveTelegramNotificationConfig(updated, activeWorkspaceId);
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  config.channelType === 'private_doctor'
                    ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/30'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {t('Chat Privado del Doctor', 'Doctor Private Chat')}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t('Para tus citas asignadas y pacientes directos.', 'For your assigned appointments and direct patients.')}
                  </p>
                </div>
              </div>

              <div 
                onClick={() => {
                  const updated = { ...config, channelType: 'clinic_group' as NotificationChannelType };
                  setConfig(updated);
                  saveTelegramNotificationConfig(updated, activeWorkspaceId);
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  config.channelType === 'clinic_group'
                    ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500/30'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {t('Grupo de la Clínica', 'Clinic Team Group')}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t('Alertas compartidas para todo el equipo de guardia.', 'Shared alerts for the whole on-duty staff.')}
                  </p>
                </div>
              </div>
            </div>

            {/* Guided Step 1 & 2 Cards */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-blue-100/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                      {config.channelType === 'private_doctor'
                        ? t('Abre nuestro Bot en Telegram e inicia chat', 'Open our Telegram Bot and tap start')
                        : t('Agrega el Bot a tu grupo de Telegram', 'Add the Bot to your Telegram group')}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {config.channelType === 'private_doctor'
                        ? t('Toca el botón azul para abrir @Axioma_Taxes_bot y presiona /start.', 'Tap the blue button to open @Axioma_Taxes_bot and press /start.')
                        : t('Busca @Axioma_Taxes_bot y agrégalo como miembro de tu grupo clínico.', 'Search @Axioma_Taxes_bot and add it as a member to your clinic group.')}
                    </p>
                  </div>
                </div>

                <a
                  href="https://t.me/Axioma_Taxes_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t('Abrir Telegram', 'Open Telegram')}</span>
                </a>
              </div>

              <div className="border-t border-blue-100/80 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                      {config.channelType === 'private_doctor'
                        ? t('Pega tu Chat ID personal de Telegram', 'Paste your personal Telegram Chat ID')
                        : t('Pega el ID del grupo de la clínica', 'Paste the clinic group ID')}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {t('¿No sabes cuál es tu ID? Toca', "Don't know your ID? Tap")}{' '}
                      <a 
                        href="https://t.me/userinfobot" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 font-semibold underline"
                      >
                        @userinfobot
                      </a>{' '}
                      {t('y copia el número que te entrega.', 'and copy the number it provides.')}
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-48 shrink-0">
                  <input
                    type="text"
                    value={config.chatId}
                    onChange={(e) => {
                      const updated = { ...config, chatId: e.target.value };
                      setConfig(updated);
                      saveTelegramNotificationConfig(updated, activeWorkspaceId);
                    }}
                    placeholder={config.channelType === 'clinic_group' ? '-100xxxxxxxxxx' : '123456789'}
                    className="w-full px-3 py-1.5 rounded-xl border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 text-xs font-mono placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Recipient Doctor Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('Nombre del Destinatario / Doctor (Opcional)', 'Recipient / Doctor Name (Optional)')}
              </label>
              <input
                type="text"
                value={config.recipientLabel}
                onChange={(e) => {
                  const updated = { ...config, recipientLabel: e.target.value };
                  setConfig(updated);
                  saveTelegramNotificationConfig(updated, activeWorkspaceId);
                }}
                placeholder={doctorName}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-xs placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* 3. CUÁLES: TIPOS DE NOTIFICACIONES */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-slate-500" />
              {t('2. ¿Cuáles alertas deseas recibir?', '2. Which alerts do you want to receive?')}
            </h3>

            <div className="space-y-2.5">
              {/* Citas y agenda */}
              <div 
                onClick={() => handleTriggerToggle('appointments')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-colors flex items-center justify-between ${
                  config.triggers.appointments ? 'bg-blue-50/30 border-blue-200' : 'bg-slate-50/50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                    config.triggers.appointments ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
                  }`}>
                    🐾
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      {t('Citas Médicas y Agenda', 'Medical Appointments & Schedule')}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t('Avisos de citas programadas, controles clínicos y cirugías del día.', 'Reminders for scheduled appointments, follow-ups, and surgeries.')}
                    </p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                  config.triggers.appointments ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {config.triggers.appointments && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>

              {/* Vacunas y desparasitaciones */}
              <div 
                onClick={() => handleTriggerToggle('vaccines')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-colors flex items-center justify-between ${
                  config.triggers.vaccines ? 'bg-emerald-50/30 border-emerald-200' : 'bg-slate-50/50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                    config.triggers.vaccines ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                  }`}>
                    💉
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      {t('Vacunas y Refuerzos Pendientes', 'Pending Vaccines & Boosters')}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t('Alertas de pacientes con dosis próximas a vencer para contactar al tutor.', 'Alerts for patients with upcoming due vaccines to contact owners.')}
                    </p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                  config.triggers.vaccines ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {config.triggers.vaccines && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>

              {/* Pacientes críticos */}
              <div 
                onClick={() => handleTriggerToggle('criticalPatients')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-colors flex items-center justify-between ${
                  config.triggers.criticalPatients ? 'bg-rose-50/30 border-rose-200' : 'bg-slate-50/50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                    config.triggers.criticalPatients ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-500'
                  }`}>
                    🚨
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      {t('Pacientes Críticos / Alto Riesgo', 'Critical / High-Risk Patients')}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t('Notificación inmediata cuando un paciente entra en estado crítico o urgencia.', 'Immediate alert when a patient status changes to high-risk or emergency.')}
                    </p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                  config.triggers.criticalPatients ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {config.triggers.criticalPatients && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>

              {/* Resumen diario */}
              <div 
                onClick={() => handleTriggerToggle('dailyDigest')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-colors flex items-center justify-between ${
                  config.triggers.dailyDigest ? 'bg-purple-50/30 border-purple-200' : 'bg-slate-50/50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                    config.triggers.dailyDigest ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-500'
                  }`}>
                    📊
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      {t('Resumen Diario de la Clínica', 'Daily Clinic Digest')}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t('Panorama matutino consolidado con la agenda del día y pacientes citados.', 'Morning summary with today schedule and booked patients.')}
                    </p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                  config.triggers.dailyDigest ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {config.triggers.dailyDigest && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
            </div>
          </div>

          {/* 4. CUÁNDO: HORARIOS Y DÍAS */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              {t('3. ¿Cuándo recibirlas? (Días y Horarios)', '3. When to receive them? (Days & Hours)')}
            </h3>

            {/* Selector de Días */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                {t('Días de atención con notificaciones activas:', 'Workdays with active notifications:')}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = config.schedule.daysOfWeek.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => handleDayToggle(day.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isSelected 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isEs ? day.labelEs : day.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rango Horario */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Desde (Hora inicio)', 'From (Start hour)')}
                </label>
                <input
                  type="time"
                  value={config.schedule.startTime}
                  onChange={(e) => {
                    const updated = {
                      ...config,
                      schedule: { ...config.schedule, startTime: e.target.value }
                    };
                    setConfig(updated);
                    saveTelegramNotificationConfig(updated, activeWorkspaceId);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Hasta (Hora cierre)', 'To (Closing hour)')}
                </label>
                <input
                  type="time"
                  value={config.schedule.endTime}
                  onChange={(e) => {
                    const updated = {
                      ...config,
                      schedule: { ...config.schedule, endTime: e.target.value }
                    };
                    setConfig(updated);
                    saveTelegramNotificationConfig(updated, activeWorkspaceId);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Hora Resumen Diario', 'Daily Digest Time')}
                </label>
                <input
                  type="time"
                  value={config.schedule.dailyDigestTime}
                  onChange={(e) => {
                    const updated = {
                      ...config,
                      schedule: { ...config.schedule, dailyDigestTime: e.target.value }
                    };
                    setConfig(updated);
                    saveTelegramNotificationConfig(updated, activeWorkspaceId);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-purple-700 bg-purple-50/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              {t('* Las alertas de Pacientes Críticos omiten el horario y se envían de forma inmediata por seguridad clínica.', '* Critical Patient alerts bypass closing hours and are delivered immediately for medical safety.')}
            </p>
          </div>

          {/* Test connection alert message */}
          {testResult && (
            <div className={`p-4 rounded-2xl border text-xs flex items-start gap-2.5 animate-fade-in ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{testResult.message}</p>
                {config.lastTestedAt && (
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {t('Último intento:', 'Last attempt:')} {new Date(config.lastTestedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200"
            >
              {isTesting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {isTesting 
                ? t('Enviando prueba...', 'Sending test...') 
                : t('Enviar Mensaje de Prueba', 'Send Test Message')}
            </button>
            {saveStatus && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-fade-in">
                <Check className="w-3.5 h-3.5" /> {saveStatus}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-medium text-xs transition-colors"
            >
              {t('Cerrar', 'Close')}
            </button>
            <button
              type="button"
              onClick={() => {
                handleSave();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-semibold text-xs shadow-md transition-all active:scale-95"
            >
              {t('Listo', 'Done')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
