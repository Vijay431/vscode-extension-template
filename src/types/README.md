# src/types/ — Shared Type Definitions

Shared TypeScript types and constants used across the extension.
No runtime logic — pure types and `const` defaults only.

## What lives here

| File | Purpose |
|---|---|
| `config.ts` | `ExtensionConfiguration`, `AccessibilityConfig`, `DEFAULT_CONFIG` |
| `extension.ts` | Extension-level shared types (re-exports `ExtensionConfiguration`) |
| `index.ts` | Barrel — re-exports from `config.ts` and `extension.ts` |

## Current types

```typescript
// config.ts
interface AccessibilityConfig {
  verbosity: 'minimal' | 'normal' | 'verbose';
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
}

interface ExtensionConfiguration {
  enabled: boolean;
  accessibility: AccessibilityConfig;
}

const DEFAULT_CONFIG: ExtensionConfiguration = { ... };
```

## Conventions

- Keep types lean — only what is shared across 2+ files.
- No imports of `vscode` or service classes here (use `src/di/interfaces/` for service contracts).
- Export everything through `index.ts` so consumers import from `'../types'`.
- Add new configuration shapes here when `contributes.configuration` grows.

## How to add types for a new feature

1. Add the interface or type to `config.ts` (if it's configuration) or `extension.ts` (if it's domain data).
2. Export from `index.ts`.
3. Update `ConfigurationService.getConfiguration()` if the type is part of the config snapshot.
4. Add `contributes.configuration.properties` entries to `package.json`.
5. Add getter to `ConfigurationService` + `IConfigurationService`.

## Reference architecture

As `contributes.configuration` grows, add a feature-specific sub-config to `ExtensionConfiguration`:

```typescript
interface ExtensionConfiguration {
  enabled: boolean;
  accessibility: AccessibilityConfig;
  myFeature: { mode: 'auto' | 'manual'; maxItems: number };  // example sub-config
}
```

`configValidator.ts` uses `validateConfigValue<T>()` to validate each string-enum field on activation.

## See also

- [`src/di/interfaces/README.md`](../di/interfaces/README.md) — service contracts (keep separate from types/)
- [`src/utils/README.md`](../utils/README.md) — `configValidator` and `DEFAULT_CONFIG` usage
- [`src/README.md`](../README.md) — layered architecture overview
