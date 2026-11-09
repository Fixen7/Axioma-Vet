import React from 'react';

export const RouteLoadingFallback: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-4 max-w-xs text-center">
        {/* Animated Brand Pill with Soft Pulse */}
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center shadow-xs">
            <svg 
              className="w-7 h-7 text-indigo-600 animate-spin" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Cargando Axioma Vet...</h3>
          <p className="text-xs text-slate-400">Preparando datos clínicos y herramientas</p>
        </div>
      </div>
    </div>
  );
};
