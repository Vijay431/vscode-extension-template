export interface AccessibilityConfig {
  verbosity: 'minimal' | 'normal' | 'verbose';
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
}

export interface ExtensionConfiguration {
  enabled: boolean;
  accessibility: AccessibilityConfig;
}

export const DEFAULT_CONFIG: ExtensionConfiguration = {
  enabled: true,
  accessibility: {
    verbosity: 'normal',
    screenReaderMode: false,
    keyboardNavigation: true,
  },
} as const;
