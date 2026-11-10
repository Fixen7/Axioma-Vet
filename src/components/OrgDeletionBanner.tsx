import { useAuth } from '../context/AuthContext';

export function OrgDeletionBanner() {
  const { activeWorkspace } = useAuth();

  if (!activeWorkspace) return null;

  const isScheduledForDeletion = Boolean(activeWorkspace.deletionScheduledAt || activeWorkspace.deletedAt);
  if (!isScheduledForDeletion) return null;

  const deletionDate = activeWorkspace.deletionScheduledAt 
    ? new Date(activeWorkspace.deletionScheduledAt) 
    : (activeWorkspace.deletedAt ? new Date(new Date(activeWorkspace.deletedAt).getTime() + 7 * 24 * 60 * 60 * 1000) : null);

  const daysRemaining = deletionDate ? Math.max(1, Math.ceil((deletionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 7;
  const coreUrl = import.meta.env.VITE_CORE_URL || 'https://core.axiomadynamics.com';

  return (
    <aside aria-label="Alerta de eliminación de organización" className="bg-rose-600 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md z-40 sticky top-0 w-full animate-in fade-in duration-300">
      <div className="flex items-center gap-2.5">
        <span className="text-xl">⚠️</span>
        <p className="text-xs sm:text-sm font-semibold">
          Tu organización será eliminada en los próximos {daysRemaining} días (de acuerdo al contador), perderás el acceso y toda la información de tu empresa.
        </p>
      </div>
      <a
        href={`${coreUrl}/organization`}
        className="px-3.5 py-1.5 bg-white text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
      >
        Revisar o revertir acción →
      </a>
    </aside>
  );
}
