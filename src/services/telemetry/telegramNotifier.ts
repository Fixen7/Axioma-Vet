import type { TelemetryEvent, TelegramConfig } from './types';

export class TelegramNotifier {
  private config: TelegramConfig;
  private recentDispatches = new Map<string, { timestamp: number; count: number }>();
  private readonly THROTTLE_WINDOW_MS = 30000; // 30 segundos de agrupamiento para errores idénticos

  constructor(config?: TelegramConfig) {
    this.config = {
      botToken: config?.botToken || import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '',
      chatId: config?.chatId || import.meta.env.VITE_TELEGRAM_CHAT_ID || '',
      minSeverity: config?.minSeverity || 'warning',
      enabled: config?.enabled ?? true,
      ...config
    };

    // Soporte para configuración dinámica o guardada en navegador (útil en Staging para pruebas inmediatas)
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('axioma_telemetry_telegram_token');
      const storedChatId = localStorage.getItem('axioma_telemetry_telegram_chat_id');
      if (storedToken) this.config.botToken = storedToken;
      if (storedChatId) this.config.chatId = storedChatId;
    }
  }

  public updateConfig(newConfig: Partial<TelegramConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (typeof window !== 'undefined') {
      if (newConfig.botToken) localStorage.setItem('axioma_telemetry_telegram_token', newConfig.botToken);
      if (newConfig.chatId) localStorage.setItem('axioma_telemetry_telegram_chat_id', newConfig.chatId);
    }
  }

  public getConfig(): TelegramConfig {
    return { ...this.config };
  }

  private shouldDispatch(event: TelemetryEvent): boolean {
    if (!this.config.enabled) return false;
    if (!this.config.botToken || !this.config.chatId) return false;

    // Filtro por severidad: 'critical' > 'warning' > 'info'
    const severityLevels: Record<string, number> = {
      info: 1,
      warning: 2,
      critical: 3
    };

    const currentLevel = severityLevels[event.severity] || 1;
    const minLevel = severityLevels[this.config.minSeverity || 'warning'] || 2;

    // Los reportes manuales de usuarios siempre se envían
    if (event.category === 'user_report') return true;

    return currentLevel >= minLevel;
  }

  public formatTelegramMessage(event: TelemetryEvent): string {
    const severityIcons = {
      critical: '🔥 [CRITICAL]',
      warning: '⚠️ [WARNING]',
      info: 'ℹ️ [INFO]'
    };

    const categoryIcons: Record<string, string> = {
      database: '🗄️ BASE DE DATOS',
      auth: '🔐 AUTENTICACIÓN / SSO',
      ui: '🖥️ INTERFAZ / CLIENTE',
      network: '🌐 RED / API EXTERNA',
      business: '💼 LÓGICA DE NEGOCIO',
      user_report: '🐞 REPORTE DE USUARIO',
      general: '⚙️ SISTEMA'
    };

    const icon = severityIcons[event.severity] || '📢';
    const categoryName = categoryIcons[event.category] || event.category.toUpperCase();
    const envBadge = (event.environment || 'staging').toUpperCase();

    let text = `${icon} *${event.appId}* (${envBadge})\n\n`;
    text += `*Categoría:* ${categoryName}\n`;
    text += `*Evento:* ${event.title}\n`;
    text += `*Detalle:* ${event.message}\n`;

    if (event.count && event.count > 1) {
      text += `*Repeticiones:* ${event.count} veces\n`;
    }

    if (event.workspaceId) {
      text += `*Workspace:* \`${event.workspaceId}\`\n`;
    }

    if (event.userEmail || event.userId) {
      text += `*Usuario:* ${event.userEmail || event.userId}\n`;
    }

    if (event.url) {
      text += `*URL:* \`${event.url}\`\n`;
    }

    if (event.context && Object.keys(event.context).length > 0) {
      const serializedContext = JSON.stringify(event.context, null, 2);
      // Truncar si es demasiado largo
      const trimmed = serializedContext.length > 500 ? serializedContext.slice(0, 500) + '...' : serializedContext;
      text += `*Contexto:* \`\`\`json\n${trimmed}\n\`\`\`\n`;
    }

    if (event.errorStack) {
      const trimmedStack = event.errorStack.slice(0, 400);
      text += `*Stack:* \`\`\`\n${trimmedStack}\n\`\`\`\n`;
    }

    text += `*Fecha:* ${new Date(event.timestamp).toLocaleString('es-ES')}`;

    return text;
  }

  public async sendAlert(event: TelemetryEvent): Promise<boolean> {
    if (!this.shouldDispatch(event)) return false;

    // Deduplicación / Throttling
    const throttleKey = `${event.category}:${event.title}:${event.message.slice(0, 60)}`;
    const now = Date.now();
    const existing = this.recentDispatches.get(throttleKey);

    if (existing && (now - existing.timestamp < this.THROTTLE_WINDOW_MS)) {
      existing.count += 1;
      return false; // Silenciado temporalmente para no saturar Telegram
    }

    this.recentDispatches.set(throttleKey, { timestamp: now, count: 1 });

    const message = this.formatTelegramMessage(event);

    try {
      const endpoint = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('[Telemetry:Telegram] Falló el envío del mensaje a Telegram:', errorData);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('[Telemetry:Telegram] Error de conexión con Telegram API:', err);
      return false;
    }
  }

  public async testConnection(botToken?: string, chatId?: string): Promise<{ success: boolean; message: string }> {
    const token = botToken || this.config.botToken;
    const chat = chatId || this.config.chatId;

    if (!token || !chat) {
      return { success: false, message: 'Faltan el Bot Token o el Chat ID de Telegram' };
    }

    try {
      const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat,
          text: `🚀 *Axioma Telemetry: Conexión Exitosa*\n\nLas alertas en tiempo real están configuradas correctamente.`,
          parse_mode: 'Markdown'
        })
      });

      if (response.ok) {
        return { success: true, message: 'Mensaje de prueba enviado exitosamente a Telegram' };
      } else {
        const err = await response.json().catch(() => ({}));
        return { success: false, message: `Error de Telegram: ${JSON.stringify(err)}` };
      }
    } catch (err: any) {
      return { success: false, message: `Excepción de red: ${err?.message || err}` };
    }
  }
}
