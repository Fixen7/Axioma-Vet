import { createBrowserClient } from '@supabase/ssr';

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

const cookieDomain = import.meta.env.VITE_COOKIE_DOMAIN;

// Inicializamos el cliente apuntando al schema 'vet'
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'vet',
  },
  ...(cookieDomain ? { cookieOptions: { domain: cookieDomain } } : {}),
});

