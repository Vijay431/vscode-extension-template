import * as vscode from 'vscode';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ILogger } from '../../src/di/interfaces/ILogger';
import { ConfigurationService } from '../../src/services/configurationService';

const logger = (): ILogger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  setLogLevel: vi.fn(),
  setLogFormat: vi.fn(),
  show: vi.fn(),
  dispose: vi.fn(),
});

type Handler = (e: { affectsConfiguration(s: string): boolean }) => void;

describe('ConfigurationService', () => {
  afterEach(() => vi.restoreAllMocks());

  it('should not expose a static getInstance', () => {
    expect(
      (ConfigurationService as unknown as Record<string, unknown>)['getInstance'],
    ).toBeUndefined();
  });

  it('should return defaults from getConfiguration', () => {
    expect(ConfigurationService.create(logger()).getConfiguration()).toEqual({
      enabled: true,
      accessibility: { verbosity: 'normal', screenReaderMode: false, keyboardNavigation: true },
    });
  });

  it('should fire change listeners only when the section is affected', () => {
    let handler: Handler | undefined;
    vi.spyOn(vscode.workspace, 'onDidChangeConfiguration').mockImplementation(((h: Handler) => {
      handler = h;
      return { dispose: () => {} };
    }) as never);
    const svc = ConfigurationService.create(logger());
    const listener = vi.fn();
    svc.onConfigurationChanged(listener);
    handler?.({ affectsConfiguration: () => false });
    expect(listener).not.toHaveBeenCalled();
    handler?.({ affectsConfiguration: () => true });
    expect(listener).toHaveBeenCalledOnce();
  });

  it('should stop notifying listeners after dispose', () => {
    let handler: Handler | undefined;
    const dispose = vi.fn();
    vi.spyOn(vscode.workspace, 'onDidChangeConfiguration').mockImplementation(((h: Handler) => {
      handler = h;
      return { dispose };
    }) as never);
    const svc = ConfigurationService.create(logger());
    const listener = vi.fn();
    svc.onConfigurationChanged(listener);
    svc.dispose();
    expect(dispose).toHaveBeenCalledOnce();
    handler?.({ affectsConfiguration: () => true });
    expect(listener).not.toHaveBeenCalled();
  });

  it('should update configuration with the requested target', async () => {
    const update = vi.fn(async () => {});
    vi.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue({ update } as never);
    await ConfigurationService.create(logger()).updateConfiguration('enabled', false, 'Workspace');
    expect(update).toHaveBeenCalledWith('enabled', false, vscode.ConfigurationTarget.Workspace);
  });
});
