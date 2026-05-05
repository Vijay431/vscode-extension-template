# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. It is the single source of truth for architecture, conventions, and development workflow. Update it whenever structure or conventions change.

---

## Project Overview

- **Name:** {{DISPLAY_NAME}}
- **Publisher:** {{PUBLISHER}}
- **VS Code engine:** >=1.110.0
- **Node.js:** >=20
- **Package manager:** pnpm
- **Language:** TypeScript (strict mode)
- **Bundle tool:** esbuild (via `esbuild.config.ts`)

---

## Development Commands

```bash
pnpm run init             # first-time bootstrap: replace {{TOKEN}} placeholders, then self-deletes
pnpm install              # install dependencies
pnpm run build            # build extension (~1s)
pnpm run watch            # watch mode
pnpm run clean            # remove dist/ and *.vsix
pnpm run rebuild          # clean + build + package
pnpm run package          # production build (.vsix)
pnpm run lint             # ESLint
pnpm run lint:fix         # auto-fix lint issues
pnpm run format           # format files with Prettier
pnpm run test:unit        # run unit tests (Vitest)
pnpm run test:integration # run integration tests (Mocha + VS Code, requires display)
pnpm run publish          # publish to VS Code Marketplace
pnpm run publish:openvsx  # publish to Open VSX Registry
pnpm run site:serve       # serve Jekyll GitHub Pages site locally
```

Run a single unit test file: `pnpm run test:unit -- test/unit/MyCommand.test.ts`
Run tests matching a pattern: `pnpm run test:unit -- -t "should execute"`

Press **F5** in VS Code to launch the Extension Development Host.

---

## Source Structure

```
src/
  extension.ts                  # activation entry point
  managers/
    ExtensionManager.ts         # lifecycle coordinator
    CommandsManager.ts          # command registration — add new commands here
    CommandRegistry.ts          # generic command registry
  commands/
    BaseCommandHandler.ts       # abstract base — extend this for every command
    ICommandHandler.ts
    HelloWorldCommand.ts        # starter command — copy and rename for your commands
  services/
    configurationService.ts     # VS Code settings access and change events
    accessibilityService.ts     # screen reader announcements and ARIA helpers
  di/
    container.ts                # DI container (singleton pattern)
    types.ts                    # DI token symbols
    interfaces/                 # ILogger, IConfigurationService, IAccessibilityService
  types/
    config.ts                   # ExtensionConfiguration type
    extension.ts                # extension-level shared types
  utils/
    logger.ts                   # output-channel logger
    cache.ts                    # LRU + TTL generic cache
    configValidator.ts          # runtime config validation
    pathValidator.ts            # path sanitization helpers
    metrics.ts                  # lightweight performance metrics
    accessibilityHelper.ts      # ARIA + Quick Pick a11y helpers
test/
  __mocks__/vscode.ts           # minimal vscode mock for Vitest unit tests
  unit/                         # Vitest unit tests (infrastructure, no VS Code API)
  suite/                        # Mocha integration tests (feature-level, live VS Code)
  fixtures/                     # test fixture files
  runTests.ts                   # @vscode/test-electron launcher
site/                           # Jekyll GitHub Pages site
```

---

## How to Add a Command

1. **Copy** `src/commands/HelloWorldCommand.ts` → `src/commands/MyFeatureCommand.ts`
2. **Rename** the class. The constructor signature is `(logger: ILogger, a11y: IAccessibilityService)` — pass `'MyFeatureCommand'` as the `name` to `super()`. Implement `execute()` returning `CommandResult` via `this.success()` or `this.error()`.
3. **Register** it in `src/managers/CommandsManager.ts`:
   ```typescript
   this.registry.registerCommand({
     id: '{{EXTENSION_ID}}.myFeature',
     title: 'My Feature',
     category: '{{DISPLAY_NAME}}',
     handlerFactory: () => new MyFeatureCommand(logger, a11y),
   });
   ```
4. **Add** the command to `package.json` `contributes.commands`.
5. **Test** it:
   - Unit: `test/unit/MyFeatureCommand.test.ts`
   - Integration: `test/suite/myFeature.test.ts`
6. **Document** it:
   - Site page: `site/services/myFeature.md`
   - Update `CHANGELOG.md` under `[Unreleased]`

---

## DI Container Pattern

- All services are singletons registered in `src/di/container.ts` via `container.registerSingleton(TYPES.Token, factory)`.
- Services are instantiated via static factory methods (`ServiceName.create(...)`) or `ServiceName.getInstance()` — not `new ServiceName()`.
- DI tokens are `symbol` constants defined in `src/di/types.ts`; interfaces live in `src/di/interfaces/`.
- Child containers (`container.createChild()`) are supported for test isolation.
- Add new tokens to `TYPES` before registering a new service.

### Lazy loading (for large features)

Services that are rarely used or have heavy dependencies should be lazy-loaded:
1. Add the service file path to the `lazyServices` array in `esbuild.config.ts`.
2. Use `const { MyService } = await import('../services/myService')` inside the command handler.
3. Do NOT register the service in `initializeContainer` — it will be loaded on first use.

---

## Test Conventions

- **Unit tests** (`test/unit/`, run with `pnpm run test:unit`): infrastructure utilities and services where VS Code API is mocked. No live VS Code instance required.
- **Integration tests** (`test/suite/`, run with `pnpm run test:integration`): feature-level tests that exercise commands end-to-end in a real VS Code Extension Development Host.
- Never add VS Code API-dependent logic to unit tests; never add pure-logic tests to the integration suite.
- On Linux CI, integration tests run under `xvfb-run -a`.
- All test descriptions must start with `"should "`.

---

## Settings Convention

All settings live under the `{{EXTENSION_ID}}` namespace in `package.json` `contributes.configuration`. The `ConfigurationService` reads them via `vscode.workspace.getConfiguration('{{EXTENSION_ID}}')`.

Add new settings:
1. Define the property in `package.json` `contributes.configuration.properties`.
2. Add a getter method to `ConfigurationService`.
3. Add the interface method to `IConfigurationService`.
4. Update `CLAUDE.md`.

---

## Release & Versioning Strategy

| Minor | Line | Publishes as |
|-------|------|-------------|
| Even  | Stable | Stable release |
| Odd   | Pre-release | Pre-release |

**Tag to release:**
```bash
git tag v0.0.1 && git push origin v0.0.1        # stable
git tag v0.1.0-beta.1 && git push origin v0.1.0-beta.1  # pre-release
```

CI auto-detects pre-release from tag suffix (`-rc`, `-beta`, `-alpha`, `-next`).

---

## Steps to Follow

- All new changes should be added to this `CLAUDE.md` file.
- All user-visible changes should be added to `docs/`, `site/`, and `README.md`.
- All changes should be logged in `CHANGELOG.md` under `[Unreleased]`.
