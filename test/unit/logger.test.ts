import { describe, expect, it, vi } from 'vitest';

import { LogFormat, LogLevel, Logger } from '../../src/utils/logger';

function makeChannel() {
  return {
    appendLine: vi.fn(),
    append: vi.fn(),
    show: vi.fn(),
    dispose: vi.fn(),
    clear: vi.fn(),
  };
}

describe('Logger', () => {
  it('should not expose a static getInstance', () => {
    expect((Logger as unknown as Record<string, unknown>)['getInstance']).toBeUndefined();
  });

  it('should create independent instances', () => {
    expect(Logger.create(makeChannel() as never)).not.toBe(Logger.create(makeChannel() as never));
  });

  it('should skip messages below the log level', () => {
    const ch = makeChannel();
    const logger = Logger.create(ch as never);
    logger.debug('hidden');
    expect(ch.appendLine).not.toHaveBeenCalled();
    logger.setLogLevel(LogLevel.DEBUG);
    logger.debug('shown');
    expect(ch.appendLine).toHaveBeenCalledTimes(1);
  });

  it('should write data in text format when data is falsy but defined', () => {
    const ch = makeChannel();
    const logger = Logger.create(ch as never);
    logger.info('zero', 0);
    expect(ch.appendLine).toHaveBeenCalledTimes(2);
    expect(ch.appendLine.mock.calls[1]?.[0]).toContain('Data: 0');
  });

  it('should omit the data line when data is undefined', () => {
    const ch = makeChannel();
    Logger.create(ch as never).info('plain');
    expect(ch.appendLine).toHaveBeenCalledTimes(1);
  });

  it('should include falsy data in JSON format', () => {
    const ch = makeChannel();
    const logger = Logger.create(ch as never);
    logger.setLogFormat(LogFormat.JSON);
    logger.info('flag', false);
    const entry = JSON.parse(ch.appendLine.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(entry['data']).toBe(false);
  });

  it('should omit data key in JSON format when data is undefined', () => {
    const ch = makeChannel();
    const logger = Logger.create(ch as never);
    logger.setLogFormat(LogFormat.JSON);
    logger.info('none');
    const entry = JSON.parse(ch.appendLine.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect('data' in entry).toBe(false);
  });

  it('should dispose the output channel', () => {
    const ch = makeChannel();
    Logger.create(ch as never).dispose();
    expect(ch.dispose).toHaveBeenCalledOnce();
  });
});
