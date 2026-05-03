import * as vscode from 'vscode';

import { Logger } from '../utils/logger';

const WALKTHROUGH_COMPLETED_KEY = '{{EXTENSION_ID}}.walkthroughCompleted';
const WALKTHROUGH_INSTALL_VERSION_KEY = '{{EXTENSION_ID}}.installVersion';
const WALKTHROUGH_ID = '{{PUBLISHER}}.{{EXTENSION_NAME}}#{{EXTENSION_ID}}.gettingStarted';

export class WalkthroughManager {
  private readonly logger: Logger;
  private context: vscode.ExtensionContext | undefined;

  constructor() {
    this.logger = Logger.getInstance();
  }

  public async initialize(context: vscode.ExtensionContext): Promise<void> {
    this.context = context;
    try {
      if (this.isFirstInstall()) {
        this.logger.info('First install detected — opening walkthrough');
        await this.openWalkthrough();
        this.markInstallComplete();
      }
    } catch (error) {
      this.logger.warn('WalkthroughManager.initialize encountered an error', error);
    }
  }

  public async openWalkthrough(): Promise<void> {
    try {
      await vscode.commands.executeCommand(
        'workbench.action.openWalkthrough',
        WALKTHROUGH_ID,
        false,
      );
    } catch (error) {
      this.logger.error('Failed to open walkthrough', error);
    }
  }

  public isFirstInstall(): boolean {
    if (!this.context) return false;
    return !this.context.globalState.get<boolean>(WALKTHROUGH_COMPLETED_KEY, false);
  }

  public markInstallComplete(): void {
    if (!this.context) return;
    void this.context.globalState.update(WALKTHROUGH_COMPLETED_KEY, true);
    void this.context.globalState.update(
      WALKTHROUGH_INSTALL_VERSION_KEY,
      this.context.extension.packageJSON.version as string,
    );
    this.logger.debug('Walkthrough marked as complete');
  }
}
