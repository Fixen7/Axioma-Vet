/**
 * Axioma Vet - End-User Telegram Notification Service
 * 
 * Separate instance dedicated exclusively to clinic staff and veterinarians
 * for patient alerts, appointment reminders, and clinical notifications.
 * (The developer alerts instance @Axioma_Taxes_bot is isolated for infra/payment approvals).
 */

const VET_CLIENT_BOT_TOKEN = (import.meta as any).env?.VITE_VET_TELEGRAM_BOT_TOKEN || '9028028768:AAHbISh0m3W_Xs4vlRnK-sOxZvWoJEgx6h8';

export interface TelegramNotificationPayload {
  chatId: string;
  type: 'appointment_reminder' | 'vaccine_alert' | 'critical_patient' | 'test';
  clinicName: string;
  patientName?: string;
  species?: string;
  ownerName?: string;
  ownerPhone?: string;
  details?: string;
  date?: string;
  time?: string;
}

/**
 * Sends a notification message to the clinic's configured Telegram Chat ID.
 */
export async function sendVetTelegramNotification(payload: TelegramNotificationPayload): Promise<{ success: boolean; messageId?: number; error?: string }> {
  if (!payload.chatId) {
    return { success: false, error: 'No Telegram Chat ID configured for this clinic.' };
  }

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

    case 'test':
    default:
      text = `🔔 <b>¡Conexión Exitosa con Axioma Vet!</b>\n` +
             `🏥 <b>Clínica:</b> ${payload.clinicName}\n` +
             `✅ El sistema de notificaciones de Telegram para usuarios finales ha sido verificado correctamente.\n` +
             `📅 <b>Fecha:</b> ${new Date().toLocaleString('es-EC')}\n` +
             `\n<i>Tu equipo recibirá alertas de citas, vacunas y pacientes directamente en este chat.</i>`;
      break;
  }

  try {
    const url = `https://api.telegram.org/bot${VET_CLIENT_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: payload.chatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { success: false, error: data.description || 'Error al comunicarse con Telegram API' };
    }

    return { success: true, messageId: data.result?.message_id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error de red al conectar con Telegram' };
  }
}
