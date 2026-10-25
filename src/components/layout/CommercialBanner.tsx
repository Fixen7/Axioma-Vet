import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Clock, ArrowRight, ShieldAlert } from 'lucide-react';

export function CommercialBanner() {
  const { moduleAccess } = useAuth();

  if (!moduleAccess || !moduleAccess.commercial) {
    return null;
  }

  const { phase } = moduleAccess.commercial;
  const daysRemaining = moduleAccess.access?.daysRemaining ?? null;
  const coreUrl = import.meta.env.VITE_CORE_URL;

  // No banner needed for active subscriptions without issues
  if (phase === 'subscription_active') {
    return null;
  }

  if (phase === 'trial_active') {
    return (
      <aside aria-label="Aviso comercial" className="bg-indigo-900 text-indigo-50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm font-medium border-b border-indigo-700/50 shadow-sm z-40 relative">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-300 flex-shrink-0 animate-pulse" />
          <span>
            <strong>Prueba gratuita activa:</strong> Te {daysRemaining === 1 ? 'queda' : 'quedan'}{' '}
            <span className="font-bold text-white bg-indigo-700/80 px-2 py-0.5 rounded-full">
              {daysRemaining ?? 7} {daysRemaining === 1 ? 'día' : 'días'}
            </span>{' '}
            de acceso completo en este espacio de trabajo.
          </span>
        </div>
        <a
          href={`${coreUrl}/store?app=vet`}
          className="inline-flex items-center gap-1.5 bg-white text-indigo-950 font-bold px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm whitespace-nowrap cursor-pointer text-xs"
        >
          <span>Elegir un plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </aside>
    );
  }

  if (phase === 'trial_expiring') {
    return (
      <aside aria-label="Aviso comercial" className="bg-amber-600 text-amber-50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm font-medium border-b border-amber-700 shadow-sm z-40 relative">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-200 flex-shrink-0" />
          <span>
            <strong>Tu prueba termina pronto:</strong> Te {daysRemaining === 1 ? 'queda sólo' : 'quedan sólo'}{' '}
            <span className="font-bold text-white bg-amber-800/80 px-2 py-0.5 rounded-full">
              {daysRemaining ?? 1} {daysRemaining === 1 ? 'día' : 'días'}
            </span>. Adquiere tu suscripción para no perder acceso a tus historias clínicas.
          </span>
        </div>
        <a
          href={`${coreUrl}/store?app=vet`}
          className="inline-flex items-center gap-1.5 bg-white text-amber-950 font-bold px-3 py-1 rounded-lg hover:bg-amber-50 transition-colors shadow-sm whitespace-nowrap cursor-pointer text-xs"
        >
          <span>Suscribirme ahora</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </aside>
    );
  }

  if (phase === 'subscription_past_due' || phase === 'subscription_unpaid') {
    return (
      <aside aria-label="Aviso comercial" className="bg-red-600 text-red-50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm font-medium border-b border-red-700 shadow-sm z-40 relative">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-200 flex-shrink-0" />
          <span>
            <strong>Atención con tu suscripción:</strong> Hubo un problema al renovar el pago. Regulariza tu método de pago para evitar la suspensión.
          </span>
        </div>
        <a
          href={`${coreUrl}/organization`}
          className="inline-flex items-center gap-1.5 bg-white text-red-950 font-bold px-3 py-1 rounded-lg hover:bg-red-50 transition-colors shadow-sm whitespace-nowrap cursor-pointer text-xs"
        >
          <span>Actualizar método de pago</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </aside>
    );
  }

  return null;
}
