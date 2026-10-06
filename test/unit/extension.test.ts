import * as vscode from 'vscode';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/di', () => ({
  initializeContainer: vi.fn(async () => {
    throw new Error('container failed');
  }),
}));

import { activate, deactivate } from '../../src/extension';

describe('extension entry point', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should show one error message and create the error output channel when activation fails', async () => {
    const channel = {
      appendLine: vi.fn(),
      append: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn(),
      clear: vi.fn(),
    };
    const createChannel = vi
      .spyOn(vscode.window, 'createOutputChannel')
      .mockReturnValue(channel as unknown as vscode.LogOutputChannel);
    const errorToast = vi.spyOn(vscode.window, 'showErrorMessage');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      activate({ subscriptions: [] } as unknown as vscode.ExtensionContext),
    ).resolves.toBeUndefined();

    expect(createChannel).toHaveBeenCalledTimes(1);
    expect(createChannel).toHaveBeenCalledWith('{{DISPLAY_NAME}} - Activation Error');
    expect(channel.appendLine).toHaveBeenCalledWith(expect.stringContaining('container failed'));
    expect(errorToast).toHaveBeenCalledTimes(1);
    expect(errorToast).toHaveBeenCalledWith(expect.stringContaining('container failed'));
  });

  it('should not throw when deactivated after a failed activation', () => {
    expect(() => deactivate()).not.toThrow();
  });
});
