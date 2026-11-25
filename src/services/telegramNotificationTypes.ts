/**
 * Types and interfaces for the Veterinary Telegram Notification System in Axioma Vet.
 */

export type NotificationChannelType = 'private_doctor' | 'clinic_group';

export type NotificationTriggerType = 
  | 'appointment_reminder'
  | 'vaccine_alert'
  | 'critical_patient'
  | 'daily_digest';

export interface ClinicNotificationSchedule {
  /** Days of the week when notifications are delivered (0 = Sunday, 1 = Monday, ... 6 = Saturday) */
  daysOfWeek: number[]; // e.g. [1, 2, 3, 4, 5, 6] (Lun - Sáb)
  /** Start time for notifications (HH:mm format, 24h) */
  startTime: string; // e.g. "08:00"
  /** End time for notifications (HH:mm format, 24h) */
  endTime: string; // e.g. "20:00"
  /** Time of day to receive the Daily Digest (HH:mm) */
  dailyDigestTime: string; // e.g. "08:00"
}

export interface ClinicTelegramNotificationConfig {
  /** Master toggle to enable or disable all Telegram notifications */
  enabled: boolean;
  
  /** Telegram bot token (custom or fallback to clinic default) */
  botToken?: string;

  /** Target Telegram Chat ID (doctor's private chat ID or clinic group ID) */
  chatId: string;

  /** Channel type */
  channelType: NotificationChannelType;

  /** Name or title of the doctor or clinic group receiving alerts */
  recipientLabel: string;

  /** Active notification categories configured by the doctor/clinic */
  triggers: {
    /** Appointments & Schedule: new appointments, next-day or 1h reminders */
    appointments: boolean;
    /** Vaccines & Deworming: upcoming due dates and reinforcements */
    vaccines: boolean;
    /** Critical Patients: alerts when patient status changes to HIGH_RISK or observation */
    criticalPatients: boolean;
    /** Daily Clinic Digest: morning overview of consultations and procedures */
    dailyDigest: boolean;
  };

  /** Schedule and quiet hours */
  schedule: ClinicNotificationSchedule;

  /** Timestamp of the last successful test message or sync */
  lastTestedAt?: string;
  lastTestStatus?: 'success' | 'error';
  lastErrorMessage?: string;
}

export const DEFAULT_TELEGRAM_NOTIFICATION_CONFIG: ClinicTelegramNotificationConfig = {
  enabled: false,
  botToken: '',
  chatId: '',
  channelType: 'private_doctor',
  recipientLabel: '',
  triggers: {
    appointments: true,
    vaccines: true,
    criticalPatients: true,
    dailyDigest: true,
  },
  schedule: {
    daysOfWeek: [1, 2, 3, 4, 5, 6], // Lunes a Sábado
    startTime: '08:00',
    endTime: '20:00',
    dailyDigestTime: '08:00',
  },
};
