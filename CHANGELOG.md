# Changelog

All notable changes to **{{DISPLAY_NAME}}** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!--
HOW TO MAINTAIN THIS FILE
- Add a bullet under [Unreleased] for every user-facing change, in the same PR.
- Categories (Keep a Changelog): Added, Changed, Deprecated, Removed, Fixed, Security.
- Write for humans — describe impact, not the diff. Present tense.
- On release: rename [Unreleased] -> [x.y.z] - YYYY-MM-DD, add a fresh empty
  [Unreleased] above it, and add a compare link at the bottom.
- SemVer: breaking -> MAJOR, feature -> MINOR, fix -> PATCH.
- Map from Conventional Commits: feat: -> Added/Changed, fix: -> Fixed.
-->

## [Unreleased]

### Changed

- `.vscodeignore` is now an allowlist, and the release verifier fails on any VSIX file outside it or on shipped JS that references a source map.

### Added

- `Template Check` workflow that typechecks, lints, tests and builds the template repository itself; `install.sh` removes it from generated projects.
- `install.sh` now runs on macOS's bash 3.2, and `TEMPLATE_REPO_URL` / `TEMPLATE_BRANCH` can be overridden via environment.
- Unit tests for the DI container, logger, configuration and accessibility services, command handlers/registry, cache, and validators.

- Integration tests run through `@vscode/test-cli` (`.vscode-test.mjs`).
- `release-gate.sh`, and a `Release` workflow that starts from a `v*` tag push, can be re-run by allowlisted actors (`RELEASE_WHITELIST_ACTORS`), skips versions already published, and attests the `.vsix` build provenance.
- `security-daily`, `codeql`, and `scorecard` workflows, a private vulnerability report form, `SUPPORT.md`, `codecov.yml`, `AGENTS.md`, `ARCHITECTURE.md`, and `.coderabbit.yaml`.
- Issue forms for bug reports and feature requests, plus configuration, cross-platform, performance, and refactoring templates.
- `docs/sync.md`: the baseline checklist for sibling extensions.

### Changed

- **BREAKING:** `test:integration` no longer uses `out-test/test/runTests.js`; it runs `vscode-test`.
- Every workflow action is pinned to a commit SHA, and `build` runs on Node.js 24.x and 26.x.
- `install.sh` checks for Node.js 22.12+ (24 recommended) before bootstrapping, and its leftover-token check now also covers `.txt`, `.mjs` and `.cjs` files.
- Services are now resolved only through the DI container; `ExtensionManager` no longer builds its own `Logger`/`ConfigurationService`.
- A command that returns `{ success: false }` now shows its message to the user; handlers can expose an optional `dispose()`.
- Development toolchain targets Node.js 24 (`engines.node`, `.nvmrc`, CI, docs). The bundled extension is built with esbuild `target: node18` and has no runtime dependencies, so it runs on Node.js 18+.
- Bumped dev dependencies (esbuild 0.28.2, ovsx 1.2, mocha 12, @vscode/vsce 4, @vscode/test-electron 3, @commitlint/cli 21.2). `@types/vscode` stays at the `engines.vscode` floor (`^1.111.0`) because `vsce` rejects types newer than the engine.
- Bumped dev dependencies (vitest 4, @types/node 24, ovsx 1, concurrently 10, typescript-eslint 8.60, lint-staged 17.0.6, commitlint 21.0.2, eslint-plugin-prettier 5.5.6).

### Removed

- `pr-commit-size` and `stale` workflows, `check-commit-size.sh`, `commit-size-excludes.txt`, `convert-encoding.sh`, `runTests.ts`, `test/suite/index.ts`, and the `glob` and `mocha` dev dependencies.
- ESLint and Prettier (and their plugins/configs), replaced by Biome. See `docs/biome-migration.md` for the rules that were not carried over.
- `getInstance()` singletons on `Logger`, `ConfigurationService` and `AccessibilityService`, and deprecated `AccessibilityService` helpers (`shouldAnnounceInternal`, `showKeyboardNavigationInternal`, `isScreenReaderMode`).

### Fixed

- `install.sh` failed on bash 3.2 (`${var,,}` and `mapfile`).
- `BaseCommandHandler.hasSelection()` returned `true` with no active editor.
- `memoize` ignored a custom key generator's arguments and re-ran functions that returned `undefined`.
- `Cache` evicted an unrelated entry when overwriting a key at capacity, and its cleanup timer could keep the process alive.
- `isSafeFilePath` rejected names containing `..` (e.g. `a..b.txt`); it now blocks only `..` path segments.
- `Logger` dropped falsy data (`0`, `''`, `false`); `announceProgress` guards `total <= 0`.
- Logger no longer disposed twice; activation failure shows one error toast instead of two.

[Unreleased]: {{REPO_URL}}/commits/main
