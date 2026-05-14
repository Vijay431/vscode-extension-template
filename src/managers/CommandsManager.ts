import * as vscode from 'vscode';

import { HelloWorldCommand } from '../commands/HelloWorldCommand';
import { getService } from '../di/container';
import type { IAccessibilityService } from '../di/interfaces/IAccessibilityService';
import type { ILogger } from '../di/interfaces/ILogger';
import { TYPES } from '../di/types';

import { CommandRegistry } from './CommandRegistry';

/**
 * CommandsManager registers all extension commands with VS Code.
 *
 * To add a new command:
 *   1. Import its class here.
 *   2. Call registry.registerCommand({ id, title, category, handlerFactory }).
 *   3. Add the command to package.json contributes.commands.
 */
export class CommandsManager {
  private registry: CommandRegistry | undefined;
  private disposables: vscode.Disposable[] = [];

  public async initialize(context: vscode.ExtensionContext): Promise<void> {
    this.registry = new CommandRegistry(context);

    const logger = getService<ILogger>(TYPES.Logger);
    const a11y = getService<IAccessibilityService>(TYPES.AccessibilityService);

    this.registry.registerCommand({
      id: '{{EXTENSION_ID}}.helloWorld',
      title: 'Hello World',
      category: '{{DISPLAY_NAME}}',
      handlerFactory: () => new HelloWorldCommand(logger, a11y),
    });

    // Register enable / disable commands
    this.disposables.push(
      vscode.commands.registerCommand('{{EXTENSION_ID}}.enable', async () => {
        await vscode.workspace
          .getConfiguration('{{EXTENSION_ID}}')
          .update('enabled', true, vscode.ConfigurationTarget.Global);
      }),
      vscode.commands.registerCommand('{{EXTENSION_ID}}.disable', async () => {
        await vscode.workspace
          .getConfiguration('{{EXTENSION_ID}}')
          .update('enabled', false, vscode.ConfigurationTarget.Global);
      }),
    );

    this.disposables.forEach((d) => context.subscriptions.push(d));
  }

  public dispose(): void {
    this.registry?.dispose();
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
  }
}
