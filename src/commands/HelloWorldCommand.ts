import * as vscode from 'vscode';

import type { IAccessibilityService } from '../di/interfaces/IAccessibilityService';
import type { ILogger } from '../di/interfaces/ILogger';

import { BaseCommandHandler, type CommandResult } from './BaseCommandHandler';

/**
 * Hello World — the starter command. Copy, rename, and adapt this for every
 * new command you add. Follow the pattern:
 *   1. Extend BaseCommandHandler
 *   2. Implement execute()
 *   3. Register in CommandsManager
 *   4. Add contributes.commands entry in package.json
 */
export class HelloWorldCommand extends BaseCommandHandler {
  constructor(logger: ILogger, accessibilityService: IAccessibilityService) {
    super('HelloWorldCommand', logger, accessibilityService);
  }

  public async execute(): Promise<CommandResult> {
    this.logInfo('Executing Hello World');

    const message = 'Hello from {{DISPLAY_NAME}}!';
    vscode.window.showInformationMessage(message);

    await this.announceSuccess('Hello World', message);

    return this.success(message);
  }
}
