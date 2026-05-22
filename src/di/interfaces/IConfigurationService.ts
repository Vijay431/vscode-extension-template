import type * as vscode from 'vscode';

import type { ExtensionConfiguration } from '../../types/config';

export interface IConfigurationService {
  isEnabled(): boolean;
  getAccessibilityVerbosity(): 'minimal' | 'normal' | 'verbose';
  isScreenReaderMode(): boolean;
  isKeyboardNavigation(): boolean;
  getConfiguration(): ExtensionConfiguration;
  updateConfiguration<T>(
    key: string,
    value: T,
    target?: 'Global' | 'Workspace' | 'WorkspaceFolder',
  ): Promise<void>;
  onConfigurationChanged(listener: () => void): vscode.Disposable;
  dispose(): void;
}
