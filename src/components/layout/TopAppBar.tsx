import { ArrowLeft, Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface TopAppBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

export function TopAppBar({ title, subtitle, showBack = true }: TopAppBarProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

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
        <button className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-95 text-on-surface-variant">
          <Bell className="w-6 h-6" />
        </button>
        <button 
          onClick={handleSignOut}
          title="Cerrar sesión"
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-red-50 hover:text-red-500 transition-colors active:scale-95 text-on-surface-variant"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
