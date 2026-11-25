import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';
import { ReleaseNotesButton } from '../ReleaseNotesModal';
import { NotificationSettingsModal } from '../NotificationSettingsModal';
import { loadTelegramNotificationConfig } from '../../services/vetTelegramNotificationService';

interface TopAppBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

export function TopAppBar({ title, subtitle, showBack = true }: TopAppBarProps) {
  const navigate = useNavigate();
  const { signOut, activeWorkspaceId } = useAuth();
  const { t } = useTranslation();
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isTelegramEnabled, setIsTelegramEnabled] = useState(false);

  useEffect(() => {
    const cfg = loadTelegramNotificationConfig(activeWorkspaceId);
    setIsTelegramEnabled(cfg.enabled && !!cfg.chatId);
  }, [activeWorkspaceId, isNotifModalOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <header className="glass-header w-full sticky top-0 z-50 flex justify-between items-center px-gutter py-4 print:hidden">
      <div className="flex items-center gap-4">
        {showBack && (
          <button 
            onClick={() => navigate(-1)}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-variant transition-colors group"
          >
            <ArrowLeft className="text-on-surface group-hover:text-primary transition-colors w-6 h-6" />
          </button>
        )}
        <div className="flex flex-col">
          <h1 className="font-display text-headline-md font-bold text-primary tracking-tight">{title}</h1>
          {subtitle && (
            <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ReleaseNotesButton className="!w-10 !h-10 !p-2" />
        <button 
          onClick={() => setIsNotifModalOpen(true)}
          title={t('Notificaciones en Telegram', 'Telegram Notifications')}
          aria-label="Abrir configuración de notificaciones"
          className="relative w-12 h-12 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-95 text-on-surface-variant"
        >
          <Bell className="w-6 h-6" />
          {isTelegramEnabled && (
            <span 
              title={t('Notificaciones activas', 'Notifications active')}
              className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" 
            />
          )}
        </button>
        <button 
          onClick={handleSignOut}
          title={t('Cerrar sesión', 'Sign out')}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-red-50 hover:text-red-500 transition-colors active:scale-95 text-on-surface-variant"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <NotificationSettingsModal 
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
      />
    </header>
  );
}
