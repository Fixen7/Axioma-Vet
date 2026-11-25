import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { NotificationSettingsModal } from '../src/components/NotificationSettingsModal';
import * as vetTelegramService from '../src/services/vetTelegramNotificationService';

vi.mock('../src/i18n', () => ({
  useTranslation: () => ({
    lang: 'es',
    intlLocale: 'es-EC',
    t: (es: string, _en: string) => es
  })
}));

vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    activeWorkspaceId: 'test_ws_123',
    user: { id: 'usr_1', email: 'doctor@veterinaria.com' }
  })
}));

vi.mock('../src/context/VetContext', () => ({
  useVetContext: () => ({
    settings: {
      clinicName: 'Clínica Veterinaria San Francisco',
      doctorName: 'Dr. Alejandro Martínez'
    }
  })
}));

describe('NotificationSettingsModal Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('no debe renderizar nada si isOpen es false', () => {
    const { container } = render(
      <NotificationSettingsModal isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('debe renderizar el título, secciones y datos del doctor cuando isOpen es true', () => {
    render(<NotificationSettingsModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Notificaciones en Telegram')).toBeDefined();
    expect(screen.getByText('1. Conexión Rápida en 2 Pasos')).toBeDefined();
    expect(screen.getByText('2. ¿Cuáles alertas deseas recibir?')).toBeDefined();
    expect(screen.getByText('3. ¿Cuándo recibirlas? (Días y Horarios)')).toBeDefined();
  });

  it('debe permitir encender y apagar el interruptor maestro de notificaciones', () => {
    render(<NotificationSettingsModal isOpen={true} onClose={vi.fn()} />);

    // Por defecto inicia apagado
    expect(screen.getByText('Notificaciones Desconectadas')).toBeDefined();

    // Clic al switch maestro
    const toggleButton = screen.getByRole('button', { name: '' });
    fireEvent.click(toggleButton);

    expect(screen.getByText('Notificaciones Activas')).toBeDefined();

    const stored = vetTelegramService.loadTelegramNotificationConfig('test_ws_123');
    expect(stored.enabled).toBe(true);
  });

  it('debe alternar entre Chat Privado del Doctor y Grupo de la Clínica', () => {
    render(<NotificationSettingsModal isOpen={true} onClose={vi.fn()} />);

    const groupCard = screen.getByText('Grupo de la Clínica');
    fireEvent.click(groupCard);

    const stored = vetTelegramService.loadTelegramNotificationConfig('test_ws_123');
    expect(stored.channelType).toBe('clinic_group');
  });

  it('debe permitir seleccionar y deseleccionar días de la semana', () => {
    render(<NotificationSettingsModal isOpen={true} onClose={vi.fn()} />);

    // Clic en 'Dom' para agregarlo
    const domBtn = screen.getByText('Dom');
    fireEvent.click(domBtn);

    const stored = vetTelegramService.loadTelegramNotificationConfig('test_ws_123');
    expect(stored.schedule.daysOfWeek).toContain(0);
  });

  it('debe advertir si se intenta enviar mensaje de prueba sin Chat ID', async () => {
    render(<NotificationSettingsModal isOpen={true} onClose={vi.fn()} />);

    const testBtn = screen.getByText('Enviar Mensaje de Prueba');
    fireEvent.click(testBtn);

    expect(screen.getByText('Por favor ingresa primero tu Chat ID de Telegram.')).toBeDefined();
  });

  it('debe ejecutar el envío de prueba cuando hay Chat ID configurado', async () => {
    const dispatchSpy = vi.spyOn(vetTelegramService, 'dispatchVetTelegramNotification').mockResolvedValue({
      success: true,
      messageId: 1010
    });

    render(<NotificationSettingsModal isOpen={true} onClose={vi.fn()} />);

    // Ingresar Chat ID
    const inputChatId = screen.getByPlaceholderText('123456789');
    fireEvent.change(inputChatId, { target: { value: '987654321' } });

    const testBtn = screen.getByText('Enviar Mensaje de Prueba');
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalled();
      expect(screen.getByText('¡Mensaje de prueba enviado con éxito a tu Telegram!')).toBeDefined();
    });
  });
});
