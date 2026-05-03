import { LogLevel } from '../../utils/logger';

export interface ILogger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, error?: unknown): void;
  setLogLevel(level: LogLevel): void;
  show(): void;
  dispose(): void;
}
