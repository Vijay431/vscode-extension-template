import { describe, it, expect } from 'vitest';
import { ConfigValidator, type ExtensionConfig } from '../../src/utils/configValidator';
import type { ILogger } from '../../src/di/interfaces/ILogger';

function makeLogger(): ILogger & { warnings: string[] } {
  const warnings: string[] = [];
  return {
    warnings,
    debug: () => {},
    info: () => {},
    warn: (msg: string) => {
      warnings.push(msg);
    },
    error: () => {},
    dispose: () => {},
  };
}

function validConfig(): ExtensionConfig {
  return {
    enabled: true,
    accessibility: { verbosity: 'normal', screenReaderMode: false, keyboardNavigation: true },
  };
}

describe('ConfigValidator.validate', () => {
  it('should return config unchanged when all values are valid', () => {
    const logger = makeLogger();
    const result = ConfigValidator.validate(validConfig(), logger);
    expect(result.accessibility.verbosity).toBe('normal');
    expect(logger.warnings).toHaveLength(0);
  });

  it('should replace an invalid verbosity with the default and warn', () => {
    const logger = makeLogger();
    const config = validConfig();
    (config.accessibility.verbosity as string) = 'extreme';
    const result = ConfigValidator.validate(config, logger);
    expect(result.accessibility.verbosity).toBe('normal');
    expect(logger.warnings.some((w) => w.includes('verbosity'))).toBe(true);
  });

  it('should not mutate the original config', () => {
    const logger = makeLogger();
    const config = validConfig();
    (config.accessibility.verbosity as string) = 'bad';
    ConfigValidator.validate(config, logger);
    expect(config.accessibility.verbosity as string).toBe('bad');
  });
});
