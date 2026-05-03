import type * as vscode from 'vscode';

export interface IConfigurationService {
  isEnabled(): boolean;
  getAccessibilityVerbosity(): 'minimal' | 'normal' | 'verbose';
  isScreenReaderMode(): boolean;
  isKeyboardNavigation(): boolean;
  onConfigurationChanged(listener: () => void): vscode.Disposable;
  dispose(): void;
}
