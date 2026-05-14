# Copilot Instructions

This is a TypeScript VS Code extension scaffold using pnpm, esbuild, Vitest unit tests, and Mocha plus `@vscode/test-electron` integration tests.

## Architecture

The codebase follows a layered pattern:

- **Entry point:** `src/extension.ts` activates the extension and bootstraps the DI container and `ExtensionManager`.
- **Managers:** `src/managers/ExtensionManager.ts` coordinates lifecycle; `src/managers/CommandsManager.ts` registers all commands using `src/managers/CommandRegistry.ts`.
- **Commands:** `src/commands/` — each command extends `BaseCommandHandler` (implements `ICommandHandler`). The `execute()` method returns a `CommandResult` via `this.success()` or `this.error()`. Copy `HelloWorldCommand.ts` as your starting point.
- **Services:** `src/services/configurationService.ts` reads VS Code settings; `src/services/accessibilityService.ts` provides screen reader announcements.
- **DI container:** `src/di/container.ts` holds all service singletons. Tokens are `symbol` constants in `src/di/types.ts`; contracts live in `src/di/interfaces/`.
- **Utilities:** `src/utils/` — `logger.ts`, `cache.ts`, `configValidator.ts`, `pathValidator.ts`, `metrics.ts`, `accessibilityHelper.ts`.
- **Tests:** `test/unit/` (Vitest, no live VS Code) and `test/suite/` (Mocha integration, live Extension Development Host).

Keep `README.md`, `CHANGELOG.md`, and `site/` aligned with behavior changes.

## Development Rules

- Use pnpm exclusively — do not suggest npm or yarn commands.
- TypeScript strict mode is enabled; flag any `any` usage, unused locals, or unhandled promise rejections.
- Never use `console.log` / `console.error` in extension code — use the injected `logger` (`this.logInfo()`, etc.). esbuild strips all `console` calls from production builds.
- All services must be registered through the DI container (`container.registerSingleton`); never instantiate services with `new` outside the container.
- Zero runtime dependencies by design — do not add entries to `dependencies` in `package.json`.
- No browser globals (`window`, `document`, `fetch`, `localStorage`) — all editor interactions use the `vscode` API.
- Prefer focused changes and Conventional Commits.
- Update `package.json`, related types, tests, and docs together when configuration or command behavior changes.

## Commands

Built-in commands shipped with the template:

| Command ID | Purpose |
|---|---|
| `{{EXTENSION_ID}}.enable` | Sets `{{EXTENSION_ID}}.enabled` config to `true` |
| `{{EXTENSION_ID}}.disable` | Sets `{{EXTENSION_ID}}.enabled` config to `false` |
| `{{EXTENSION_ID}}.showOutputChannel` | Reveals the extension's output channel |
| `{{EXTENSION_ID}}.helloWorld` | Starter command — copy and rename for new commands |

Development commands:

- Install: `pnpm install`
- Build: `pnpm run build`
- Lint: `pnpm run lint`
- Unit tests: `pnpm run test:unit`
- Integration tests: `pnpm run test:integration`
- Package VSIX: `pnpm run package`
