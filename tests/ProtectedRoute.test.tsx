import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../src/context/AuthContext';
import { ProtectedRoute } from '../src/components/auth/ProtectedRoute';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import * as authContextModule from '../src/context/AuthContext';

// Mock simple para los tests de ProtectedRoute aislada
vi.mock('../src/context/AuthContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

describe('ProtectedRoute', () => {
  const { useAuth } = authContextModule as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe mostrar cargando si isLoading es true', () => {
    useAuth.mockReturnValue({ isLoading: true, user: null });
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Contenido Protegido</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
  });

  it('debe redirigir a /login si no hay usuario', () => {
    useAuth.mockReturnValue({ isLoading: false, user: null });
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><div>Contenido Protegido</div></ProtectedRoute>} />
          <Route path="/login" element={<div>Página de Login</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Página de Login')).toBeInTheDocument();
  });

  it('debe renderizar hijos si hay usuario', () => {
    useAuth.mockReturnValue({ isLoading: false, user: { id: '123' } });
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Contenido Protegido</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('Contenido Protegido')).toBeInTheDocument();
  });
});
