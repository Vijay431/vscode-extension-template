import * as vscode from 'vscode';

import type { IConfigurationService } from '../di/interfaces/IConfigurationService';
import type { ILogger } from '../di/interfaces/ILogger';
import { Logger } from '../utils/logger';

// The configuration section key — matches package.json "contributes.configuration" title key.
// init.mjs replaces {{EXTENSION_ID}} automatically.
const CONFIG_SECTION = '{{EXTENSION_ID}}';

export class ConfigurationService implements IConfigurationService {
  private static instance: ConfigurationService | undefined;
  private readonly logger: ILogger;
  private disposables: vscode.Disposable[] = [];
  private configChangeEmitter = new vscode.EventEmitter<void>();

  private constructor(logger: ILogger) {
    this.logger = logger;
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration(CONFIG_SECTION)) {
          this.logger.debug('Configuration changed');
          this.configChangeEmitter.fire();
        }
      }),
    );
  }

  public static getInstance(): ConfigurationService {
    ConfigurationService.instance ??= new ConfigurationService(Logger.getInstance());
    return ConfigurationService.instance;
  }

  public static create(logger: ILogger): ConfigurationService {
    return new ConfigurationService(logger);
  }

  private get<T>(key: string, defaultValue: T): T {
    return vscode.workspace.getConfiguration(CONFIG_SECTION).get<T>(key, defaultValue);
  }

  public isEnabled(): boolean {
    return this.get<boolean>('enabled', true);
  }

  public getAccessibilityVerbosity(): 'minimal' | 'normal' | 'verbose' {
    return this.get<'minimal' | 'normal' | 'verbose'>('accessibility.verbosity', 'normal');
  }

  public isScreenReaderMode(): boolean {
    return this.get<boolean>('accessibility.screenReaderMode', false);
  }

  public isKeyboardNavigation(): boolean {
    return this.get<boolean>('accessibility.keyboardNavigation', true);
  }

  public onConfigurationChanged(listener: () => void): vscode.Disposable {
    return this.configChangeEmitter.event(listener);
  }

  public dispose(): void {
    this.configChangeEmitter.dispose();
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
  }
}
