import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../src/context/AuthContext';
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

// Mock pkce utils
vi.mock('../src/utils/pkce', () => ({
  generateCodeVerifier: vi.fn(() => 'mock_verifier'),
  generateCodeChallenge: vi.fn(async () => 'mock_challenge'),
}));

describe('AuthProvider / Auth Flow PKCE', () => {
  let oldWindowLocation: any;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    
    oldWindowLocation = window.location;
    delete (window as any).location;
    window.location = { ...oldWindowLocation, href: '', pathname: '/', search: '' };
    global.fetch = vi.fn();
  });

  afterEach(() => {
    window.location = oldWindowLocation;
  });

  it('Caso C: Ya hay sesión válida -> Continua normalmente', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { access_token: 'fake', user: { id: '1' } } }
    });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        user: { name: 'Test' },
        organization: { id: 'org_1', name: 'Org 1' },
        entitlements: ['vet'],
        access: true // Para simplificar el doble fetch en AuthContext
      })
    });

    render(
      <AuthProvider>
        <div>Aplicación Vet Lista</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Aplicación Vet Lista')).toBeInTheDocument();
    });
  });

  it('Caso A: Hay ticket en URL y exchange es exitoso', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
    
    // Configuramos URL con ticket
    window.location.search = '?ticket=abc1234';
    sessionStorage.setItem('pkce_verifier', 'my_verifier');

    // Fetch al exchange de Core (primera llamada)
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'tokenA', refresh_token: 'tokenR' })
    });

    // Fetches subsiguientes para contexto de la app
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        user: { name: 'Test' },
        organization: { id: 'org_1', name: 'Org 1' },
        entitlements: ['vet'],
        access: true
      })
    });

    // Simulamos que setSession y el siguiente getSession devuelven la sesión
    (supabase.auth.setSession as any).mockResolvedValue({ data: { session: {} } });
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { access_token: 'tokenA', user: { id: '1' } } }
    });

    render(
      <AuthProvider>
        <div>Aplicación Vet Lista</div>
      </AuthProvider>
    );

    await waitFor(() => {
      // Verifica que hizo fetch al exchange
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/internal/auth/exchange'), expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ ticket: 'abc1234', code_verifier: 'my_verifier' })
      }));
      // Verifica limpieza de storage y URL
      expect(sessionStorage.getItem('pkce_verifier')).toBeNull();
      // No podemos probar window.history.replaceState fácilmente en jsdom sin setup extra, pero vemos que continua
    });
  });

  it('Caso B: No hay ticket ni sesión -> Redirige a Core con PKCE challenge', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });

    render(
      <AuthProvider>
        <div>App</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(sessionStorage.getItem('pkce_verifier')).toBe('mock_verifier');
      expect(window.location.href).toContain('challenge=mock_challenge');
    });
  });

  it('Exchange falla (401) -> Elimina estados y redirige', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
    
    window.location.search = '?ticket=abc1234';
    sessionStorage.setItem('pkce_verifier', 'my_verifier');

    // Fetch falla
    (global.fetch as any).mockResolvedValueOnce({ ok: false, status: 401 });

    render(
      <AuthProvider>
        <div>App</div>
      </AuthProvider>
    );

    await waitFor(() => {
      // Debe haber limpiado y eventualmente iniciado Caso B
      expect(sessionStorage.getItem('pkce_verifier')).toBe('mock_verifier'); // OJO: Lo limpia y luego el Caso B lo vuelve a generar
      expect(window.location.href).toContain('challenge=mock_challenge');
    });
  });
});
