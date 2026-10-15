import * as path from 'node:path';

export function isSafeFilePath(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }

  const normalizedPath = path.normalize(filePath);

  const segments = normalizedPath.split(/[/\\]/);
  if (segments.includes('..') || segments.includes('node_modules')) {
    return false;
  }

  const ext = path.extname(filePath).toLowerCase();
  const dangerousExts = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.jar'];

  return !dangerousExts.includes(ext);
}
