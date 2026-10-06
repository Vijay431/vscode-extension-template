import { LogCategory, LogFormat, LogLevel } from '../../utils/logger';

export interface ILogger {
  debug(message: string, data?: unknown, category?: LogCategory): void;
  info(message: string, data?: unknown, category?: LogCategory): void;
  warn(message: string, data?: unknown, category?: LogCategory): void;
  error(message: string, error?: unknown, category?: LogCategory): void;
  setLogLevel(level: LogLevel): void;
  setLogFormat(format: LogFormat): void;
  show(): void;
  dispose(): void;
}
