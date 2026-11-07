import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AxiomaTelemetry } from '../src/services/telemetry';

describe('AxiomaTelemetry Service', () => {
  let telemetry: AxiomaTelemetry;

  beforeEach(() => {
    telemetry = new AxiomaTelemetry();
    telemetry.init({
      appId: 'test-app',
      environment: 'test',
      telegram: { enabled: false }
    });
  });

  it('debe registrar y formatear eventos de telemetría correctamente', async () => {
    const event = await telemetry.track('Evento de Prueba', {
      severity: 'info',
      category: 'general',
      context: { foo: 'bar' }
    });

    expect(event.title).toBe('Evento de Prueba');
    expect(event.severity).toBe('info');
    expect(event.context).toEqual({ foo: 'bar' });
    expect(event.appId).toBe('test-app');
    expect(event.environment).toBe('test');

    const recent = telemetry.getRecentEvents();
    expect(recent.length).toBeGreaterThan(0);
    expect(recent[0].title).toBe('Evento de Prueba');
  });

  it('debe capturar excepciones adecuadamente', async () => {
    const error = new Error('Fallo crítico simulado en base de datos');
    const event = await telemetry.reportDatabaseError('select_patients', error, { table: 'patients' });

    expect(event.category).toBe('database');
    expect(event.severity).toBe('critical');
    expect(event.message).toContain('Fallo crítico simulado');
    expect(event.context?.operation).toBe('select_patients');
  });

  it('debe registrar reportes de bugs de usuario', async () => {
    const event = await telemetry.reportUserBug('Botón roto', 'No responde al clic', { userId: 'usr_123' });

    expect(event.category).toBe('user_report');
    expect(event.severity).toBe('warning');
    expect(event.title).toBe('Botón roto');
    expect(event.message).toBe('No responde al clic');
    expect(event.context?.userId).toBe('usr_123');
  });
});
