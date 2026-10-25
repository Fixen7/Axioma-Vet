import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity } from 'lucide-react';
import { CommercialBanner } from '../layout/CommercialBanner';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const hasTicket = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('ticket');

  if (isLoading || hasTicket) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
        <Activity className="w-12 h-12 text-primary animate-pulse mb-4" />
        <p className="font-body-lg text-outline">Iniciando sesión...</p>
      </div>
    );
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
