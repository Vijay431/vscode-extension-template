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

  // The manager owns these disposables; its own disposer on context.subscriptions
  // releases them, and dispose() is idempotent.
  public async initialize(context: vscode.ExtensionContext): Promise<void> {
    this.registry = new CommandRegistry(context);
    // Register with the context immediately so a later failure cannot leak.
    context.subscriptions.push({ dispose: () => this.dispose() });

    const logger = getService<ILogger>(TYPES.Logger);
    const a11y = getService<IAccessibilityService>(TYPES.AccessibilityService);

    this.registry.registerCommand({
      id: '{{EXTENSION_ID}}.helloWorld',
      title: 'Hello World',
      category: '{{DISPLAY_NAME}}',
      handlerFactory: () => new HelloWorldCommand(logger, a11y),
    });

    // Register enable / disable commands
    const enable = vscode.commands.registerCommand('{{EXTENSION_ID}}.enable', async () => {
      await vscode.workspace
        .getConfiguration('{{EXTENSION_ID}}')
        .update('enabled', true, vscode.ConfigurationTarget.Global);
    });
    this.disposables.push(enable);

    const disable = vscode.commands.registerCommand('{{EXTENSION_ID}}.disable', async () => {
      await vscode.workspace
        .getConfiguration('{{EXTENSION_ID}}')
        .update('enabled', false, vscode.ConfigurationTarget.Global);
    });
    this.disposables.push(disable);
  }

  public dispose(): void {
    const registry = this.registry;
    const disposables = this.disposables;
    this.registry = undefined;
    this.disposables = [];
    registry?.dispose();
    for (const d of disposables) d.dispose();
  }
}
