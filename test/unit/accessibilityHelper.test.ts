import { describe, expect, it } from 'vitest';

import {
  createAccessibleFileDescription,
  createAccessibleValidationMessage,
  formatAccessibleInputPrompt,
  formatAccessiblePlaceholder,
  getAccessibleLabel,
  getKeyboardNavigationHint,
  truncateForAccessibility,
} from '../../src/utils/accessibilityHelper';

describe('accessibilityHelper', () => {
  describe('getAccessibleLabel', () => {
    it('should return only the label when no extras are given', () => {
      expect(getAccessibleLabel('Save')).toBe('Save');
    });

    it('should join label, description and detail with periods', () => {
      expect(getAccessibleLabel('Save All', 'Save all open files', '3 files')).toBe(
        'Save All. Save all open files. 3 files',
      );
    });

    it('should skip an empty description but keep the detail', () => {
      expect(getAccessibleLabel('Save', '', '3 files')).toBe('Save. 3 files');
    });
  });

  describe('formatAccessiblePlaceholder', () => {
    it('should describe an empty list', () => {
      expect(formatAccessiblePlaceholder('Select file', 0)).toBe(
        'Select file (no items available)',
      );
    });

    it('should use the singular form for one item', () => {
      expect(formatAccessiblePlaceholder('Select file', 1)).toBe('Select file (1 item available)');
    });

    it('should use the plural form for several items', () => {
      expect(formatAccessiblePlaceholder('Select file', 15)).toBe(
        'Select file (15 items available)',
      );
    });
  });

  describe('truncateForAccessibility', () => {
    it('should leave short text untouched', () => {
      expect(truncateForAccessibility('short', 10)).toBe('short');
    });

    it('should truncate long text and append the suffix within maxLength', () => {
      const result = truncateForAccessibility('abcdefghijklmnop', 10);
      expect(result).toBe('abcdefg...');
      expect(result).toHaveLength(10);
    });

    it('should honour a custom suffix', () => {
      expect(truncateForAccessibility('abcdefghij', 6, '~')).toBe('abcde~');
    });

    it('should default to a maximum of 100 characters', () => {
      expect(truncateForAccessibility('x'.repeat(150))).toHaveLength(100);
    });
  });

  describe('createAccessibleFileDescription', () => {
    const now = Date.now();

    it('should describe file and directory without a date', () => {
      expect(createAccessibleFileDescription('a.ts', 'src/components/a.ts')).toBe(
        'a.ts in src/components',
      );
    });

    it('should report just now for very recent changes', () => {
      expect(createAccessibleFileDescription('a.ts', 'src/a.ts', new Date(now))).toContain(
        'last modified just now',
      );
    });

    it('should report minutes with correct pluralisation', () => {
      expect(
        createAccessibleFileDescription('a.ts', 'src/a.ts', new Date(now - 60_000 - 500)),
      ).toContain('1 minute ago');
      expect(
        createAccessibleFileDescription('a.ts', 'src/a.ts', new Date(now - 5 * 60_000 - 500)),
      ).toContain('5 minutes ago');
    });

    it('should report hours', () => {
      expect(
        createAccessibleFileDescription('a.ts', 'src/a.ts', new Date(now - 2 * 3_600_000 - 500)),
      ).toContain('2 hours ago');
    });

    it('should report days', () => {
      expect(
        createAccessibleFileDescription('a.ts', 'src/a.ts', new Date(now - 3 * 86_400_000 - 500)),
      ).toContain('3 days ago');
    });
  });

  describe('getKeyboardNavigationHint', () => {
    it('should return the base hint by default', () => {
      expect(getKeyboardNavigationHint(false)).toBe('Use arrow keys to navigate');
    });

    it('should include the position when index and total are given', () => {
      expect(getKeyboardNavigationHint(false, 0, 5)).toBe(
        'Use arrow keys to navigate. Item 1 of 5',
      );
    });

    it('should add selection instructions when more items exist', () => {
      expect(getKeyboardNavigationHint(true, 1, 3)).toBe(
        'Use arrow keys to navigate. Item 2 of 3. Press Enter to select, Escape to cancel',
      );
    });
  });

  describe('formatAccessibleInputPrompt', () => {
    it('should return the prompt unchanged without a hint', () => {
      expect(formatAccessibleInputPrompt('Enter name')).toBe('Enter name');
    });

    it('should append the validation hint', () => {
      expect(formatAccessibleInputPrompt('Enter name', 'Must not be empty')).toBe(
        'Enter name. Validation: Must not be empty',
      );
    });
  });

  describe('createAccessibleValidationMessage', () => {
    it('should return the success message when valid', () => {
      expect(createAccessibleValidationMessage(true, 'bad', 'Looks good')).toBe('Looks good');
    });

    it('should return undefined when valid without a success message', () => {
      expect(createAccessibleValidationMessage(true)).toBeUndefined();
    });

    it('should prefix the error message when invalid', () => {
      expect(createAccessibleValidationMessage(false, 'Name cannot be empty')).toBe(
        'Error: Name cannot be empty',
      );
    });

    it('should return undefined when invalid without an error message', () => {
      expect(createAccessibleValidationMessage(false)).toBeUndefined();
    });
  });
});
