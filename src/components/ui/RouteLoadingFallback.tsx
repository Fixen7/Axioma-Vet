import React from 'react';
import { useTranslation } from '../../i18n';

export const RouteLoadingFallback: React.FC<{ message?: string }> = ({ message }) => {
  const { t } = useTranslation();
  const displayMessage = message ?? t('Cargando módulo clínico...', 'Loading clinical module...');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="relative flex items-center justify-center mb-6">
        {/* Glowing concentric pulse rings */}
        <div className="absolute w-28 h-28 rounded-full bg-emerald-500/20 animate-ping"></div>
        <div className="absolute w-36 h-36 rounded-full border border-emerald-500/30 animate-spin" style={{ animationDuration: '7s' }}></div>
        <div className="absolute w-44 h-44 rounded-full border border-indigo-500/20 border-dashed animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }}></div>

        {/* Axioma Brand Emblem */}
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 transform transition-transform animate-pulse">
          <span className="font-black text-3xl tracking-tighter">A</span>
        </div>
      </div>

      <div className="flex flex-col items-center text-center">
        <h3 className="text-white font-extrabold text-lg tracking-wider">
          AXIOMA <span className="text-emerald-400 font-medium">DYNAMICS</span>
        </h3>
        <p className="text-slate-400 text-xs font-medium mt-1 animate-pulse">
          {displayMessage}
        </p>
      </div>
    </div>
  );
};
