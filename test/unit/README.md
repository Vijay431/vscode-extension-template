# test/unit/ — Unit Tests

Fast, isolated tests for infrastructure utilities and services.
No live VS Code instance required — the `vscode` module is mocked.

## What lives here

| File pattern | Purpose |
|---|---|
| `*.test.ts` | One test file per utility or service |
| `../`__mocks__`/vscode.ts` | Minimal vscode mock (shared across all unit tests) |

## Current coverage

No tests yet — this is a clean scaffold. Add your first test file here.

## Conventions

- Framework: **Vitest** (`pnpm run test:unit`).
- All test descriptions must start with **`"should "`**.
- `vscode` is automatically aliased to `test/__mocks__/vscode.ts` via `vitest.config.ts`.
- Do not import concrete service classes in tests; use the mock or `static create()` factory.
- Test infrastructure utilities here. Feature logic (commands end-to-end) belongs in `test/suite/`.
- Use `vi.spyOn` for workspace/window mock overrides; call `vi.restoreAllMocks()` in `afterEach`.

## Pattern: mock logger

```typescript
function makeLogger(): ILogger {
  return { debug: () => {}, info: () => {}, warn: () => {}, error: () => {},
           setLogLevel: () => {}, show: () => {}, dispose: () => {} };
}
```

## How to add a unit test

1. Create `test/unit/myUtil.test.ts`.
2. Import from `../../src/utils/myUtil` (or `../../src/services/myService`).
3. Write `describe('MyUtil', () => { it('should ...', () => { ... }) })`.
4. Run: `pnpm run test:unit -- test/unit/myUtil.test.ts` (single file) or `pnpm run test:unit` (all).

## Reference architecture

Unit-test every util and service independently — one `*.test.ts` per unit
(e.g. `exampleService.test.ts`, `cache.test.ts`), mocking `vscode` via
`test/__mocks__/vscode.ts`.

## See also

- [`test/suite/README.md`](../suite/README.md) — end-to-end integration tests
- [`src/utils/README.md`](../../src/utils/README.md) — what's tested here
- [`LLM.txt`](../../LLM.txt) — step 9 of the add-a-feature recipe
