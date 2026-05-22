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

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  key: string;
  message: string;
  value: unknown;
  suggestion?: string;
}

export function validateConfigValue<T extends string>(
  key: string,
  value: T,
  validValues: readonly T[],
): ValidationError | undefined {
  if (validValues.includes(value)) {
    return undefined;
  }
  return {
    key,
    message: `Invalid value for ${key}`,
    value,
    suggestion: `Must be one of: ${validValues.join(', ')}`,
  };
}

export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return '';
  }
  const lines = ['Configuration validation errors:', ''];
  for (const error of errors) {
    lines.push(`  - ${error.key}: ${error.message}`);
    if (error.suggestion) {
      lines.push(`    Suggestion: ${error.suggestion}`);
    }
  }
  return lines.join('\n');
}
