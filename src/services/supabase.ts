import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase.');
}

if (import.meta.env.VITE_AXIOMA_ENV === 'development') {
  if (import.meta.env.VITE_SUPABASE_ENV !== 'local' || supabaseUrl.includes('supabase.co')) {
    throw new Error('¡PELIGRO CRÍTICO! Intentando conectar a entorno de Producción en modo de Desarrollo. Abortando.');
  }
}

const customFetch = (url: RequestInfo | URL, options?: RequestInit) => {
  const workspaceId = typeof window !== 'undefined' ? window.localStorage.getItem('axioma-vet-workspace') : null;
  const headers = new Headers(options?.headers);
  if (workspaceId) {
    headers.set('x-workspace-id', workspaceId);
  }
  return fetch(url, { ...options, headers });
};

// Inicializamos el cliente apuntando al schema 'vet'
// Al ser una SPA, usamos createClient estándar con localStorage propio
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'vet',
  },
  auth: {
    autoRefreshToken: false,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'axioma-vet-auth',
  },
  global: {
    fetch: customFetch
  }
});


