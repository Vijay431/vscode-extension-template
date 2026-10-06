import * as vscode from 'vscode';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { container } from '../../src/di/container';
import { TYPES } from '../../src/di/types';
import { CommandsManager } from '../../src/managers/CommandsManager';

function makeContext(): vscode.ExtensionContext {
  return { subscriptions: [] } as unknown as vscode.ExtensionContext;
}

describe('CommandsManager', () => {
  let disposeSpies: ReturnType<typeof vi.fn>[];
  let registerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    disposeSpies = [];
    registerSpy = vi.spyOn(vscode.commands, 'registerCommand').mockImplementation((() => {
      const dispose = vi.fn();
      disposeSpies.push(dispose);
      return { dispose };
    }) as unknown as typeof vscode.commands.registerCommand);

    container.registerInstance(TYPES.Logger, {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    });
    container.registerInstance(TYPES.AccessibilityService, {});
  });

  afterEach(() => {
    registerSpy.mockRestore();
    container.clear();
  });

  it('should register the helloWorld, enable and disable commands', async () => {
    const manager = new CommandsManager();
    await manager.initialize(makeContext());

    const ids = registerSpy.mock.calls.map((call: unknown[]) => call[0] as string);
    expect(ids).toContain('{{EXTENSION_ID}}.helloWorld');
    expect(ids).toContain('{{EXTENSION_ID}}.enable');
    expect(ids).toContain('{{EXTENSION_ID}}.disable');
    expect(ids).toHaveLength(3);
  });

  it('should dispose every registered command', async () => {
    const manager = new CommandsManager();
    await manager.initialize(makeContext());

    manager.dispose();

    expect(disposeSpies).toHaveLength(3);
    for (const spy of disposeSpies) {
      expect(spy).toHaveBeenCalledTimes(1);
    }
  });

  it('should be idempotent when disposed twice', async () => {
    const manager = new CommandsManager();
    await manager.initialize(makeContext());

    manager.dispose();
    expect(() => manager.dispose()).not.toThrow();

    for (const spy of disposeSpies) {
      expect(spy).toHaveBeenCalledTimes(1);
    }
  });

  it('should not throw when disposed before initialization', () => {
    expect(() => new CommandsManager().dispose()).not.toThrow();
  });
});
