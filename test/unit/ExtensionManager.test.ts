import * as vscode from 'vscode';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { container } from '../../src/di/container';
import { TYPES } from '../../src/di/types';
import { ExtensionManager } from '../../src/managers/ExtensionManager';

const validConfig = {
  enabled: true,
  accessibility: { verbosity: 'normal', screenReaderMode: false, keyboardNavigation: true },
};

describe('ExtensionManager', () => {
  let logger: Record<
    'debug' | 'info' | 'warn' | 'error' | 'show' | 'dispose',
    ReturnType<typeof vi.fn>
  >;
  let configDisposable: { dispose: ReturnType<typeof vi.fn> };
  let configService: {
    isEnabled: ReturnType<typeof vi.fn>;
    getConfiguration: ReturnType<typeof vi.fn>;
    onConfigurationChanged: ReturnType<typeof vi.fn>;
  };
  let registerSpy: ReturnType<typeof vi.spyOn>;
  let executeSpy: ReturnType<typeof vi.spyOn>;
  let errorToast: ReturnType<typeof vi.spyOn>;
  let commandCallbacks: Map<string, () => unknown>;

  const makeContext = () =>
    ({ subscriptions: [] as { dispose(): void }[] }) as unknown as vscode.ExtensionContext;

  beforeEach(() => {
    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn(),
    };
    configDisposable = { dispose: vi.fn() };
    configService = {
      isEnabled: vi.fn(() => true),
      getConfiguration: vi.fn(() => validConfig),
      onConfigurationChanged: vi.fn(() => configDisposable),
    };
    commandCallbacks = new Map();
    registerSpy = vi.spyOn(vscode.commands, 'registerCommand').mockImplementation(((
      id: string,
      cb: () => unknown,
    ) => {
      commandCallbacks.set(id, cb);
      return { dispose: vi.fn() };
    }) as unknown as typeof vscode.commands.registerCommand);
    executeSpy = vi.spyOn(vscode.commands, 'executeCommand').mockResolvedValue(undefined);
    errorToast = vi.spyOn(vscode.window, 'showErrorMessage');

    container.registerInstance(TYPES.Logger, logger);
    container.registerInstance(TYPES.ConfigurationService, configService);
    container.registerInstance(TYPES.AccessibilityService, {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    container.clear();
  });

  it('should validate the configuration during activation and warn on invalid values', async () => {
    configService.getConfiguration.mockReturnValueOnce({
      ...validConfig,
      accessibility: { ...validConfig.accessibility, verbosity: 'loud' },
    });
    await new ExtensionManager().activate(makeContext());

    expect(configService.getConfiguration).toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('accessibility.verbosity'));
  });

  it('should register the showOutputChannel command that shows the logger', async () => {
    const manager = new ExtensionManager();
    await manager.activate(makeContext());

    const callback = commandCallbacks.get('{{EXTENSION_ID}}.showOutputChannel');
    expect(callback).toBeTypeOf('function');
    callback?.();
    expect(logger.show).toHaveBeenCalledTimes(1);
  });

  it('should subscribe a disposer to the extension context', async () => {
    const context = makeContext();
    await new ExtensionManager().activate(context);

    expect(context.subscriptions.length).toBeGreaterThan(0);
    expect(context.subscriptions.every((s) => typeof s.dispose === 'function')).toBe(true);
  });

  it('should set the enabled context key via executeCommand', async () => {
    await new ExtensionManager().activate(makeContext());

    expect(executeSpy).toHaveBeenCalledWith('setContext', '{{EXTENSION_ID}}.enabled', true);
  });

  it('should log and rethrow without showing a toast when activation fails', async () => {
    const failure = new Error('boom');
    configService.getConfiguration.mockImplementation(() => {
      throw failure;
    });

    const manager = new ExtensionManager();
    await expect(manager.activate(makeContext())).rejects.toBe(failure);

    expect(logger.error).toHaveBeenCalledWith('Failed to activate extension', failure);
    expect(errorToast).not.toHaveBeenCalled();
    expect(registerSpy).not.toHaveBeenCalledWith(
      '{{EXTENSION_ID}}.showOutputChannel',
      expect.anything(),
    );
  });

  it('should dispose owned resources on deactivate without double-disposing', async () => {
    const context = makeContext();
    const manager = new ExtensionManager();
    await manager.activate(context);

    manager.deactivate();
    // The manager disposer registered on the context may run afterwards; it must be a no-op.
    const managerDisposer = context.subscriptions[context.subscriptions.length - 1];
    managerDisposer?.dispose();
    manager.deactivate();

    expect(configDisposable.dispose).toHaveBeenCalledTimes(1);
  });
});
