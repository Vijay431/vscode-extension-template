import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      vscode: path.resolve(__dirname, 'test/__mocks__/vscode.ts'),
    },
  },
  test: {
    include: ['test/unit/**/*.test.ts'],
    passWithNoTests: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/extension.ts'],
      thresholds: {
        statements: 76,
        branches: 68,
        functions: 63,
        lines: 75,
      },
    },
  },
});
