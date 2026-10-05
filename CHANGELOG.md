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

### Added

- Unit tests for the DI container, logger, configuration and accessibility services, command handlers/registry, cache, and validators.

### Changed

- Services are now resolved only through the DI container; `ExtensionManager` no longer builds its own `Logger`/`ConfigurationService`.
- A command that returns `{ success: false }` now shows its message to the user; handlers can expose an optional `dispose()`.
- Bumped dev dependencies (vitest 4, @types/node 24, ovsx 1, concurrently 10, typescript-eslint 8.60, lint-staged 17.0.6, commitlint 21.0.2, eslint-plugin-prettier 5.5.6).

### Removed

- `getInstance()` singletons on `Logger`, `ConfigurationService` and `AccessibilityService`, and deprecated `AccessibilityService` helpers (`shouldAnnounceInternal`, `showKeyboardNavigationInternal`, `isScreenReaderMode`).

### Fixed

- `BaseCommandHandler.hasSelection()` returned `true` with no active editor.
- `memoize` ignored a custom key generator's arguments and re-ran functions that returned `undefined`.
- `Cache` evicted an unrelated entry when overwriting a key at capacity, and its cleanup timer could keep the process alive.
- `isSafeFilePath` rejected names containing `..` (e.g. `a..b.txt`); it now blocks only `..` path segments.
- `Logger` dropped falsy data (`0`, `''`, `false`); `announceProgress` guards `total <= 0`.
- Logger no longer disposed twice; activation failure shows one error toast instead of two.

[Unreleased]: {{REPO_URL}}/commits/main
