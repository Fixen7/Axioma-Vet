import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Clock, ArrowRight, ShieldAlert } from 'lucide-react';
import { useTranslation } from '../../i18n';

export function CommercialBanner() {
  const { moduleAccess } = useAuth();
  const { es, t } = useTranslation();

  if (!moduleAccess || !moduleAccess.commercial) {
    return null;
  }

  const { phase } = moduleAccess.commercial;
  const daysRemaining = moduleAccess.access?.daysRemaining ?? null;
  const coreUrl = import.meta.env.VITE_CORE_URL;

  if (phase === 'subscription_active') {
    return null;
  }

  if (phase === 'trial_active') {
    const count = daysRemaining ?? 7;
    return (
      <aside aria-label={t('Aviso comercial', 'Commercial notice')} className="bg-indigo-900 text-indigo-50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm font-medium border-b border-indigo-700/50 shadow-sm z-40 relative">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-300 flex-shrink-0 animate-pulse" />
          <span>
            {es ? (
              <>
                <strong>Prueba gratuita activa:</strong> Te {count === 1 ? 'queda' : 'quedan'}{' '}
                <span className="font-bold text-white bg-indigo-700/80 px-2 py-0.5 rounded-full">
                  {count} {count === 1 ? 'día' : 'días'}
                </span>{' '}
                de acceso completo en este espacio de trabajo.
              </>
            ) : (
              <>
                <strong>Free trial active:</strong> You have{' '}
                <span className="font-bold text-white bg-indigo-700/80 px-2 py-0.5 rounded-full">
                  {count} {count === 1 ? 'day' : 'days'}
                </span>{' '}
                of full access remaining in this workspace.
              </>
            )}
          </span>
        </div>
        <a
          href={`${coreUrl}/store?app=vet`}
          className="inline-flex items-center gap-1.5 bg-white text-indigo-950 font-bold px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm whitespace-nowrap cursor-pointer text-xs"
        >
          <span>{t('Elegir un plan', 'Choose a plan')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </aside>
    );
  }

  if (phase === 'trial_expiring') {
    const count = daysRemaining ?? 1;
    return (
      <aside aria-label={t('Aviso comercial', 'Commercial notice')} className="bg-amber-600 text-amber-50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm font-medium border-b border-amber-700 shadow-sm z-40 relative">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-200 flex-shrink-0" />
          <span>
            {es ? (
              <>
                <strong>Tu prueba termina pronto:</strong> Te {count === 1 ? 'queda sólo' : 'quedan sólo'}{' '}
                <span className="font-bold text-white bg-amber-800/80 px-2 py-0.5 rounded-full">
                  {count} {count === 1 ? 'día' : 'días'}
                </span>. Adquiere tu suscripción para no perder acceso a tus historias clínicas.
              </>
            ) : (
              <>
                <strong>Your trial ends soon:</strong> Only{' '}
                <span className="font-bold text-white bg-amber-800/80 px-2 py-0.5 rounded-full">
                  {count} {count === 1 ? 'day' : 'days'}
                </span>{' '}
                left. Subscribe now to keep access to your clinical records.
              </>
            )}
          </span>
        </div>
        <a
          href={`${coreUrl}/store?app=vet`}
          className="inline-flex items-center gap-1.5 bg-white text-amber-950 font-bold px-3 py-1 rounded-lg hover:bg-amber-50 transition-colors shadow-sm whitespace-nowrap cursor-pointer text-xs"
        >
          <span>{t('Suscribirme ahora', 'Subscribe now')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </aside>
    );
  }

  if (phase === 'subscription_past_due' || phase === 'subscription_unpaid') {
    return (
      <aside aria-label={t('Aviso comercial', 'Commercial notice')} className="bg-red-600 text-red-50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm font-medium border-b border-red-700 shadow-sm z-40 relative">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-200 flex-shrink-0" />
          <span>
            {es ? (
              <>
                <strong>Atención con tu suscripción:</strong> Hubo un problema al renovar el pago. Regulariza tu método de pago para evitar la suspensión.
              </>
            ) : (
              <>
                <strong>Attention with your subscription:</strong> There was an issue renewing your payment. Update your payment method to avoid suspension.
              </>
            )}
          </span>
        </div>
        <a
          href={`${coreUrl}/organization`}
          className="inline-flex items-center gap-1.5 bg-white text-red-950 font-bold px-3 py-1 rounded-lg hover:bg-red-50 transition-colors shadow-sm whitespace-nowrap cursor-pointer text-xs"
        >
          <span>{t('Actualizar método de pago', 'Update payment method')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </aside>
    );
  }

  return null;
}
