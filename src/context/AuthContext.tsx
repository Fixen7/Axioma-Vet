import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { getModuleAccessStatus } from '../services/coreAccessClient';
import type { ModuleAccessStatus } from '../services/coreAccessClient';

interface AuthContextType {
  user: User | null;
  coreUser: { name: string; email: string; avatarUrl: string | null } | null;
  session: Session | null;
  activeWorkspaceId: string | null;
  activeWorkspace: { id: string; name: string } | null;
  moduleAccess: ModuleAccessStatus | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [coreUser, setCoreUser] = useState<AuthContextType['coreUser']>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<AuthContextType['activeWorkspace']>(null);
  const [moduleAccess, setModuleAccess] = useState<ModuleAccessStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [hasStockAccess, setHasStockAccess] = useState(false);

  const isPublicRoute = window.location.pathname === '/login';

  const checkContextAndSetUser = async (currentSession: Session | null) => {
    if (!currentSession) {
      setSession(null);
      setUser(null);
      setCoreUser(null);
      setActiveWorkspace(null);
      setModuleAccess(null);
      setIsLoading(false);
      return;
    }

    try {
      const coreUrl = import.meta.env.VITE_CORE_URL;
      const response = await fetch(`${coreUrl}/api/me/context`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setCoreUser(null);
          setActiveWorkspace(null);
        }
        throw new Error('Error fetching context');
      }

      const data = await response.json();
      if (data.user) {
        setCoreUser(data.user);
      }
      
      const hasStockAccess = data.entitlements && data.entitlements.includes("stock");
      setHasStockAccess(hasStockAccess);

      if (!data.organization?.id && currentSession?.user) {
        window.location.href = `${coreUrl}/onboarding?app=vet&returnTo=${encodeURIComponent(window.location.href)}`;
        return;
      }

      let vetAccessStatus = null;
      let hasVetAccess = false;

      if (data.organization?.id) {
        try {
          vetAccessStatus = await getModuleAccessStatus(data.organization.id, 'vet');
          hasVetAccess = vetAccessStatus.access;
        } catch (e) {
          // Si Core falla, denegamos el acceso por seguridad (no hacer fallback ciego)
          hasVetAccess = false;
        }
      }

      if (hasVetAccess && data.organization?.id) {
        setAccessDenied(false);
        setActiveWorkspaceId(data.organization.id);
        setActiveWorkspace({ id: data.organization.id, name: data.organization.name });
        setModuleAccess(vetAccessStatus);
        setSession(currentSession);
        setUser(currentSession.user);
      } else {
        setAccessDenied(true);
        setActiveWorkspaceId(null);
        setActiveWorkspace(null);
        setModuleAccess(null);
        setSession(null);
        setUser(null);
        setCoreUser(null);
      }
    } catch (e) {
      console.error(e);
      setAccessDenied(true);
      setSession(null);
      setUser(null);
      setCoreUser(null);
      setActiveWorkspace(null);
      setModuleAccess(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // 1. Check for tokens in URL hash (Session passthrough from Core)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        // Clear the URL immediately to prevent token leakage
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        }).then(({ data, error }) => {
          if (!error && data.session && isMounted) {
            checkContextAndSetUser(data.session);
          }
        }).catch(() => {
          // Silent catch
        });
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) checkContextAndSetUser(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) checkContextAndSetUser(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // 1. Limpiar caches y almacenamiento local
    localStorage.clear();
    sessionStorage.clear();
    // 2. Limpiar sesión de supabase local
    await supabase.auth.signOut();
    // 3. Redirigir a Core para cerrar la sesión centralizada
    const coreUrl = import.meta.env.VITE_CORE_URL;
    window.location.href = `${coreUrl}/api/auth/logout?returnTo=${encodeURIComponent(window.location.origin + '/login')}`;
  };

  const value = {
    user,
    coreUser,
    session,
    activeWorkspaceId,
    activeWorkspace,
    moduleAccess,
    isLoading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoading && !isPublicRoute ? (
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : accessDenied && !isPublicRoute ? (
        <div className="min-h-screen flex items-center justify-center bg-surface p-4">
          <div className="max-w-md w-full bg-surface-container rounded-3xl p-8 shadow-xl text-center border border-outline-variant">
            <h2 className="text-2xl font-bold text-on-surface mb-2">Acceso Denegado</h2>
            <p className="text-on-surface-variant mb-8">
              Tu cuenta Axioma está activa, pero Axioma Vet no está habilitado para ninguno de tus espacios de trabajo.
            </p>
            <div className="space-y-3">
              {hasStockAccess && (
                <button 
                  onClick={() => {
                      const stockUrl = import.meta.env.VITE_STOCK_URL;
                      window.location.href = stockUrl;
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-on-primary font-semibold py-3 rounded-xl transition-colors"
                >
                  Ir a Axioma Stock
                </button>
              )}
              <button 
                onClick={() => {
                    const coreUrl = import.meta.env.VITE_CORE_URL;
                    window.location.href = `${coreUrl}/organization`;
                }}
                className="w-full bg-surface-variant hover:bg-surface-variant/80 text-on-surface-variant font-semibold py-3 rounded-xl transition-colors"
              >
                Gestionar mi cuenta Axioma
              </button>
              <button 
                onClick={signOut}
                className="w-full bg-transparent hover:bg-surface-variant text-outline font-semibold py-3 rounded-xl transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
