// =============================================================================
// Logger estructurado — NO usar console.log en producción (R8 AP-08)
// Formato: logger.info('[Módulo] Acción', { contextData })
// =============================================================================

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  [key: string]: unknown
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  }
  // En producción Vercel captura stdout como logs estructurados
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry))
}

export const logger = {
  info:  (message: string, context?: Record<string, unknown>) => log('info',  message, context),
  warn:  (message: string, context?: Record<string, unknown>) => log('warn',  message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
  debug: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') log('debug', message, context)
  },
}
