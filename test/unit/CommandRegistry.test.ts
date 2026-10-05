import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';

import type { CommandResult } from '../../src/commands/BaseCommandHandler';
import type { ILogger } from '../../src/di/interfaces/ILogger';
import { CommandRegistry } from '../../src/managers/CommandRegistry';

const context = {} as vscode.ExtensionContext;

describe('CommandRegistry', () => {
  let callbacks: Map<string, () => Promise<void>>;
  let disposeSpies: ReturnType<typeof vi.fn>[];
  let showError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    callbacks = new Map();
    disposeSpies = [];
    vi.spyOn(vscode.commands, 'registerCommand').mockImplementation(((
      id: string,
      cb: () => Promise<void>,
    ) => {
      callbacks.set(id, cb);
      const dispose = vi.fn();
      disposeSpies.push(dispose);
      return { dispose };
    }) as never);
    showError = vi.spyOn(vscode.window, 'showErrorMessage') as unknown as ReturnType<typeof vi.fn>;
  });

  afterEach(() => vi.restoreAllMocks());

  const meta = (id: string, execute: () => Promise<CommandResult>) => ({
    id,
    title: 'Title',
    category: 'Cat',
    handlerFactory: () => ({ execute }),
  });

  it('should register, find and unregister commands', () => {
    const registry = new CommandRegistry(context);
    registry.registerCommand(meta('a.b', async () => ({ success: true, message: 'ok' })));
    expect(registry.hasCommand('a.b')).toBe(true);
    expect(registry.getRegisteredCommands()).toHaveLength(1);
    registry.unregisterCommand('a.b');
    expect(registry.hasCommand('a.b')).toBe(false);
    expect(disposeSpies[0]).toHaveBeenCalledTimes(1);
  });

  it('should not show an error for a successful result', async () => {
    const registry = new CommandRegistry(context);
    registry.registerCommand(meta('a.ok', async () => ({ success: true, message: 'ok' })));
    await callbacks.get('a.ok')!();
    expect(showError).not.toHaveBeenCalled();
  });

  it('should show the message and detail when the result failed', async () => {
    const registry = new CommandRegistry(context);
    registry.registerCommand(
      meta('a.fail', async () => ({ success: false, message: 'Nope', error: 'why' })),
    );
    await callbacks.get('a.fail')!();
    expect(showError).toHaveBeenCalledWith('Nope: why');
  });

  it('should show the message and log when the handler throws', async () => {
    const logger = { warn: vi.fn(), error: vi.fn() } as unknown as ILogger;
    const registry = new CommandRegistry(context, logger);
    registry.registerCommand(
      meta('a.throw', async () => {
        throw new Error('kaboom');
      }),
    );
    await callbacks.get('a.throw')!();
    expect(showError).toHaveBeenCalledWith("Command 'Title' failed: kaboom");
    expect(logger.error).toHaveBeenCalled();
  });

  it('should dispose each command once and be idempotent', () => {
    const registry = new CommandRegistry(context);
    registry.registerCommands([
      meta('a.1', async () => ({ success: true, message: '' })),
      meta('a.2', async () => ({ success: true, message: '' })),
    ]);
    registry.dispose();
    registry.dispose();
    expect(disposeSpies.map((d) => d.mock.calls.length)).toEqual([1, 1]);
    expect(registry.getRegisteredCommands()).toHaveLength(0);
  });
});
