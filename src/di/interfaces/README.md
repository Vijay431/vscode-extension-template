# src/di/interfaces/ — Service Contracts

TypeScript interfaces that describe every DI-injectable service.
Consumers depend on the interface, never the concrete class.

## What lives here

| File pattern | Purpose |
|---|---|
| `I*.ts` | One interface per service (e.g. `ILogger`, `IConfigurationService`) |
| `index.ts` | Barrel — re-exports all interfaces |

## Conventions

- Pure TypeScript — no runtime logic, no imports of concrete classes.
- Name: `I{ServiceName}.ts` (PascalCase, `I` prefix).
- Export from `index.ts` barrel so consumers import from `'../di/interfaces'`.
- Mirror the public surface of the concrete service, not its internals.
- Keep method signatures minimal — add only what consumers actually need.

## Current interfaces

| Interface | Provides |
|---|---|
| `ILogger` | `debug/info/warn/error(msg, data?, category?)`, `setLogLevel`, `show`, `dispose` |
| `IConfigurationService` | `isEnabled()`, `getConfiguration()`, `updateConfiguration<T>()`, `onConfigurationChanged()`, `dispose()` |
| `IAccessibilityService` | `announce()`, `announceSuccess()`, `announceError()`, `getVerbosity()`, etc. |

## How to add a new interface

1. Create `IMyService.ts`:
   ```typescript
   export interface IMyService {
     doSomething(input: string): Promise<string>;
     dispose(): void;
   }
   ```
2. Export from `index.ts`:
   ```typescript
   export type { IMyService } from './IMyService';
   ```
3. Add a `TYPES` token in `src/di/types.ts`.
4. Implement `MyService implements IMyService` in `src/services/`.
5. Register in `src/di/container.ts`.

## Reference architecture

A mature extension has one interface per service:
`ILogger`, `IConfigurationService`, `IAccessibilityService`,
`ICodeAnalysisService`, `IFileDiscoveryService`, `IProjectDetectionService`,
`ITerminalService`, `IFileSaveService`, `IFileNamingConventionService`,
`IEnumGeneratorService`, `IEnvFileGeneratorService`, `ICronJobTimerGeneratorService`.

## See also

- [`di/README.md`](../README.md) — token registration and container usage
- [`src/README.md`](../../README.md) — layered architecture overview
