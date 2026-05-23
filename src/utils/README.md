# src/utils/ — Utilities

Stateless, standalone utilities reusable across services and command handlers.
Most have no `vscode` dependency and are fully unit-testable without mocks.

## What lives here

| File | Purpose |
|---|---|
| `logger.ts` | `Logger`: `LogLevel`, `LogFormat`, `LogCategory`; output-channel logging with text/JSON formats |
| `cache.ts` | `Cache<T>`: TTL + LRU eviction; `createCache()` factory; `memoize()` method decorator |
| `configValidator.ts` | `ConfigValidator.validate()` for string-enum settings; `validateConfigValue<T>()`, `formatValidationErrors()` |
| `pathValidator.ts` | `isSafeFilePath()`: blocks `..` traversal, `node_modules`, dangerous extensions |
| `metrics.ts` | `MetricData`, `IMetricCollector` interfaces (implement to collect performance data) |
| `accessibilityHelper.ts` | Standalone a11y functions: accessible labels, quick-pick items, screen reader hints |
| `index.ts` | Barrel — re-exports all utils |

## Conventions

- No runtime side effects at module level (no singletons created on import).
- No browser globals; no `console.*` in production code.
- Pure utils (no `vscode` imports) go in this folder and are tested without mocking.
- Utils with `vscode` imports (e.g. `accessibilityHelper`) use the `test/__mocks__/vscode.ts` alias in tests.
- Add every new utility to `index.ts`.

## Key utilities

### Logger
```typescript
const logger = Logger.create(outputChannel);   // DI factory
logger.info('message', data, LogCategory.OPERATION);
logger.error('failed', error);
logger.setLogFormat(LogFormat.JSON);
logger.setLogLevel(LogLevel.DEBUG);
```
Categories: `GENERAL` (default, no prefix), `PERFORMANCE`, `OPERATION`, `SECURITY`.

### Cache<T>
```typescript
const cache = createCache<MyData>({ ttl: 30_000, maxSize: 200 });
cache.set('key', value);
const v = cache.get('key');                    // MyData | undefined
const result = await cache.memoize('key', () => expensiveOp());
```
Use it to cache expensive lookups (e.g. workspace scans) behind a TTL.

### validateConfigValue<T>
```typescript
const err = validateConfigValue('verbosity', value, ['minimal', 'normal', 'verbose'] as const);
if (err) logger.warn(formatValidationErrors([err]));
```

### pathValidator
```typescript
if (!isSafeFilePath(userProvidedPath)) throw new Error('Unsafe path');
```

### IMetricCollector (implement to measure performance)
```typescript
class MyMetrics implements IMetricCollector {
  record(data: MetricData): void { /* store */ }
  getMetrics(): MetricData[] { return [...]; }
  getSummary() { return { count, averageDuration, successRate }; }
}
```

## How to add a new utility

1. Create `myHelper.ts` — pure functions, exported.
2. Add to `index.ts` barrel.
3. Write `test/unit/myHelper.test.ts` (Vitest; mock vscode only if needed).

## See also

- [`src/services/README.md`](../services/README.md) — services that use cache and logger
- [`src/README.md`](../README.md) — layered architecture overview
- [`test/unit/README.md`](../../test/unit/README.md) — how to test utils
