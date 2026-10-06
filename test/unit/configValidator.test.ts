import { describe, expect, it, vi } from 'vitest';
import type { ILogger } from '../../src/di/interfaces/ILogger';
import {
  ConfigValidator,
  type ExtensionConfig,
  formatValidationErrors,
  validateConfigValue,
} from '../../src/utils/configValidator';

function makeLogger(): ILogger {
  return { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() } as unknown as ILogger;
}

const base: ExtensionConfig = {
  enabled: true,
  accessibility: { verbosity: 'verbose', screenReaderMode: false, keyboardNavigation: true },
};

function withBadVerbosity(): ExtensionConfig {
  return {
    ...base,
    accessibility: { ...base.accessibility, verbosity: 'loud' as 'normal' },
  };
}

describe('ConfigValidator.validate', () => {
  it('should return a valid config unchanged without warning', () => {
    const logger = makeLogger();
    const result = ConfigValidator.validate(base, logger);
    expect(result).toEqual(base);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should fall back to normal verbosity and warn for invalid values', () => {
    const logger = makeLogger();
    const result = ConfigValidator.validate(withBadVerbosity(), logger);
    expect(result.accessibility.verbosity).toBe('normal');
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('should not mutate the input config', () => {
    const bad = withBadVerbosity();
    ConfigValidator.validate(bad, makeLogger());
    expect(bad.accessibility.verbosity).toBe('loud');
  });
});

describe('validateConfigValue', () => {
  it('should return undefined for valid values', () => {
    expect(validateConfigValue('k', 'a', ['a', 'b'] as const)).toBeUndefined();
  });

  it('should return an error with a suggestion for invalid values', () => {
    const err = validateConfigValue('k', 'z', ['a', 'b'] as const);
    expect(err?.suggestion).toContain('a, b');
  });
});

describe('formatValidationErrors', () => {
  it('should return an empty string when there are no errors', () => {
    expect(formatValidationErrors([])).toBe('');
  });

  it('should list each error with its suggestion', () => {
    const out = formatValidationErrors([
      { key: 'k', message: 'bad', value: 1, suggestion: 'use x' },
    ]);
    expect(out).toContain('k: bad');
    expect(out).toContain('Suggestion: use x');
  });
});
