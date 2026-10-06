/**
 * Command Registry
 *
 * Central registry for managing command handlers and their lifecycle.
 * Provides command registration, disposal, and metadata management.
 *
 * @description
 * The CommandRegistry provides:
 * - Central command registration interface
 * - Command handler lifecycle management
 * - Command metadata (name, title, category)
 * - Integration with VS Code commands API
 * - Support for dynamic command enabling/disabling
 *
 * @category Commands
 * @module managers/CommandRegistry
 */

import * as vscode from 'vscode';

import type { CommandHandlerFactory, ICommandHandler } from '../commands';
import type { ILogger } from '../di/interfaces/ILogger';

/**
 * Command Metadata
 *
 * Contains information about a registered command.
 */
export interface CommandMetadata {
  /** The VS Code command ID */
  id: string;
  /** The command title shown to users */
  title: string;
  /** The command category */
  category: string;
  /** The command handler factory */
  handlerFactory: CommandHandlerFactory;
  /** Optional icon for the command */
  icon?: string;
}

/**
 * Command Registry
 *
 * Manages command registration and lifecycle.
 *
 * @example
 * ```typescript
 * const registry = new CommandRegistry(context);
 * registry.registerCommand({
 *   id: '{{EXTENSION_ID}}.copyFunction',
 *   title: 'Copy Function',
 *   category: '{{DISPLAY_NAME}}',
 *   handlerFactory: () => new CopyFunctionCommand(...)
 * });
 * ```
 *
 * @category Commands
 * @subcategory Registration
 */
export class CommandRegistry {
  private readonly commands = new Map<
    string,
    { metadata: CommandMetadata; handler: ICommandHandler; disposable: vscode.Disposable }
  >();

  /**
   * @param _context - Extension context (kept for signature compatibility)
   * @param logger - Optional logger used for command diagnostics
   */
  constructor(
    _context: vscode.ExtensionContext,
    private readonly logger?: ILogger,
  ) {}

  /**
   * Register a command
   *
   * @param metadata - The command metadata
   * @returns This registry for chaining
   */
  public registerCommand(metadata: CommandMetadata): this {
    // Replace any existing registration with the same ID
    this.unregisterCommand(metadata.id);

    const handler = metadata.handlerFactory();

    const disposable = vscode.commands.registerCommand(metadata.id, async () => {
      try {
        const result = await handler.execute();
        if (!result.success) {
          const detail = result.error ? `: ${result.error}` : '';
          this.logger?.warn(`Command '${metadata.id}' failed`, result);
          void vscode.window.showErrorMessage(`${result.message}${detail}`);
        }
      } catch (error) {
        this.logger?.error(`Command '${metadata.id}' threw`, error);
        const detail = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`Command '${metadata.title}' failed: ${detail}`);
      }
    });

    this.commands.set(metadata.id, { metadata, handler, disposable });

    return this;
  }

  /**
   * Register multiple commands
   *
   * @param commands - Array of command metadata
   * @returns This registry for chaining
   */
  public registerCommands(commands: CommandMetadata[]): this {
    for (const command of commands) {
      this.registerCommand(command);
    }
    return this;
  }

  /**
   * Execute a command by ID
   *
   * @param commandId - The command to execute
   * @param args - Optional arguments to pass to the command
   * @returns Promise that resolves when command is executed
   */
  public async executeCommand(commandId: string, ...args: unknown[]): Promise<unknown> {
    return vscode.commands.executeCommand(commandId, ...args);
  }

  /**
   * Get all registered commands
   *
   * @returns Array of registered command metadata
   */
  public getRegisteredCommands(): CommandMetadata[] {
    return Array.from(this.commands.values()).map(({ metadata }) => metadata);
  }

  /**
   * Check if a command is registered
   *
   * @param commandId - The command ID to check
   * @returns true if command is registered
   */
  public hasCommand(commandId: string): boolean {
    return this.commands.has(commandId);
  }

  /**
   * Get command metadata by ID
   *
   * @param commandId - The command ID
   * @returns The command metadata, or undefined if not found
   */
  public getCommand(commandId: string): CommandMetadata | undefined {
    return this.commands.get(commandId)?.metadata;
  }

  /**
   * Unregister a specific command
   *
   * @param commandId - The command ID to unregister
   */
  public unregisterCommand(commandId: string): void {
    const entry = this.commands.get(commandId);
    if (entry) {
      this.commands.delete(commandId);
      try {
        entry.disposable.dispose();
      } finally {
        entry.handler.dispose?.();
      }
    }
  }

  /**
   * Dispose of all registered commands (idempotent)
   */
  public dispose(): void {
    for (const id of Array.from(this.commands.keys())) {
      try {
        this.unregisterCommand(id);
      } catch {
        // One failing handler must not leave the remaining commands registered.
      }
    }
  }
}
