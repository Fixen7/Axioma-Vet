import { ShieldCheck, ArrowRight } from 'lucide-react';
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { getModuleAccessStatus } from '../services/coreAccessClient';
import type { ModuleAccessStatus } from '../services/coreAccessClient';
import { telemetry } from '../services/telemetry';
import { syncCoreLanguagePreference, useTranslation } from '../i18n';
import type { WorkspaceMemberProfile } from '../services/types';

interface AuthContextType {
  user: User | null;
  coreUser: { name: string; email: string; avatarUrl: string | null } | null;
  session: Session | null;
  activeWorkspaceId: string | null;
  activeWorkspace: { id: string; name: string; deletionScheduledAt?: string | null; deletedAt?: string | null } | null;
  workspaceMembers: WorkspaceMemberProfile[];
  resolveMemberLabel: (userId?: string | null) => string;
  moduleAccess: ModuleAccessStatus | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [coreUser, setCoreUser] = useState<AuthContextType['coreUser']>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<AuthContextType['activeWorkspace']>(null);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMemberProfile[]>([]);
  const [moduleAccess, setModuleAccess] = useState<ModuleAccessStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [hasStockAccess, setHasStockAccess] = useState(false);

  const isPublicRoute = window.location.pathname === '/login';

  const checkContextAndSetUser = async (currentSession: Session | null) => {
    if (!currentSession) {
      telemetry.setUser(null);
      telemetry.setWorkspace(null);
      setSession(null);
      setUser(null);
      setCoreUser(null);
      setActiveWorkspace(null);
      setWorkspaceMembers([]);
      setModuleAccess(null);
      setIsLoading(false);
      return;
    }

    try {
      telemetry.setUser({ id: currentSession.user.id, email: currentSession.user.email });
      const coreUrl = import.meta.env.VITE_CORE_URL;
      const cachedWorkspaceId = localStorage.getItem('axioma-vet-workspace');
      const reqHeaders: Record<string, string> = {
        'Authorization': `Bearer ${currentSession.access_token}`
      };
      if (cachedWorkspaceId) {
        reqHeaders['x-workspace-id'] = cachedWorkspaceId;
      }

      const response = await fetch(`${coreUrl}/api/me/context`, {
        credentials: 'include',
        headers: reqHeaders
      });

      if (!response.ok) {
        telemetry.reportAuthError('fetch_context', new Error(`HTTP ${response.status} en /api/me/context`), { status: response.status });
        // Si Core devuelve 400 (token corrupto/invalido), 401 (no autorizado) o 403 (prohibido) tras un despliegue
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          await supabase.auth.signOut();
          localStorage.removeItem('axioma-vet-auth');
          localStorage.removeItem('axioma-vet-workspace');
          sessionStorage.clear();
          telemetry.setUser(null);
          telemetry.setWorkspace(null);
          setSession(null);
          setUser(null);
          setCoreUser(null);
          setActiveWorkspace(null);
          setModuleAccess(null);
          setAccessDenied(false);
          setIsLoading(false);
          if (window.location.pathname !== '/login') {
            window.location.href = '/login?session_expired=true';
          }
          return;
        }
        throw new Error('Error fetching context');
      }

      const data = await response.json();
      if (data.user) {
        setCoreUser(data.user);
      }
      setWorkspaceMembers(Array.isArray(data.workspaceMembers) ? data.workspaceMembers : []);
      syncCoreLanguagePreference(data.user?.language);
      
      const hasStockAccess = data.entitlements && data.entitlements.includes("stock");
      setHasStockAccess(hasStockAccess);

      const hasAnyOrg = !!data.organization?.id || (Array.isArray(data.organizations) && data.organizations.length > 0);
      if (!hasAnyOrg && currentSession?.user) {
        window.location.href = `${coreUrl}/onboarding?app=vet&returnTo=${encodeURIComponent(window.location.href)}`;
        return;
      }

      const activeOrg = data.organization || (Array.isArray(data.organizations) && data.organizations.length > 0 ? data.organizations[0] : null);
      if (activeOrg?.id) {
        localStorage.setItem('axioma-vet-workspace', activeOrg.id);
        telemetry.setWorkspace(activeOrg.id);
      }

      let vetAccessStatus = null;
      let hasVetAccess = false;

      if (activeOrg?.id) {
        try {
          vetAccessStatus = await getModuleAccessStatus(activeOrg.id, 'vet');
          hasVetAccess = !!vetAccessStatus?.access?.allowed;
        } catch (e) {
          // Si Core falla, denegamos el acceso por seguridad (no hacer fallback ciego)
          telemetry.reportAuthError('getModuleAccessStatus', e, { orgId: activeOrg.id });
          hasVetAccess = false;
        }
      }

      if (hasVetAccess && activeOrg?.id) {
        setAccessDenied(false);
        setActiveWorkspaceId(activeOrg.id);
        setActiveWorkspace({ 
          id: activeOrg.id, 
          name: activeOrg.name,
          deletionScheduledAt: activeOrg.deletionScheduledAt,
          deletedAt: activeOrg.deletedAt,
        });
        setModuleAccess(vetAccessStatus);
        setSession(currentSession);
        setUser(currentSession.user);
      } else {
        setAccessDenied(true);
        telemetry.track('Acceso a Axioma Vet no habilitado para la organización', {
          category: 'auth',
          severity: 'warning',
          context: { orgId: activeOrg?.id, orgName: activeOrg?.name }
        });
        setActiveWorkspaceId(activeOrg?.id || null);
        setActiveWorkspace(activeOrg ? { 
          id: activeOrg.id, 
          name: activeOrg.name,
          deletionScheduledAt: activeOrg.deletionScheduledAt,
          deletedAt: activeOrg.deletedAt,
        } : null);
        setModuleAccess(vetAccessStatus);
        setSession(currentSession);
        setUser(currentSession.user);
      }
    } catch (e) {
      console.error(e);
      telemetry.reportAuthError('checkContextAndSetUser_exception', e);
      setAccessDenied(false);
      setSession(null);
      setUser(null);
      setCoreUser(null);
      setActiveWorkspace(null);
      setWorkspaceMembers([]);
      setModuleAccess(null);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?session_expired=true';
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const handlePkceFlow = async () => {
      if (typeof window === 'undefined') return;

      const urlParams = new URLSearchParams(window.location.search);
      const ticket = urlParams.get('ticket');

      if (ticket) {
        setIsLoading(true);
        const codeVerifier = localStorage.getItem('axioma_pkce_verifier') || sessionStorage.getItem('pkce_verifier');
        if (codeVerifier) {
          try {
            const coreUrl = import.meta.env.VITE_CORE_URL;
            const res = await fetch(`${coreUrl}/api/internal/auth/exchange`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ticket, code_verifier: codeVerifier })
            });

            if (res.ok) {
              const { accessToken, refreshToken, workspaceId } = await res.json();
              if (workspaceId) {
                localStorage.setItem('axioma-vet-workspace', workspaceId);
              }
              await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
              
              sessionStorage.removeItem('pkce_verifier');
              localStorage.removeItem('axioma_pkce_verifier');
              window.history.replaceState(null, '', window.location.pathname);
              
              const { data } = await supabase.auth.getSession();
              if (data.session && isMounted) {
                await checkContextAndSetUser(data.session);
              }
              return;
            } else {
              telemetry.reportAuthError('pkce_exchange_failed', new Error(`HTTP ${res.status} en exchange de PKCE`), { ticket });
            }
          } catch (e) {
            console.error('Error in PKCE exchange', e);
            telemetry.reportAuthError('pkce_exchange_exception', e, { ticket });
          }
        }
        sessionStorage.removeItem('pkce_verifier');
        localStorage.removeItem('axioma_pkce_verifier');
        window.history.replaceState(null, '', window.location.pathname);
      }

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (isMounted) {
        checkContextAndSetUser(currentSession);
      }
    };
    
    handlePkceFlow();



    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const hasTicket = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('ticket');
      if (hasTicket && !session) return;
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

  const resolveMemberLabel = (userId?: string | null): string => {
    if (!userId) return '';
    const member = workspaceMembers.find((m) => m.id === userId);
    if (member) {
      return member.name || member.email || userId.slice(0, 8);
    }
    if (user?.id === userId) {
      return coreUser?.name || coreUser?.email || user.email || userId.slice(0, 8);
    }
    return `ID ${userId.slice(0, 8)}`;
  };

  const value = {
    user,
    coreUser,
    session,
    activeWorkspaceId,
    activeWorkspace,
    workspaceMembers,
    resolveMemberLabel,
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
          <div className="max-w-lg w-full bg-surface-container rounded-3xl p-8 shadow-2xl text-center border border-outline-variant/60">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary mx-auto mb-6 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-on-surface mb-2 font-display">
              {moduleAccess?.commercial?.phase === 'trial_expired'
                ? t('Tu periodo de prueba ha finalizado', 'Your free trial has ended')
                : moduleAccess?.commercial?.phase === 'subscription_past_due' || moduleAccess?.commercial?.phase === 'subscription_unpaid'
                  ? t('Suscripción pendiente de pago', 'Subscription payment past due')
                  : t('Acceso a Axioma Vet', 'Access to Axioma Vet')}
            </h2>

            <p className="text-on-surface-variant mb-6 text-sm leading-relaxed">
              {moduleAccess?.commercial?.phase === 'trial_expired'
                ? t(
                    `Esperamos que hayas disfrutado tus 7 días de prueba. Para continuar registrando historias clínicas y pacientes en ${activeWorkspace?.name || 'tu clínica'}, activa tu plan.`,
                    `We hope you enjoyed your 7-day free trial. To continue recording clinical histories and patients in ${activeWorkspace?.name || 'your clinic'}, please activate a plan.`
                  )
                : moduleAccess?.commercial?.phase === 'subscription_past_due' || moduleAccess?.commercial?.phase === 'subscription_unpaid'
                  ? t(
                      'No pudimos procesar la renovación de tu suscripción. Regulariza tu método de pago para reanudar el acceso.',
                      'We could not process your subscription renewal. Please update your payment method to resume access.'
                    )
                  : t(
                      `Axioma Vet no está activo para el espacio de trabajo "${activeWorkspace?.name || 'seleccionado'}". Adquiere un plan para habilitarlo de inmediato.`,
                      `Axioma Vet is not active for the "${activeWorkspace?.name || 'selected'}" workspace. Purchase a plan to enable it right away.`
                    )}
            </p>

            <div className="space-y-3">
              <button 
                onClick={() => {
                  const coreUrl = import.meta.env.VITE_CORE_URL;
                  window.location.href = `${coreUrl}/store?app=vet`;
                }}
                className="w-full bg-primary hover:bg-primary/90 text-on-primary font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('Ver Planes y Suscribirme (Desde $15/mes)', 'View Plans & Subscribe (From $15/mo)')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {hasStockAccess && (
                <button 
                  onClick={() => {
                      const stockUrl = import.meta.env.VITE_STOCK_URL;
                      window.location.href = stockUrl;
                  }}
                  className="w-full bg-surface-variant hover:bg-surface-variant/80 text-on-surface-variant font-semibold py-3 rounded-xl transition-colors cursor-pointer"
                >
                  {t('Ir a Axioma Stock', 'Go to Axioma Stock')}
                </button>
              )}

              <button 
                onClick={() => {
                  const coreUrl = import.meta.env.VITE_CORE_URL;
                  window.location.href = `${coreUrl}/organization`;
                }}
                className="w-full bg-surface-variant hover:bg-surface-variant/80 text-on-surface-variant font-semibold py-3 rounded-xl transition-colors cursor-pointer"
              >
                {t('Gestionar mi cuenta Axioma', 'Manage my Axioma account')}
              </button>

              <button 
                onClick={signOut}
                className="w-full bg-transparent hover:bg-surface-variant/50 text-outline font-semibold py-2.5 rounded-xl transition-colors cursor-pointer text-sm"
              >
                {t('Cerrar sesión', 'Sign out')}
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

