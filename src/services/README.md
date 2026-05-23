# src/services/ — Business Logic Services

Services are the domain-logic layer. Each service is a singleton focused on one concern,
registered in the DI container and injected into command handlers via their constructors.

## What lives here

| File pattern | Purpose |
|---|---|
| `*Service.ts` | One service per domain (e.g. `configurationService.ts`, `accessibilityService.ts`) |

## Current services

| Service | Provides |
|---|---|
| `configurationService.ts` | Reads/writes VS Code settings; fires change events; `getConfiguration()`, `updateConfiguration<T>()` |
| `accessibilityService.ts` | Screen reader announcements, verbosity levels, ARIA helpers |

## Conventions

- Every service is a **singleton** via `static create(logger, ...)` factory; never `new MyService()`.
- Register in `src/di/container.ts` `initializeContainer()`.
- Define an `I*Service` interface in `src/di/interfaces/`; implement it here.
- Add a `TYPES.MyService` token in `src/di/types.ts`.
- Large or rarely-used services should be **lazy-loaded**:
  1. Add the path to `lazyServices` in `esbuild.config.ts`.
  2. Use `const { MyService } = await import('../services/myService')` inside the command handler.
  3. Do NOT register lazy services in `initializeContainer`.
- Use `this.logger` for all logging; never `console.*`.
- Dispose resources (event listeners, file watchers, caches) in a `dispose()` method.

## How to add a new service

1. Add interface `src/di/interfaces/IMyService.ts` (see `interfaces/README.md`).
2. Add token `src/di/types.ts`: `MyService: Symbol.for('MyService')`.
3. Implement `src/services/myService.ts`:
   ```typescript
   export class MyService implements IMyService {
     private constructor(private readonly logger: ILogger) {}
     public static create(logger: ILogger): MyService {
       return new MyService(logger);
     }
     // ...methods
     public dispose(): void { /* clean up */ }
   }
   ```
4. Register in `src/di/container.ts`:
   ```typescript
   container.registerSingleton(TYPES.MyService, () =>
     MyService.create(container.get<ILogger>(TYPES.Logger))
   );
   ```
5. Unit-test in `test/unit/myService.test.ts` (Vitest, mocked vscode).

## Reference architecture

As an extension grows, it adds services such as (generic examples — replace with your own):

- **`exampleAnalysisService`** — wraps a parser/AST or external API behind a clean interface.
- **`exampleDiscoveryService`** — scans the workspace using `Cache<T>` for TTL-based caching;
  avoids repeated filesystem traversals.
- **`exampleDetectionService`** — inspects `package.json`/files to branch behavior.
- **`exampleGeneratorService`** — produces files or code from user input.

Each is a singleton, injected via DI, tested independently.

## See also

- [`src/di/README.md`](../di/README.md) — DI container and token registration
- [`src/commands/README.md`](../commands/README.md) — how services are injected into commands
- [`src/utils/README.md`](../utils/README.md) — reusable utilities (cache, logger, etc.)
- [`LLM.txt`](../../../LLM.txt) — step-by-step add-a-feature recipe
