import {
  type ClinicTelegramNotificationConfig,
  type ClinicNotificationSchedule,
  type NotificationTriggerType,
  DEFAULT_TELEGRAM_NOTIFICATION_CONFIG
} from './telegramNotificationTypes';

export * from './telegramNotificationTypes';

const STORAGE_PREFIX = 'axioma_vet_telegram_config_';

/**
 * Returns the effective Bot Token to use.
 * Precedence: User-configured custom token -> VITE_VET_TELEGRAM_BOT_TOKEN env var -> Axioma default bot.
 */
export function getEffectiveBotToken(customToken?: string): string {
  if (customToken && customToken.trim()) {
    return customToken.trim();
  }
  return (import.meta as any).env?.VITE_VET_TELEGRAM_BOT_TOKEN || '9028028768:AAGqjKsqN9awZ4vfNzaYK4UoKqUXm1dpKgE';
}

/**
 * Loads the clinic/doctor Telegram notification configuration.
 * Scoped by workspaceId (clinic tenant).
 */
export function loadTelegramNotificationConfig(workspaceId?: string | null): ClinicTelegramNotificationConfig {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_TELEGRAM_NOTIFICATION_CONFIG };
  }

  const key = `${STORAGE_PREFIX}${workspaceId || 'default'}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ...DEFAULT_TELEGRAM_NOTIFICATION_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_TELEGRAM_NOTIFICATION_CONFIG,
      ...parsed,
      triggers: {
        ...DEFAULT_TELEGRAM_NOTIFICATION_CONFIG.triggers,
        ...(parsed.triggers || {})
      },
      schedule: {
        ...DEFAULT_TELEGRAM_NOTIFICATION_CONFIG.schedule,
        ...(parsed.schedule || {})
      }
    };
  } catch (e) {
    console.error('[TelegramService] Error loading config from storage:', e);
    return { ...DEFAULT_TELEGRAM_NOTIFICATION_CONFIG };
  }
}

/**
 * Saves the clinic/doctor Telegram notification configuration.
 */
export function saveTelegramNotificationConfig(
  config: ClinicTelegramNotificationConfig,
  workspaceId?: string | null
): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const key = `${STORAGE_PREFIX}${workspaceId || 'default'}`;
  try {
    localStorage.setItem(key, JSON.stringify(config));
  } catch (e) {
    console.error('[TelegramService] Error saving config to storage:', e);
  }
}

/**
 * Validates if a notification should be delivered right now according to the schedule.
 */
export function isWithinNotificationSchedule(
  schedule: ClinicNotificationSchedule,
  currentDate = new Date()
): boolean {
  const currentDay = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ...
  if (!schedule.daysOfWeek.includes(currentDay)) {
    return false;
  }

  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
  
  const [startH, startM] = schedule.startTime.split(':').map(Number);
  const [endH, endM] = schedule.endTime.split(':').map(Number);
  
  const startMinutes = (startH || 0) * 60 + (startM || 0);
  const endMinutes = (endH || 0) * 60 + (endM || 0);

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

export interface SendNotificationOptions {
  type: NotificationTriggerType | 'test';
  clinicName: string;
  patientName?: string;
  species?: string;
  ownerName?: string;
  ownerPhone?: string;
  details?: string;
  date?: string;
  time?: string;
  summaryItems?: Array<{ title: string; count: number | string }>;
  forceIgnoreSchedule?: boolean; // For manual test messages
}

export interface SendNotificationResult {
  success: boolean;
  messageId?: number;
  error?: string;
  skippedReason?: 'disabled' | 'missing_chat_id' | 'missing_token' | 'trigger_inactive' | 'outside_schedule';
}

/**
 * Sends a clinical or test notification to the configured Telegram chat.
 */
export async function dispatchVetTelegramNotification(
  payload: SendNotificationOptions,
  configOverride?: ClinicTelegramNotificationConfig,
  workspaceId?: string | null
): Promise<SendNotificationResult> {
  const config = configOverride || loadTelegramNotificationConfig(workspaceId);

  // 1. Check if enabled (unless it's a test)
  if (payload.type !== 'test' && !config.enabled) {
    return { success: false, skippedReason: 'disabled' };
  }

  // 2. Check if Chat ID is configured
  if (!config.chatId || !config.chatId.trim()) {
    return { success: false, error: 'No Telegram Chat ID configurado.', skippedReason: 'missing_chat_id' };
  }

  // 3. Check trigger preference
  if (payload.type !== 'test') {
    if (payload.type === 'appointment_reminder' && !config.triggers.appointments) {
      return { success: false, skippedReason: 'trigger_inactive' };
    }
    if (payload.type === 'vaccine_alert' && !config.triggers.vaccines) {
      return { success: false, skippedReason: 'trigger_inactive' };
    }
    if (payload.type === 'critical_patient' && !config.triggers.criticalPatients) {
      return { success: false, skippedReason: 'trigger_inactive' };
    }
    if (payload.type === 'daily_digest' && !config.triggers.dailyDigest) {
      return { success: false, skippedReason: 'trigger_inactive' };
    }
  }

  // 4. Check schedule (critical alerts and test messages bypass schedule)
  if (payload.type !== 'test' && payload.type !== 'critical_patient' && !payload.forceIgnoreSchedule) {
    if (!isWithinNotificationSchedule(config.schedule)) {
      return { success: false, skippedReason: 'outside_schedule' };
    }
  }

  // 5. Check Bot Token
  const token = getEffectiveBotToken(config.botToken);
  if (!token) {
    return {
      success: false,
      error: 'Bot Token no configurado. Ingresa un Bot Token propio o define VITE_VET_TELEGRAM_BOT_TOKEN.',
      skippedReason: 'missing_token'
    };
  }

  // 6. Build Message HTML
  let text = '';
  switch (payload.type) {
    case 'appointment_reminder':
      text = `🐾 <b>Recordatorio de Cita Médica</b>\n` +
             `🏥 <b>Clínica:</b> ${payload.clinicName}\n` +
             `🐶 <b>Paciente:</b> ${payload.patientName || 'N/A'} (${payload.species || 'Mascota'})\n` +
             `👤 <b>Tutor:</b> ${payload.ownerName || 'N/A'}${payload.ownerPhone ? ' - ' + payload.ownerPhone : ''}\n` +
             `📅 <b>Fecha:</b> ${payload.date || 'Hoy'}\n` +
             `⏰ <b>Hora:</b> ${payload.time || 'Programada'}\n` +
             (payload.details ? `📝 <b>Motivo:</b> ${payload.details}\n` : '') +
             `\n<i>Enviado automáticamente por Axioma Vet</i>`;
      break;

    case 'vaccine_alert':
      text = `💉 <b>Alerta de Vacuna / Desparasitación</b>\n` +
             `🏥 <b>Clínica:</b> ${payload.clinicName}\n` +
             `🐶 <b>Paciente:</b> ${payload.patientName || 'N/A'}\n` +
             `👤 <b>Tutor:</b> ${payload.ownerName || 'N/A'}\n` +
             `📌 <b>Dosis/Biológico:</b> ${payload.details || 'Vacuna programada'}\n` +
             `📅 <b>Fecha de Aplicación:</b> ${payload.date || 'Próxima'}\n` +
             `\n<i>Enviado automáticamente por Axioma Vet</i>`;
      break;

    case 'critical_patient':
      text = `🚨 <b>ALERTA CLÍNICA: Paciente Prioritario</b>\n` +
             `🏥 <b>Clínica:</b> ${payload.clinicName}\n` +
             `🐾 <b>Paciente:</b> ${payload.patientName || 'N/A'}\n` +
             `⚠️ <b>Estado:</b> ${payload.details || 'Revisión urgente requerida'}\n` +
             `\n<i>Monitoreo Clínico Axioma Vet</i>`;
      break;

    case 'daily_digest':
      text = `📊 <b>Resumen Diario de la Clínica</b>\n` +
             `🏥 <b>Clínica:</b> ${payload.clinicName}\n` +
             `📅 <b>Fecha:</b> ${payload.date || new Date().toLocaleDateString('es-EC')}\n\n`;
      if (payload.summaryItems && payload.summaryItems.length > 0) {
        payload.summaryItems.forEach(item => {
          text += `• <b>${item.title}:</b> ${item.count}\n`;
        });
      } else {
        text += payload.details || 'Agenda del día lista para revisión.\n';
      }
      text += `\n<i>Que tengas una excelente jornada médica. Axioma Vet</i>`;
      break;

    case 'test':
    default:
      text = `🔔 <b>¡Conexión Exitosa con Axioma Vet!</b>\n\n` +
             `🏥 <b>Clínica:</b> ${payload.clinicName}\n` +
             `👤 <b>Destinatario:</b> ${config.recipientLabel || (config.channelType === 'clinic_group' ? 'Grupo Clínica' : 'Doctor')}\n` +
             `📱 <b>Canal:</b> ${config.channelType === 'clinic_group' ? 'Grupo de la Clínica 👥' : 'Chat Privado del Doctor 🩺'}\n` +
             `⏰ <b>Horario activo:</b> ${config.schedule.startTime} - ${config.schedule.endTime}\n` +
             `📅 <b>Días:</b> ${config.schedule.daysOfWeek.map(d => ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d]).join(', ')}\n\n` +
             `✅ <i>Las notificaciones de citas, vacunas y alertas clínicas llegarán a este chat según tus preferencias configuradas.</i>`;
      break;
  }

  // 7. Send Request to Telegram Bot API
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId.trim(),
        text,
        parse_mode: 'HTML',
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      const errMsg = data.description || 'Error devuelto por la API de Telegram';
      return { success: false, error: errMsg };
    }

    return { success: true, messageId: data.result?.message_id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error de red al conectar con Telegram' };
  }
}

// Backwards-compatible export
export { dispatchVetTelegramNotification as sendVetTelegramNotification };
