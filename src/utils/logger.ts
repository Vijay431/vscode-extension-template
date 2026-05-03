import * as vscode from 'vscode';

import type { ILogger } from '../di/interfaces/ILogger';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export enum LogFormat {
  TEXT = 'text',
  JSON = 'json',
}

export enum LogCategory {
  GENERAL = 'general',
  PERFORMANCE = 'performance',
  OPERATION = 'operation',
  SECURITY = 'security',
}

export class Logger implements ILogger {
  private static instance: Logger | undefined;
  private outputChannel: vscode.OutputChannel;
  private logLevel: LogLevel = LogLevel.INFO;
  private logFormat: LogFormat = LogFormat.TEXT;

  private constructor(outputChannel?: vscode.OutputChannel) {
    this.outputChannel =
      outputChannel ?? vscode.window.createOutputChannel('{{DISPLAY_NAME}}');
  }

  public static getInstance(): Logger {
    Logger.instance ??= new Logger();
    return Logger.instance;
  }

  public static create(outputChannel?: vscode.OutputChannel): Logger {
    return new Logger(outputChannel);
  }

  public setLogFormat(format: LogFormat): void {
    this.logFormat = format;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  public info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  public warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  public error(message: string, error?: unknown): void {
    this.log(LogLevel.ERROR, message, error);
  }

  public show(): void {
    this.outputChannel.show();
  }

  public dispose(): void {
    this.outputChannel.dispose();
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (level < this.logLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level] ?? 'UNKNOWN';

    if (this.logFormat === LogFormat.JSON) {
      const logEntry: Record<string, unknown> = { timestamp, level: levelName, message };
      if (data) logEntry['data'] = data;
      this.outputChannel.appendLine(JSON.stringify(logEntry));
    } else {
      const logMessage = `[${timestamp}] [${levelName}] ${message}`;
      this.outputChannel.appendLine(logMessage);
      if (data) {
        this.outputChannel.appendLine(`Data: ${JSON.stringify(data, null, 2)}`);
      }
    }

    if (process.env['NODE_ENV'] === 'development') {
      const consoleMessage = `[${timestamp}] [${levelName}] ${message}`;
      switch (level) {
        case LogLevel.DEBUG: console.debug(consoleMessage, data); break;
        case LogLevel.INFO:  console.info(consoleMessage, data);  break;
        case LogLevel.WARN:  console.warn(consoleMessage, data);  break;
        case LogLevel.ERROR: console.error(consoleMessage, data); break;
      }
    }
  }
}
