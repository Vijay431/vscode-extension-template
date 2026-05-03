import * as vscode from 'vscode';

import { ConfigurationService } from '../services/configurationService';
import { ConfigValidator } from '../utils/configValidator';
import { Logger } from '../utils/logger';

import { CommandsManager } from './CommandsManager';
import { WalkthroughManager } from './WalkthroughManager';

export class ExtensionManager {
  private logger: Logger;
  private configService: ConfigurationService;
  private commandsManager: CommandsManager;
  private walkthroughManager: WalkthroughManager;
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.logger = Logger.getInstance();
    this.configService = ConfigurationService.getInstance();
    this.commandsManager = new CommandsManager();
    this.walkthroughManager = new WalkthroughManager();
  }

  public async activate(context: vscode.ExtensionContext): Promise<void> {
    this.logger.info('Activating {{DISPLAY_NAME}} extension');

    try {
      const rawConfig = {
        enabled: this.configService.isEnabled(),
        accessibility: {
          verbosity: this.configService.getAccessibilityVerbosity(),
          screenReaderMode: this.configService.isScreenReaderMode(),
          keyboardNavigation: this.configService.isKeyboardNavigation(),
        },
      };
      ConfigValidator.validate(rawConfig, this.logger);

      await this.initializeComponents(context);

      await this.walkthroughManager.initialize(context);

      context.subscriptions.push(
        vscode.commands.registerCommand('{{EXTENSION_ID}}.openWalkthrough', () => {
          void this.walkthroughManager.openWalkthrough();
        }),
      );

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
      vscode.window.showErrorMessage('Failed to activate {{DISPLAY_NAME}} extension');
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
    await vscode.commands.executeCommand(
      'setContext',
      '{{EXTENSION_ID}}.enabled',
      isEnabled,
    );
  }

  public deactivate(): void {
    this.logger.info('Deactivating {{DISPLAY_NAME}} extension');
    this.dispose();
  }

  private dispose(): void {
    this.commandsManager.dispose();
    for (const d of this.disposables) {
      try { d.dispose(); } catch (error) { this.logger.warn('Error disposing resource', error); }
    }
    this.disposables = [];
    this.logger.dispose();
  }

  public getCommandsManager(): CommandsManager {
    return this.commandsManager;
  }

  public getConfigurationService(): ConfigurationService {
    return this.configService;
  }

  public isActive(): boolean {
    return this.configService.isEnabled();
  }
}
