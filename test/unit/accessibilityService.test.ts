import { afterEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';

import type { ILogger } from '../../src/di/interfaces/ILogger';
import { AccessibilityService } from '../../src/services/accessibilityService';

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

describe('AccessibilityService', () => {
  afterEach(() => vi.restoreAllMocks());

  it('should not expose legacy singleton or deprecated methods', () => {
    const svc = AccessibilityService.create(logger()) as unknown as Record<string, unknown>;
    expect(
      (AccessibilityService as unknown as Record<string, unknown>)['getInstance'],
    ).toBeUndefined();
    expect(svc['isScreenReaderMode']).toBeUndefined();
    expect(svc['shouldAnnounceInternal']).toBeUndefined();
    expect(svc['showKeyboardNavigationInternal']).toBeUndefined();
  });

  it('should default to normal verbosity', () => {
    expect(AccessibilityService.create(logger()).getVerbosity()).toBe('normal');
  });

  it('should announce normal messages and skip verbose ones at normal verbosity', async () => {
    const spy = vi.spyOn(vscode.window, 'setStatusBarMessage');
    const svc = AccessibilityService.create(logger());
    await svc.announce('hi', 'normal');
    await svc.announce('detail', 'verbose');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('hi', 3000);
  });

  it('should only announce minimal messages at minimal verbosity', async () => {
    const spy = vi.spyOn(vscode.window, 'setStatusBarMessage');
    const svc = AccessibilityService.create(logger());
    svc.setVerbosity('minimal');
    await svc.announce('a', 'normal');
    await svc.announce('b', 'minimal');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('b', 3000);
  });

  it('should announce everything at verbose verbosity', async () => {
    const spy = vi.spyOn(vscode.window, 'setStatusBarMessage');
    const svc = AccessibilityService.create(logger());
    svc.setVerbosity('verbose');
    await svc.announce('v', 'verbose');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should format progress announcements', async () => {
    const spy = vi.spyOn(vscode.window, 'setStatusBarMessage');
    const svc = AccessibilityService.create(logger());
    svc.setVerbosity('verbose');
    await svc.announceProgress('Scan', 1, 4);
    expect(spy).toHaveBeenCalledWith('Scan: 1 of 4 complete, 25%', 3000);
  });

  it('should ignore progress announcements when total is zero or negative', async () => {
    const spy = vi.spyOn(vscode.window, 'setStatusBarMessage');
    const svc = AccessibilityService.create(logger());
    svc.setVerbosity('verbose');
    await svc.announceProgress('Scan', 1, 0);
    await svc.announceProgress('Scan', 1, -2);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should log an error when the announcement API throws', async () => {
    vi.spyOn(vscode.window, 'setStatusBarMessage').mockImplementation(() => {
      throw new Error('boom');
    });
    const log = logger();
    await AccessibilityService.create(log).announce('x', 'minimal');
    expect(log.error).toHaveBeenCalled();
  });

  it('should dispose the configuration listener', () => {
    const dispose = vi.fn();
    vi.spyOn(vscode.workspace, 'onDidChangeConfiguration').mockReturnValue({ dispose });
    AccessibilityService.create(logger()).dispose();
    expect(dispose).toHaveBeenCalledOnce();
  });
});
