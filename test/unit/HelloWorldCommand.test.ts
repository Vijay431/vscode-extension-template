import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HelloWorldCommand } from '../../src/commands/HelloWorldCommand';
import type { ILogger } from '../../src/di/interfaces/ILogger';
import type { IAccessibilityService } from '../../src/di/interfaces/IAccessibilityService';

const mockLogger: ILogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  setLogLevel: vi.fn(),
  show: vi.fn(),
  dispose: vi.fn(),
};

const mockA11y: IAccessibilityService = {
  announce: vi.fn().mockResolvedValue(undefined),
  announceSuccess: vi.fn().mockResolvedValue(undefined),
  announceError: vi.fn().mockResolvedValue(undefined),
  announceProgress: vi.fn().mockResolvedValue(undefined),
  isScreenReaderEnabled: vi.fn().mockReturnValue(false),
  getVerbosity: vi.fn().mockReturnValue('normal'),
  setVerbosity: vi.fn(),
  createAccessibleQuickPickItem: vi.fn((item) => item),
  enhanceQuickPickOptions: vi.fn((opts) => opts),
};

describe('HelloWorldCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute and return a success result', async () => {
    const command = new HelloWorldCommand(mockLogger, mockA11y);
    const result = await command.execute();

    expect(result.success).toBe(true);
    expect(result.message).toContain('Hello');
  });

  it('should log info when executed', async () => {
    const command = new HelloWorldCommand(mockLogger, mockA11y);
    await command.execute();

    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should announce success via accessibility service', async () => {
    const command = new HelloWorldCommand(mockLogger, mockA11y);
    await command.execute();

    expect(mockA11y.announceSuccess).toHaveBeenCalled();
  });
});
