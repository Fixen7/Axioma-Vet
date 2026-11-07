import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ShieldAlert, RotateCcw, Home, MessageSquare, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { telemetry } from '../services/telemetry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error: Error; resetError: () => void }) => ReactNode);
  onCatch?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
  showDetails: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Enviar automáticamente a telemetría universal
    try {
      telemetry.captureException(
        error,
        {
          componentStack: errorInfo.componentStack,
          location: typeof window !== 'undefined' ? window.location.href : '',
        },
        'ui',
        'critical'
      );
    } catch (telemetryErr) {
      console.error('[GlobalErrorBoundary] Error reportando a telemetría:', telemetryErr);
    }

    if (this.props.onCatch) {
      this.props.onCatch(error, errorInfo);
    }
  }

  public resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
    });
  };

  public handleCopyDiagnostic = () => {
    const { error, errorInfo } = this.state;
    const diagnostic = [
      `Axioma Vet - Diagnóstico Clínico de UI`,
      `Fecha: ${new Date().toISOString()}`,
      `URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}`,
      `Error: ${error?.message || 'Error no especificado'}`,
      `Stack: ${error?.stack || 'N/A'}`,
      `Component Stack: ${errorInfo?.componentStack || 'N/A'}`
    ].join('\n\n');

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(diagnostic).then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2500);
      });
    }
  };

  public handleWhatsAppSupport = () => {
    const { error } = this.state;
    const msg = encodeURIComponent(
      `Hola equipo de soporte Axioma Vet, ocurrió un detalle técnico en mi clínica:\n\n*Error:* ${error?.message || 'Detalle en interfaz'}\n*URL:* ${typeof window !== 'undefined' ? window.location.href : ''}`
    );
    window.open(`https://wa.me/593964017615?text=${msg}`, '_blank');
  };

  public override render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({ error: this.state.error, resetError: this.resetError });
        }
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
          <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            
            {/* Soft Ambient Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              {/* Header Badge */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Axioma Vet</span>
                    <span className="text-slate-500 text-xs">• Resguardo de Sesión</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Interrupción en la vista clínica
                  </h1>
                </div>
              </div>

              {/* Patient Data Safe Notice */}
              <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-4 mb-6">
                <p className="text-xs sm:text-sm text-emerald-300 font-medium leading-relaxed">
                  🛡️ <strong>Tus datos están a salvo:</strong> El sistema protegió los expedientes y registros en la nube para prevenir inconsistencias. Este incidente fue reportado automáticamente vía telemetría.
                </p>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-950 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-white/5 active:scale-95 cursor-pointer text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Recargar pantalla
                </button>

                <button
                  type="button"
                  onClick={() => {
                    this.resetError();
                    window.location.href = '/';
                  }}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer text-sm border border-slate-700"
                >
                  <Home className="w-4 h-4" />
                  Ir al inicio
                </button>
              </div>

              {/* Secondary Support Action */}
              <button
                type="button"
                onClick={this.handleWhatsAppSupport}
                className="w-full py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium rounded-xl flex items-center justify-center gap-2 transition-all text-xs mb-6 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                Contactar asistencia inmediata por WhatsApp
              </button>

              {/* Technical Accordion */}
              <div className="border-t border-slate-800/80 pt-4">
                <button
                  type="button"
                  onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                  className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
                >
                  <span>Detalles técnicos del incidente</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {this.state.showDetails && (
                  <div className="mt-3 bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-500 font-mono text-[11px]">Mensaje de excepción:</span>
                      <button
                        type="button"
                        onClick={this.handleCopyDiagnostic}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] font-mono cursor-pointer"
                      >
                        {this.state.copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="font-mono text-red-300 break-words mb-3 bg-red-950/30 p-2.5 rounded-lg border border-red-900/30">
                      {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="font-mono text-[10px] text-slate-400 overflow-x-auto max-h-36 p-2 bg-slate-900/50 rounded-lg">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
