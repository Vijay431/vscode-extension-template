import * as vscode from 'vscode';

import { initializeContainer } from './di';
import { ExtensionManager } from './managers/ExtensionManager';

let extensionManager: ExtensionManager | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    await initializeContainer(context);

    extensionManager = new ExtensionManager();
    await extensionManager.activate(context);
  } catch (error) {
    const message = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
    console.error('Failed to activate {{DISPLAY_NAME}} extension:', message);
    const channel = vscode.window.createOutputChannel('{{DISPLAY_NAME}} - Activation Error');
    channel.appendLine(message);
    channel.show(true);
    vscode.window.showErrorMessage(
      `{{DISPLAY_NAME}} activation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function deactivate(): void {
  if (extensionManager) {
    extensionManager.deactivate();
    extensionManager = undefined;
  }
}
