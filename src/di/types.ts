export const TYPES = {
  Logger: Symbol.for('Logger'),
  ConfigurationService: Symbol.for('ConfigurationService'),
  AccessibilityService: Symbol.for('AccessibilityService'),
} as const;

export type DiToken = (typeof TYPES)[keyof typeof TYPES];
