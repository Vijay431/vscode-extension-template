# Biome Migration Notes

ESLint and Prettier were replaced by [Biome](https://biomejs.dev) (lint, format, import order). `pnpm run typecheck` (`tsc`) remains the type gate.

## Mapping

| Before                                    | Now                                               |
| ----------------------------------------- | ------------------------------------------------- |
| Prettier options (`package.json`)         | `biome.json` `formatter` / `javascript.formatter` |
| `eslint-plugin-import` ordering           | Biome `organizeImports` assist                    |
| `@typescript-eslint` recommended          | Biome `recommended` plus explicit rules           |
| strict `src`, relaxed `test`              | `overrides` for `test/**`                         |
| `promise/no-nesting`, floating promises   | `noNestedPromises`, `nursery/noFloatingPromises`  |
| `no-var`, `prefer-const`, `prefer-template` | `noVar`, `useConst`, `useTemplate`              |

## Intentionally dropped

These ESLint rules have no Biome equivalent and are not enforced:

- Type-aware: `no-unnecessary-condition`, `prefer-nullish-coalescing`, `await-thenable`, `naming-convention`.
- `eslint-plugin-security`: `detect-object-injection`, `detect-non-literal-regexp`, `detect-non-literal-fs-filename`, `detect-possible-timing-attacks`, and the rest of the plugin.
- `eslint-plugin-n` and `eslint-plugin-import` path rules: `no-useless-path-segments`, `no-absolute-path`, `no-dynamic-require`.
- `eslint-plugin-promise`: `always-return`, `catch-or-return`, `no-return-wrap`, `param-names`.

Rules turned off on purpose because they conflict with the code style: `useLiteralKeys` (the TypeScript `noPropertyAccessFromIndexSignature` setting requires bracket access) and `noStaticOnlyClass` (validator utility classes).
