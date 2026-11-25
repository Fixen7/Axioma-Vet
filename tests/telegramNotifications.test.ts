import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isWithinNotificationSchedule,
  loadTelegramNotificationConfig,
  saveTelegramNotificationConfig,
  dispatchVetTelegramNotification,
  DEFAULT_TELEGRAM_NOTIFICATION_CONFIG,
  type ClinicTelegramNotificationConfig
} from '../src/services/vetTelegramNotificationService';

describe('vetTelegramNotificationService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('isWithinNotificationSchedule', () => {
    it('debe validar correctamente si el día actual está permitido', () => {
      const schedule = {
        daysOfWeek: [1, 2, 3, 4, 5], // Lun a Vie
        startTime: '08:00',
        endTime: '20:00',
        dailyDigestTime: '08:00'
      };

      // Domingo (0)
      const sunday = new Date('2026-11-22T10:00:00');
      expect(isWithinNotificationSchedule(schedule, sunday)).toBe(false);

      // Lunes a las 10:00 (1)
      const mondayIn = new Date('2026-11-23T10:00:00');
      expect(isWithinNotificationSchedule(schedule, mondayIn)).toBe(true);
    });

    it('debe validar correctamente los rangos horarios', () => {
      const schedule = {
        daysOfWeek: [1, 2, 3, 4, 5],
        startTime: '08:00',
        endTime: '18:00',
        dailyDigestTime: '08:00'
      };

      // Lunes a las 07:30 (Antes del inicio)
      const mondayEarly = new Date('2026-11-23T07:30:00');
      expect(isWithinNotificationSchedule(schedule, mondayEarly)).toBe(false);

      // Lunes a las 18:01 (Después del fin)
      const mondayLate = new Date('2026-11-23T18:01:00');
      expect(isWithinNotificationSchedule(schedule, mondayLate)).toBe(false);

      // Lunes a las 12:00 (Dentro)
      const mondayNoon = new Date('2026-11-23T12:00:00');
      expect(isWithinNotificationSchedule(schedule, mondayNoon)).toBe(true);
    });
  });

  describe('Storage de configuración', () => {
    it('debe cargar configuración por defecto si localStorage está vacío', () => {
      const config = loadTelegramNotificationConfig('ws_123');
      expect(config.enabled).toBe(false);
      expect(config.chatId).toBe('');
      expect(config.triggers.appointments).toBe(true);
    });

    it('debe guardar y recuperar la configuración de un workspace específico', () => {
      const customConfig: ClinicTelegramNotificationConfig = {
        ...DEFAULT_TELEGRAM_NOTIFICATION_CONFIG,
        enabled: true,
        chatId: '-100123456789',
        channelType: 'clinic_group',
        recipientLabel: 'Guardia Veterinaria Central',
        triggers: {
          appointments: true,
          vaccines: false,
          criticalPatients: true,
          dailyDigest: true
        }
      };

      saveTelegramNotificationConfig(customConfig, 'ws_clinic_a');
      const loaded = loadTelegramNotificationConfig('ws_clinic_a');

      expect(loaded.enabled).toBe(true);
      expect(loaded.chatId).toBe('-100123456789');
      expect(loaded.channelType).toBe('clinic_group');
      expect(loaded.triggers.vaccines).toBe(false);
      expect(loaded.triggers.criticalPatients).toBe(true);
    });
  });

  describe('dispatchVetTelegramNotification', () => {
    it('debe omitir el envío si el servicio está deshabilitado para eventos normales', async () => {
      const config: ClinicTelegramNotificationConfig = {
        ...DEFAULT_TELEGRAM_NOTIFICATION_CONFIG,
        enabled: false,
        chatId: '12345'
      };

      const result = await dispatchVetTelegramNotification({
        type: 'appointment_reminder',
        clinicName: 'Clínica San Roque',
        patientName: 'Bobby'
      }, config);

      expect(result.success).toBe(false);
      expect(result.skippedReason).toBe('disabled');
    });

    it('debe omitir si el trigger específico está apagado', async () => {
      const config: ClinicTelegramNotificationConfig = {
        ...DEFAULT_TELEGRAM_NOTIFICATION_CONFIG,
        enabled: true,
        chatId: '12345',
        triggers: {
          ...DEFAULT_TELEGRAM_NOTIFICATION_CONFIG.triggers,
          vaccines: false
        }
      };

      const result = await dispatchVetTelegramNotification({
        type: 'vaccine_alert',
        clinicName: 'Clínica San Roque',
        patientName: 'Michi'
      }, config);

      expect(result.success).toBe(false);
      expect(result.skippedReason).toBe('trigger_inactive');
    });

    it('debe enviar la petición a la API de Telegram cuando los datos son válidos', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, result: { message_id: 9999 } })
      });
      vi.stubGlobal('fetch', fetchMock);

      const config: ClinicTelegramNotificationConfig = {
        ...DEFAULT_TELEGRAM_NOTIFICATION_CONFIG,
        enabled: true,
        botToken: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
        chatId: '987654321',
        channelType: 'private_doctor'
      };

      const result = await dispatchVetTelegramNotification({
        type: 'test',
        clinicName: 'Clínica Los Andes'
      }, config);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe(9999);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('https://api.telegram.org/bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11/sendMessage');
      const body = JSON.parse(options.body);
      expect(body.chat_id).toBe('987654321');
      expect(body.text).toContain('¡Conexión Exitosa con Axioma Vet!');
    });

    it('los pacientes críticos deben enviarse incluso fuera de horario de atención médica', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, result: { message_id: 8888 } })
      });
      vi.stubGlobal('fetch', fetchMock);

      const config: ClinicTelegramNotificationConfig = {
        ...DEFAULT_TELEGRAM_NOTIFICATION_CONFIG,
        enabled: true,
        botToken: 'token_valido',
        chatId: '987654321',
        schedule: {
          daysOfWeek: [1, 2, 3, 4, 5],
          startTime: '08:00',
          endTime: '12:00', // Termina a las 12:00
          dailyDigestTime: '08:00'
        }
      };

      const result = await dispatchVetTelegramNotification({
        type: 'critical_patient',
        clinicName: 'Clínica Los Andes',
        patientName: 'Thor',
        details: 'Shock anafiláctico'
      }, config);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe(8888);
    });
  });
});
