export type TelemetrySeverity = 'critical' | 'warning' | 'info';

export type TelemetryCategory = 
  | 'database' 
  | 'auth' 
  | 'ui' 
  | 'network' 
  | 'business' 
  | 'user_report'
  | 'general';

export type TelemetryEnvironment = 'staging' | 'production' | 'development' | 'test';

export interface TelemetryEvent {
  id: string;
  appId: string;
  appVersion?: string;
  environment: TelemetryEnvironment;
  severity: TelemetrySeverity;
  category: TelemetryCategory;
  title: string;
  message: string;
  context?: Record<string, any>;
  timestamp: string; // ISO string
  url?: string;
  userAgent?: string;
  userId?: string;
  userEmail?: string;
  workspaceId?: string;
  errorStack?: string;
  count?: number; // Contador de deduplicación
}

export interface TelegramConfig {
  botToken?: string;
  chatId?: string;
  minSeverity?: TelemetrySeverity;
  enabled?: boolean;
}

export interface TelemetryConfig {
  appId: string;
  appVersion?: string;
  environment?: TelemetryEnvironment;
  enabled?: boolean;
  telegram?: TelegramConfig;
  throttleMs?: number;
  onEvent?: (event: TelemetryEvent) => void | Promise<void>;
}
