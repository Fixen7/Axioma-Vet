import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CommercialBanner } from '../layout/CommercialBanner';
import { RouteLoadingFallback } from '../ui/RouteLoadingFallback';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const hasTicket = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('ticket');

  if (isLoading || hasTicket) {
    return <RouteLoadingFallback message="Iniciando sesión..." />;
  }

  if (!user) {
    return <Navigate to={`/login${location.search}`} replace />;
  }

  return (
    <>
      <CommercialBanner />
      {children}
    </>
  );
}
