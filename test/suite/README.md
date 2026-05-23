# test/suite/ — Integration Tests

End-to-end tests that run inside a live VS Code Extension Development Host.
Use these for feature-level tests that require the real VS Code API.

## What lives here

| File pattern | Purpose |
|---|---|
| `*.test.ts` | Mocha TDD test files (one per feature/command) |
| `index.ts` | Test runner loader (glob pattern, Mocha options) |
| `../fixtures/` | Static fixture files (workspace folders, sample source files) |

## Current coverage

No tests yet — this is a clean scaffold. Add your first test file here.

## Conventions

- Framework: **Mocha** + `@vscode/test-electron` (`pnpm run test:integration`).
- Compiled by `tsconfig.test.json` → `out-test/`; run via `test/runTests.ts`.
- All test descriptions must start with **`"should "`**.
- Do not test pure logic here — use `test/unit/` for that.
- On Linux CI, tests run under `xvfb-run -a` (headless display).
- Use `vscode.commands.executeCommand` to invoke commands; use `vscode.workspace` APIs for file ops.
- Avoid tight timing — use `assert`-based checks after awaiting command promises.

## How to add an integration test

1. Create `test/suite/myFeature.test.ts`:
   ```typescript
   import * as assert from 'assert';
   import * as vscode from 'vscode';

   suite('MyFeature', () => {
     test('should execute without throwing', async () => {
       await vscode.commands.executeCommand('{{EXTENSION_ID}}.myFeature');
       assert.ok(true);
     });
   });
   ```
2. Build: `npx tsc -p tsconfig.test.json`.
3. Run: `pnpm run test:integration` (requires display; use `xvfb-run -a` on Linux).

## Reference architecture

An integration suite covers each feature end-to-end:

- Extension activation + context key set (`{{EXTENSION_ID}}.enabled`).
- Command registration verified.
- Each command executed against a fixture; assert the resulting editor/workspace state.

## See also

- [`test/unit/README.md`](../unit/README.md) — fast unit tests for infrastructure
- [`test/fixtures/`](../fixtures/) — sample files for integration test scenarios
- [`LLM.txt`](../../LLM.txt) — step 10 of the add-a-feature recipe
