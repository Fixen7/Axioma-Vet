import { createClient } from '@supabase/supabase-js';
import { telemetry } from './telemetry';

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

const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  const workspaceId = typeof window !== 'undefined' ? window.localStorage.getItem('axioma-vet-workspace') : null;
  const headers = new Headers(options?.headers);
  if (workspaceId) {
    headers.set('x-workspace-id', workspaceId);
  }

  const urlStr = typeof url === 'string' ? url : url.toString();

  try {
    const res = await fetch(url, { ...options, headers });
    // Si la respuesta es un error 4xx o 5xx de Supabase (excluyendo 401 que maneja Auth)
    if (!res.ok && res.status !== 401) {
      const cloned = res.clone();
      cloned.json().then((body) => {
        telemetry.reportDatabaseError(`HTTP ${res.status} en ${urlStr.split('?')[0]}`, new Error(body?.message || `Error Supabase ${res.status}`), {
          status: res.status,
          statusText: res.statusText,
          url: urlStr,
          workspaceId,
          errorBody: body
        });
      }).catch(() => {
        // En caso de que no sea JSON
        telemetry.reportDatabaseError(`HTTP ${res.status} en ${urlStr.split('?')[0]}`, new Error(`Error Supabase ${res.status}`), {
          status: res.status,
          statusText: res.statusText,
          url: urlStr,
          workspaceId
        });
      });
    }
    return res;
  } catch (netErr) {
    telemetry.captureException(netErr, { url: urlStr, workspaceId, type: 'network_failure' }, 'network', 'critical');
    throw netErr;
  }
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


