import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/services/supabase';

// Mock Supabase
vi.mock('../src/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      setSession: vi.fn(),
      signOut: vi.fn()
    }
  }
}));

// Mock coreAccessClient
vi.mock('../src/services/coreAccessClient', () => ({
  getModuleAccessStatus: vi.fn(async () => ({
    application: 'vet',
    access: {
      allowed: true,
      source: 'trial',
      expiresAt: null,
      daysRemaining: 7
    },
    commercial: {
      phase: 'trial_active',
      headline: null,
      message: null,
      cta: null
    }
  }))
}));

// Mock pkce utils
vi.mock('../src/utils/pkce', () => ({
  generateCodeVerifier: vi.fn(() => 'mock_verifier'),
  generateCodeChallenge: vi.fn(async () => 'mock_challenge'),
}));

function ConsumerHelper() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Cargando auth...</div>;
  if (!user) return <div>Sin usuario logueado</div>;
  return <div>Aplicación Vet Lista</div>;
}

describe('AuthProvider / Auth Flow PKCE', () => {
  let oldWindowLocation: any;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    
    oldWindowLocation = window.location;
    delete (window as any).location;
    window.location = { ...oldWindowLocation, href: 'http://localhost:3000/', pathname: '/', search: '', origin: 'http://localhost:3000' };
    global.fetch = vi.fn();
  });

  afterEach(() => {
    window.location = oldWindowLocation;
  });

  it('Caso C: Ya hay sesión válida -> Continua normalmente', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { access_token: 'fake', user: { id: '1', email: 'vet@axiomadynamics.com' } } }
    });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        user: { name: 'Dr. Test', email: 'vet@axiomadynamics.com' },
        organization: { id: 'org_1', name: 'Clínica San José' },
        entitlements: ['vet'],
        access: { allowed: true }
      })
    });

    render(
      <AuthProvider>
        <ConsumerHelper />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Aplicación Vet Lista')).toBeInTheDocument();
    });
  });

  it('Caso A: Hay ticket en URL y exchange es exitoso', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
    
    window.location.search = '?ticket=abc1234';
    sessionStorage.setItem('pkce_verifier', 'my_verifier');

    // Fetch al exchange de Core (primera llamada)
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'tokenA', refreshToken: 'tokenR', workspaceId: 'org_1' })
    });

    // Fetch a /api/me/context
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        user: { name: 'Dr. Test' },
        organization: { id: 'org_1', name: 'Clínica San José' },
        entitlements: ['vet'],
        access: { allowed: true }
      })
    });

    // Simulamos que setSession y el siguiente getSession devuelven la sesión
    (supabase.auth.setSession as any).mockResolvedValue({ data: { session: {} } });
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { access_token: 'tokenA', user: { id: '1' } } }
    });

    render(
      <AuthProvider>
        <ConsumerHelper />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/internal/auth/exchange'), expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ ticket: 'abc1234', code_verifier: 'my_verifier' })
      }));
      expect(sessionStorage.getItem('pkce_verifier')).toBeNull();
    });
  });

  it('Caso B: No hay ticket ni sesión -> Queda en estado no autenticado', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });

    render(
      <AuthProvider>
        <ConsumerHelper />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sin usuario logueado')).toBeInTheDocument();
    });
  });

  it('Exchange falla (401) -> Limpia ticket y queda no autenticado', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
    
    window.location.search = '?ticket=abc1234';
    sessionStorage.setItem('pkce_verifier', 'my_verifier');

    // Fetch de exchange falla con 401
    (global.fetch as any).mockResolvedValueOnce({ ok: false, status: 401 });

    render(
      <AuthProvider>
        <ConsumerHelper />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(sessionStorage.getItem('pkce_verifier')).toBeNull();
      expect(screen.getByText('Sin usuario logueado')).toBeInTheDocument();
    });
  });
});
