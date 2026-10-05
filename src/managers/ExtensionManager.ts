import * as vscode from 'vscode';

import { getService } from '../di/container';
import type { IConfigurationService } from '../di/interfaces/IConfigurationService';
import type { ILogger } from '../di/interfaces/ILogger';
import { TYPES } from '../di/types';
import { ConfigValidator } from '../utils/configValidator';
import type { ExtensionConfig } from '../utils/configValidator';

import { CommandsManager } from './CommandsManager';

export class ExtensionManager {
  private readonly logger: ILogger;
  private readonly configService: IConfigurationService;
  private validatedConfig: ExtensionConfig | undefined;
  private commandsManager: CommandsManager;
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.logger = getService<ILogger>(TYPES.Logger);
    this.configService = getService<IConfigurationService>(TYPES.ConfigurationService);
    this.commandsManager = new CommandsManager();
  }

  public async activate(context: vscode.ExtensionContext): Promise<void> {
    this.logger.info('Activating {{DISPLAY_NAME}} extension');

    try {
      this.validatedConfig = ConfigValidator.validate(
        this.configService.getConfiguration(),
        this.logger,
      );

      await this.initializeComponents(context);

      context.subscriptions.push(
        vscode.commands.registerCommand('{{EXTENSION_ID}}.showOutputChannel', () => {
          this.logger.show();
        }),
      );

      this.disposables.forEach((d) => context.subscriptions.push(d));
      context.subscriptions.push({ dispose: () => this.dispose() });

      await this.updateEnabledContext();

      this.logger.info('{{DISPLAY_NAME}} extension activated successfully');

      if (process.env['NODE_ENV'] === 'development' && this.configService.isEnabled()) {
        vscode.window.showInformationMessage('{{DISPLAY_NAME}} extension is now active');
      }
    } catch (error) {
      this.logger.error('Failed to activate extension', error);
      throw error;
    }
  }

  private async initializeComponents(context: vscode.ExtensionContext): Promise<void> {
    await this.commandsManager.initialize(context);

    this.disposables.push(
      this.configService.onConfigurationChanged(() => {
        void this.handleConfigurationChanged();
      }),
    );

    this.logger.debug('All components initialized successfully');
  }

  private async handleConfigurationChanged(): Promise<void> {
    this.logger.debug(`Configuration changed — enabled: ${this.configService.isEnabled()}`);
    await this.updateEnabledContext();
  }

  private async updateEnabledContext(): Promise<void> {
    const isEnabled = this.configService.isEnabled();
    await vscode.commands.executeCommand('setContext', '{{EXTENSION_ID}}.enabled', isEnabled);
  }

  public deactivate(): void {
    this.logger.info('Deactivating {{DISPLAY_NAME}} extension');
    this.dispose();
  }

  private dispose(): void {
    this.commandsManager.dispose();
    for (const d of this.disposables) {
      try {
        d.dispose();
      } catch (error) {
        this.logger.warn('Error disposing resource', error);
      }
    }
    this.disposables = [];
  }

  public getCommandsManager(): CommandsManager {
    return this.commandsManager;
  }

  public getConfigurationService(): IConfigurationService {
    return this.configService;
  }

  public getValidatedConfig(): ExtensionConfig | undefined {
    return this.validatedConfig;
  }

  public isActive(): boolean {
    return this.configService.isEnabled();
  }
}
