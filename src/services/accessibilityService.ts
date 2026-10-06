import * as vscode from 'vscode';

import type { IAccessibilityService, VerbosityLevel } from '../di/interfaces/IAccessibilityService';
import type { ILogger } from '../di/interfaces/ILogger';
import type { AccessibilityConfig } from '../types/config';

export type { AccessibilityConfig } from '../types/config';

/**
 * Accessibility Service
 *
 * Centralized accessibility management for the extension.
 * Manages accessibility settings and provides screen reader announcements.
 * Implements IAccessibilityService for DI compatibility.
 *
 * @author {{AUTHOR_NAME}} <{{AUTHOR_EMAIL}}>
 *
 * @description
 * This service handles all accessibility-related functionality including:
 * - Reading and caching accessibility configuration
 * - Providing screen reader announcements via transient status bar messages
 * - Centralizing accessibility logic for consistent behavior
 * - Supporting verbosity levels for different user needs
 *
 * Verbosity Levels:
 * - minimal: Only essential announcements (errors, critical operations)
 * - normal: Standard announcements for all operations (default)
 * - verbose: Detailed announcements including progress and contextual information
 *
 * Use Cases:
 * - Announcing operation completion to screen readers
 * - Providing accessible feedback for long-running operations
 * - Customizing announcement verbosity based on user preference
 * - Determining when to show enhanced accessibility features
 *
 * @example
 * ```typescript
 * const a11y = getService<IAccessibilityService>(TYPES.AccessibilityService);
 * await a11y.announce('File saved successfully');
 * ```
 *
 * @category Accessibility
 * @subcategory Services
 *
 * @since 2.1.0
 */
export class AccessibilityService implements IAccessibilityService {
  private logger: ILogger;
  private config: AccessibilityConfig;
  private configChangeListener: vscode.Disposable | undefined;

  private constructor(logger: ILogger) {
    this.logger = logger;
    this.config = this.loadConfiguration();
    this.watchConfigurationChanges();
  }

  /**
   * Create a new AccessibilityService instance (DI pattern)
   *
   * This method is used by the DI container.
   *
   * @param logger - The logger instance to use
   * @returns A new AccessibilityService instance
   */
  public static create(logger: ILogger): AccessibilityService {
    return new AccessibilityService(logger);
  }

  /**
   * Load accessibility configuration from VS Code settings
   */
  private loadConfiguration(): AccessibilityConfig {
    const config = vscode.workspace.getConfiguration('{{EXTENSION_ID}}.accessibility');

    return {
      verbosity: this.getVerbosityConfig(config),
      screenReaderMode: config.get<boolean>('screenReaderMode', false),
      keyboardNavigation: config.get<boolean>('keyboardNavigation', true),
    };
  }

  /**
   * Get verbosity setting with validation
   */
  private getVerbosityConfig(config: vscode.WorkspaceConfiguration): VerbosityLevel {
    const verbosity = config.get<string>('verbosity', 'normal');
    if (this.isValidVerbosity(verbosity)) {
      return verbosity as VerbosityLevel;
    }
    return 'normal';
  }

  /**
   * Validate verbosity value
   */
  private isValidVerbosity(value: string): value is VerbosityLevel {
    return ['minimal', 'normal', 'verbose'].includes(value);
  }

  /**
   * Watch for configuration changes
   */
  private watchConfigurationChanges(): void {
    this.configChangeListener = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('{{EXTENSION_ID}}.accessibility')) {
        this.config = this.loadConfiguration();
        this.logger.debug('Accessibility configuration updated', this.config);
      }
    });
  }

  /**
   * Get current accessibility configuration
   */
  public getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  /**
   * Get current verbosity level
   */
  public getVerbosity(): VerbosityLevel {
    return this.config.verbosity;
  }

  /**
   * Set the verbosity level
   */
  public setVerbosity(verbosity: VerbosityLevel): void {
    this.config.verbosity = verbosity;
  }

  /**
   * Check if screen reader mode is enabled
   */
  public isScreenReaderEnabled(): boolean {
    return this.config.screenReaderMode;
  }

  /**
   * Announce a message to screen readers
   * Shows a transient status bar message; screen-reader behaviour depends on user settings
   *
   * @param message - The message to announce
   * @param verbosity - The importance level (minimal, normal, verbose)
   * @returns Promise that resolves when announcement is made
   */
  public async announce(message: string, verbosity: VerbosityLevel = 'normal'): Promise<void> {
    if (!this.shouldAnnounce(verbosity)) {
      this.logger.debug(`Announcement skipped due to verbosity level: ${message}`);
      return;
    }

    try {
      // VS Code has no public announce API. Status bar messages are exposed to
      // assistive technology, but whether a screen reader reads them depends on
      // the user's settings (e.g. accessibility.verbosity.*, screen reader mode).
      vscode.window.setStatusBarMessage(message, 3000);

      this.logger.debug(`Accessibility announcement: ${message}`);
    } catch (error) {
      this.logger.error('Failed to make accessibility announcement', error);
    }
  }

  /**
   * Announce operation success
   */
  public async announceSuccess(operation: string, detail: string): Promise<void> {
    const message = detail ? `${operation} succeeded. ${detail}` : `${operation} succeeded`;
    await this.announce(message, 'normal');
  }

  /**
   * Announce operation failure
   */
  public async announceError(operation: string, error: string): Promise<void> {
    const message = `${operation} failed. ${error}`;
    await this.announce(message, 'minimal');
  }

  /**
   * Announce progress for long-running operations
   */
  public async announceProgress(operation: string, current: number, total: number): Promise<void> {
    if (total <= 0) {
      return;
    }
    const percentage = Math.round((current / total) * 100);
    const message = `${operation}: ${current} of ${total} complete, ${percentage}%`;
    await this.announce(message, 'verbose');
  }

  /**
   * Get an accessible label with count information
   */
  public formatWithCount(label: string, count: number): string {
    if (count === 1) {
      return `${label} (1 item)`;
    }
    return `${label} (${count} items)`;
  }

  /**
   * Create an accessible QuickPick item with proper labeling.
   * Note: VS Code does not currently honor `ariaLabel`/`ariaDescription` on
   * QuickPick items; the fields are kept for forward compatibility.
   */
  public createAccessibleQuickPickItem<T extends vscode.QuickPickItem>(
    item: T,
    accessibility: { ariaLabel: string; ariaDescription?: string },
  ): T & { ariaLabel: string; ariaDescription?: string } {
    return {
      ...item,
      ariaLabel: accessibility.ariaLabel,
      ariaDescription: accessibility.ariaDescription ?? item.description,
    } as T & { ariaLabel: string; ariaDescription?: string };
  }

  /**
   * Enhance a Quick Pick options object for accessibility
   */
  public enhanceQuickPickOptions<T>(options: T): T {
    return options;
  }

  /**
   * Check if an announcement should be made based on verbosity level
   */
  private shouldAnnounce(level: VerbosityLevel): boolean {
    const verbosity = this.config.verbosity;

    // Minimal mode only announces minimal level
    if (verbosity === 'minimal' && level !== 'minimal') {
      return false;
    }

    // Normal mode announces minimal and normal
    if (verbosity === 'normal' && level === 'verbose') {
      return false;
    }

    return true;
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.configChangeListener?.dispose();
  }
}
