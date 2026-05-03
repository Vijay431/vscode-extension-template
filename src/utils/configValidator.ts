import type { ILogger } from '../di/interfaces/ILogger';

const VALID_VERBOSITY = ['minimal', 'normal', 'verbose'] as const;

export interface ExtensionConfig {
  enabled: boolean;
  accessibility: {
    verbosity: 'minimal' | 'normal' | 'verbose';
    screenReaderMode: boolean;
    keyboardNavigation: boolean;
  };
}

export class ConfigValidator {
  public static validate(config: ExtensionConfig, logger: ILogger): ExtensionConfig {
    const result: ExtensionConfig = {
      ...config,
      accessibility: { ...config.accessibility },
    };

    if (!(VALID_VERBOSITY as readonly string[]).includes(result.accessibility.verbosity)) {
      logger.warn(
        `Invalid value for "accessibility.verbosity": "${result.accessibility.verbosity}". ` +
          `Falling back to "normal". Valid values are: ${VALID_VERBOSITY.join(', ')}.`,
      );
      result.accessibility.verbosity = 'normal';
    }

    return result;
  }
}
