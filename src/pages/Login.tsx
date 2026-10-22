import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Login() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);

  // Si ya está logueado, redirigir
  useEffect(() => {
    if (user && !isLoading) {
      navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleLogin = async () => {
    setIsConnecting(true);
    try {
      const { generateCodeVerifier, generateCodeChallenge } = await import('../utils/pkce');
      const verifier = generateCodeVerifier();
      sessionStorage.setItem('pkce_verifier', verifier);
      const challenge = await generateCodeChallenge(verifier);
      
      const currentAbsUrl = encodeURIComponent(window.location.origin + '/');
      const coreUrl = import.meta.env.VITE_CORE_URL;
      window.location.href = `${coreUrl}/api/auth/redirect-secure?challenge=${challenge}&returnTo=${currentAbsUrl}`;
    } catch (e) {
      console.error('Error al iniciar inicio de sesión con Core', e);
      setIsConnecting(false);
    }
  };

  // Si viene con el parametro sso=true, auto-conectar con Core
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sso') === 'true' && !user && !isLoading && !isConnecting) {
      handleLogin();
    }
  }, [user, isLoading, isConnecting]);

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 antialiased selection:bg-primary-container selection:text-on-primary-container relative overflow-hidden">
      
      {/* Elementos decorativos */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary-container/30 to-transparent"></div>
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-container opacity-[0.15] rounded-full blur-[100px]"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-secondary-container opacity-[0.15] rounded-full blur-[100px]"></div>

      <main className="w-full max-w-md z-10">
        <div className="bg-surface-container-lowest rounded-[32px] p-8 md:p-12 shadow-xl border border-outline-variant/30 text-center flex flex-col items-center">
          
          <div className="w-20 h-20 bg-primary-container text-on-primary-container rounded-3xl flex items-center justify-center shadow-inner mb-6">
            <Activity className="w-10 h-10" />
          </div>

          <h1 className="font-display text-display text-on-surface m-0 mb-2">Axioma-Vet</h1>
          <p className="font-body-lg text-on-surface-variant m-0 mb-8 max-w-[280px]">
            Sistema integral de gestión clínica veterinaria.
          </p>

          <div className="w-full flex flex-col gap-4">
            <Button 
              variant="primary" 
              onClick={handleLogin}
              disabled={isConnecting}
              className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 relative overflow-hidden shadow-md"
            >
              {isConnecting ? (
                <>
                  <Activity className="w-5 h-5 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="font-label-lg font-medium text-lg">Iniciar sesión con Axioma</span>
                </>
              )}
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-outline font-label-md">
            <ShieldCheck className="w-4 h-4" />
            <span>Acceso seguro mediante Axioma Core</span>
          </div>
        </div>

        <p className="text-center font-body-sm text-outline mt-6">
          © {new Date().getFullYear()} Axioma Dynamics
        </p>
      </main>
    </div>
  );
}

