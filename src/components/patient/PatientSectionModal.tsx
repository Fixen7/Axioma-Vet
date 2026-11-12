import React, { useEffect } from 'react';
import { X, type LucideIcon } from 'lucide-react';

interface PatientSectionModalProps {
  isOpen: boolean;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  onClose: () => void;
  closeLabel: string;
  children: React.ReactNode;
}

/**
 * Responsive modal container for patient clinical sections across desktop, tablet, and mobile viewports.
 */
export function PatientSectionModal({
  isOpen,
  title,
  subtitle,
  icon: Icon,
  onClose,
  closeLabel,
  children,
}: PatientSectionModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 md:p-6 animate-in fade-in duration-200 print:static print:inset-auto print:bg-transparent print:p-0 print:block"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-section-modal-title"
        className="bg-surface-container-lowest text-on-surface w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-outline-variant/40 flex flex-col max-h-[92dvh] sm:max-h-[88dvh] overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 print:max-h-none print:overflow-visible print:rounded-none print:border-none print:shadow-none print:bg-white"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4 border-b border-surface-container-high bg-surface-container-low/60 shrink-0 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/15">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="patient-section-modal-title"
                className="font-display text-lg sm:text-xl font-bold text-on-surface m-0 truncate"
              >
                {title}
              </h2>
              <p className="text-xs text-on-surface-variant m-0 truncate">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 md:p-7 overflow-y-auto overflow-x-hidden flex-1 overscroll-contain print:p-0 print:overflow-visible">
          {children}
        </div>
      </div>
    </div>
  );
}
