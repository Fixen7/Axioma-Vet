import type { 
  TelemetryConfig, 
  TelemetryEvent, 
  TelemetrySeverity, 
  TelemetryCategory, 
  TelemetryEnvironment 
} from './types';
import { TelegramNotifier } from './telegramNotifier';

export class AxiomaTelemetry {
  private config: TelemetryConfig;
  private telegramNotifier: TelegramNotifier;
  private recentEvents: TelemetryEvent[] = [];
  private readonly MAX_RECENT_EVENTS = 50;
  private isInitialized = false;
  private currentUserId?: string;
  private currentUserEmail?: string;
  private currentWorkspaceId?: string;

  constructor() {
    this.config = {
      appId: 'axioma-vet',
      appVersion: '1.0.0',
      environment: this.detectEnvironment(),
      enabled: true,
      throttleMs: 30000
    };
    this.telegramNotifier = new TelegramNotifier();
  }

  private detectEnvironment(): TelemetryEnvironment {
    if (typeof window === 'undefined') return 'test';
    const host = window.location.hostname;
    if (host === 'vet.axiomadynamics.com') return 'production';
    if (host.includes('vercel.app') || host.includes('staging')) return 'staging';
    if (host === 'localhost' || host === '127.0.0.1') return 'development';
    return (import.meta.env.VITE_AXIOMA_ENV as TelemetryEnvironment) || 'staging';
  }

  public init(customConfig?: Partial<TelemetryConfig>): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (customConfig) {
      this.config = {
        ...this.config,
        ...customConfig,
        telegram: {
          ...this.config.telegram,
          ...customConfig.telegram
        }
      };
      if (customConfig.telegram) {
        this.telegramNotifier.updateConfig(customConfig.telegram);
      }
    }

    // Registrar listeners globales en el navegador
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event: ErrorEvent) => {
        this.captureException(event.error || event.message, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }, 'ui', 'critical');
      });

      window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
        this.captureException(event.reason, {
          type: 'unhandled_promise_rejection'
        }, 'ui', 'critical');
      });

      // Exponer en window para debugging y verificación en tiempo real en Staging
      (window as any).__AXIOMA_TELEMETRY__ = this;
    }

    console.info(`[AxiomaTelemetry] Inicializado para ${this.config.appId} (${this.config.environment})`);
  }

  public setUser(user: { id: string; email?: string } | null): void {
    if (user) {
      this.currentUserId = user.id;
      this.currentUserEmail = user.email;
    } else {
      this.currentUserId = undefined;
      this.currentUserEmail = undefined;
    }
  }

  public setWorkspace(workspaceId: string | null): void {
    this.currentWorkspaceId = workspaceId || undefined;
  }

  public async track(title: string, options?: Partial<TelemetryEvent>): Promise<TelemetryEvent> {
    const event: TelemetryEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      appId: options?.appId || this.config.appId,
      appVersion: options?.appVersion || this.config.appVersion,
      environment: options?.environment || this.config.environment || this.detectEnvironment(),
      severity: options?.severity || 'info',
      category: options?.category || 'general',
      title,
      message: options?.message || title,
      context: options?.context,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      userId: options?.userId || this.currentUserId,
      userEmail: options?.userEmail || this.currentUserEmail,
      workspaceId: options?.workspaceId || this.currentWorkspaceId,
      errorStack: options?.errorStack,
      count: 1
    };

    // Almacenar en buffer circular
    this.recentEvents.unshift(event);
    if (this.recentEvents.length > this.MAX_RECENT_EVENTS) {
      this.recentEvents.pop();
    }

    // Log estructurado en consola
    const colorMap: Record<TelemetrySeverity, string> = {
      critical: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    console.log(
      `%c[Telemetry:${event.category.toUpperCase()}] %c${event.severity.toUpperCase()}%c ${event.title}`,
      'font-weight: bold; color: #6366f1;',
      `font-weight: bold; color: ${colorMap[event.severity]};`,
      'color: inherit;',
      event
    );

    // Ejecutar callback personalizado si existe
    if (this.config.onEvent) {
      try {
        await this.config.onEvent(event);
      } catch (err) {
        console.warn('[Telemetry] Error en onEvent handler:', err);
      }
    }

    // Despacho a Telegram si aplica
    await this.telegramNotifier.sendAlert(event);

    return event;
  }

  public async captureException(
    error: unknown,
    context?: Record<string, any>,
    category: TelemetryCategory = 'ui',
    severity: TelemetrySeverity = 'critical'
  ): Promise<TelemetryEvent> {
    let message = 'Error desconocido';
    let stack: string | undefined;

    if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object') {
      message = JSON.stringify(error);
    }

    return this.track(message, {
      category,
      severity,
      message,
      errorStack: stack,
      context
    });
  }

  public async reportDatabaseError(
    operation: string, 
    error: unknown, 
    details?: Record<string, any>
  ): Promise<TelemetryEvent> {
    const code = (error as any)?.code || (error as any)?.status;

    return this.captureException(
      error,
      {
        operation,
        code,
        details,
        workspaceId: this.currentWorkspaceId
      },
      'database',
      'critical'
    );
  }

  public async reportAuthError(
    flow: string, 
    error: unknown, 
    details?: Record<string, any>
  ): Promise<TelemetryEvent> {
    return this.captureException(
      error,
      {
        flow,
        details
      },
      'auth',
      'critical'
    );
  }

  public async reportUserBug(
    title: string, 
    description: string, 
    userDetails?: Record<string, any>
  ): Promise<TelemetryEvent> {
    return this.track(title, {
      category: 'user_report',
      severity: 'warning',
      message: description,
      context: userDetails
    });
  }

  public getRecentEvents(): TelemetryEvent[] {
    return [...this.recentEvents];
  }

  public clearEvents(): void {
    this.recentEvents = [];
  }

  public configureTelegram(config: Partial<import('./types').TelegramConfig>): void {
    this.telegramNotifier.updateConfig(config);
  }

  public async testTelegramConnection(botToken?: string, chatId?: string) {
    return this.telegramNotifier.testConnection(botToken, chatId);
  }
}

// Instancia singleton universal
export const telemetry = new AxiomaTelemetry();

export * from './types';
export * from './telegramNotifier';
