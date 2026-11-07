import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { GlobalErrorBoundary } from '../src/components/GlobalErrorBoundary';
import { telemetry } from '../src/services/telemetry';

// Component that throws on demand
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Fallo crítico simulado en render de paciente');
  }
  return <div>Contenido Clínico Seguro</div>;
}

describe('GlobalErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on console.error to avoid cluttering test output with React's expected error boundary logs
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('debe renderizar los componentes hijos cuando no hay errores', () => {
    render(
      <GlobalErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('Contenido Clínico Seguro')).toBeInTheDocument();
  });

  it('debe interceptar el error en render, mostrar pantalla de rescate y reportar a telemetría', () => {
    const captureSpy = vi.spyOn(telemetry, 'captureException').mockResolvedValue({} as any);

    render(
      <GlobalErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </GlobalErrorBoundary>
    );

    // Debe mostrar la UI de rescate
    expect(screen.getByText('Interrupción en la vista clínica')).toBeInTheDocument();
    expect(screen.getByText(/Tus datos están a salvo/i)).toBeInTheDocument();
    expect(screen.getByText('Recargar pantalla')).toBeInTheDocument();
    expect(screen.getByText('Ir al inicio')).toBeInTheDocument();

    // Debe haber reportado la excepción a telemetría universal
    expect(captureSpy).toHaveBeenCalledTimes(1);
    const [capturedError, context, category, severity] = captureSpy.mock.calls[0];
    expect(capturedError).toBeInstanceOf(Error);
    expect((capturedError as Error).message).toBe('Fallo crítico simulado en render de paciente');
    expect(category).toBe('ui');
    expect(severity).toBe('critical');
    expect(context?.componentStack).toBeDefined();
  });

  it('debe permitir ver detalles técnicos del incidente y copiar diagnóstico', async () => {
    render(
      <GlobalErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </GlobalErrorBoundary>
    );

    const toggleButton = screen.getByText('Detalles técnicos del incidente');
    fireEvent.click(toggleButton);

    // Debe mostrar el mensaje del error en los detalles técnicos
    expect(screen.getByText('Fallo crítico simulado en render de paciente')).toBeInTheDocument();
    expect(screen.getByText('Copiar')).toBeInTheDocument();
  });

  it('debe aceptar un fallback personalizado si se le proporciona', () => {
    render(
      <GlobalErrorBoundary fallback={<div>Fallback Personalizado de Rescate</div>}>
        <ThrowingComponent shouldThrow={true} />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('Fallback Personalizado de Rescate')).toBeInTheDocument();
  });
});
