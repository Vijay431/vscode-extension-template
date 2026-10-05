import { describe, expect, it } from 'vitest';
import { isSafeFilePath } from '../../src/utils/pathValidator';

describe('isSafeFilePath', () => {
  it('should accept ordinary relative paths', () => {
    expect(isSafeFilePath('src/index.ts')).toBe(true);
  });

  it('should allow double dots inside a file name', () => {
    expect(isSafeFilePath('a..b.txt')).toBe(true);
    expect(isSafeFilePath('dir/a..b.txt')).toBe(true);
  });

  it('should reject parent directory traversal segments', () => {
    expect(isSafeFilePath('../x')).toBe(false);
    expect(isSafeFilePath('../../etc/passwd')).toBe(false);
    expect(isSafeFilePath('a/../../x')).toBe(false);
  });

  it('should reject backslash traversal segments', () => {
    expect(isSafeFilePath('..\\x')).toBe(false);
  });

  it('should reject node_modules paths', () => {
    expect(isSafeFilePath('node_modules/pkg/index.json')).toBe(false);
  });

  it('should reject dangerous extensions', () => {
    for (const ext of ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.jar']) {
      expect(isSafeFilePath(`tool${ext}`)).toBe(false);
    }
    expect(isSafeFilePath('TOOL.EXE')).toBe(false);
  });

  it('should reject empty and non-string input', () => {
    expect(isSafeFilePath('')).toBe(false);
    expect(isSafeFilePath(undefined as unknown as string)).toBe(false);
  });
});
