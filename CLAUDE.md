# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. It is the single source of truth for architecture, conventions, and development workflow. Update it whenever structure or conventions change.

---

## Template Setup

This is a scaffold template. Every `{{TOKEN}}` placeholder (including in this file) is replaced by the bootstrap script. Two paths:

**Option A — Curl one-liner (no clone needed):**
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Vijay431/vscode-extension-template/main/install.sh)
```
Script prompts for inputs, clones the template into `./<extension-name>/`, removes the template's `.git/`, replaces all tokens, and self-deletes.

**Option B — Already cloned / GitHub template:**
```bash
pnpm run init   # interactive prompts → confirms values → enables workflow placeholders → self-deletes install.sh
```

Tokens used: `{{EXTENSION_NAME}}`, `{{DISPLAY_NAME}}`, `{{EXTENSION_ID}}`, `{{PUBLISHER}}`, `{{DESCRIPTION}}`, `{{AUTHOR_NAME}}`, `{{AUTHOR_EMAIL}}`, `{{REPO_URL}}`, `{{SITE_URL}}`, `{{YEAR}}`, `{{GITHUB_USERNAME}}`.

---

## Project Overview

- **Name:** {{DISPLAY_NAME}}
- **Publisher:** {{PUBLISHER}}
- **VS Code engine:** >=1.111.0
- **Node.js:** >=22
- **Package manager:** pnpm
- **Language:** TypeScript (strict mode)
- **Bundle tool:** esbuild (via `esbuild.config.ts`)

---

## Development Commands

```bash
pnpm run init             # first-time bootstrap: replace {{TOKEN}} placeholders, enable workflows, then self-deletes
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
pnpm run test:unit:coverage # run unit tests with v8 coverage (outputs coverage/lcov.info)
pnpm run test:integration # run integration tests (Mocha + VS Code, requires display)
pnpm run publish          # publish to VS Code Marketplace
pnpm run publish:openvsx  # publish to Open VSX Registry
pnpm run site:serve       # serve Jekyll GitHub Pages site locally
pnpm run site:live        # serve Jekyll site with live-reload
pnpm run system:verify    # verify husky hooks + bundle install for Jekyll site
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
out-test/                       # integration test compile output (tsconfig.test.json, gitignored)
site/                           # Jekyll GitHub Pages site
```

---

## Built-in Commands

The template ships with these commands already wired (no action needed):

| Command ID | Purpose |
|---|---|
| `{{EXTENSION_ID}}.enable` | Sets `{{EXTENSION_ID}}.enabled` config to `true` |
| `{{EXTENSION_ID}}.disable` | Sets `{{EXTENSION_ID}}.enabled` config to `false` |
| `{{EXTENSION_ID}}.showOutputChannel` | Reveals the extension's output channel |
| `{{EXTENSION_ID}}.helloWorld` | Starter command (copy and replace) |

The `{{EXTENSION_ID}}.enabled` VS Code context key is set on activation. Use it in `package.json` `when` clauses to gate command palette visibility, as the template already does for `helloWorld`.

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

## Command Handler Lifecycle

`CommandRegistry.registerCommand` calls the `handlerFactory` immediately at registration time and holds the resulting instance for the lifetime of the extension. The same handler instance is reused for every invocation of that command. Keep handlers stateless, or explicitly reset any state at the start of `execute()`.

Never use `console.log` / `console.error` in handler or service code — esbuild strips all `console` calls from production builds. Use `this.logger` / `this.logInfo()` etc. instead.

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

This project follows [SemVer 2.0.0](https://semver.org/spec/v2.0.0.html). Pre-release vs stable is determined by **tag suffix only**.

### How CI detects pre-release

After `install.sh` enables workflow placeholders, the `setup` job in `.github/workflows/release.yml` checks the tag for `-rc`, `-next`, `-beta`, or `-alpha`:

```bash
if echo "$VERSION" | grep -qE '\-(rc|next|beta|alpha)'; then
  echo "is_prerelease=true"
fi
```

- **Pre-release tags** → both marketplaces publish with `--pre-release`; GitHub Pages deploy is skipped.
- **Stable tags** → both marketplaces publish as stable; GitHub Pages deploy runs.

### Required GitHub secrets

Set these in your repository's **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `VSCE_PAT` | VS Code Marketplace Personal Access Token |
| `OVSX_PAT` | Open VSX Registry access token |

### Tagging examples

```bash
# Stable patch release
git tag v1.0.1 && git push origin v1.0.1

# Pre-release
git tag v1.1.0-beta.1 && git push origin v1.1.0-beta.1

# Graduate pre-release to stable (no package.json change needed)
git tag v1.1.0 && git push origin v1.1.0
```

---

## Repository Infrastructure

### CI / Release pipeline

- **`ci.yml.init`** — placeholder renamed to `ci.yml` by `install.sh`; then triggers on pushes to `main` and on pull requests. Runs lint, build, and unit tests. Does **not** publish or deploy.
- **`release.yml.init`** — placeholder renamed to `release.yml` by `install.sh`; then triggered by version tags (`v*`). Full pipeline: `setup` → `release-build` → `verifier` → `publish-vscode` + `publish-openvsx` (parallel) → `deploy-pages` + `create-release` (parallel, stable only). The `setup` job sets `is_prerelease=true` when the tag contains `-rc`, `-next`, `-beta`, or `-alpha`.

### GitHub automation workflows

- **`all-contributors.yml.init`** — placeholder enabled by `install.sh`; then responds to `/all-contributors add` comments and manages `.all-contributorsrc`.
- **`stale.yml.init`** — placeholder enabled by `install.sh`; then marks issues/PRs stale after 60 days of inactivity and closes after a further 14 days.
- **`labels-sync.yml.init`** — placeholder enabled by `install.sh`; then syncs repository labels from `.github/labels.yml` on push to `main`.

### Configuration files

- **`.github/labels.yml`** — defines 14 repository labels (type, priority, status categories).
- **`.github/release.yml`** — configures auto-generated release notes categories (features, fixes, chores, etc.).

### Devcontainer

`.devcontainer/` provides a Node 22 base image pre-installed with headless test dependencies (`xvfb`, GTK libraries) required for VS Code integration tests. `pnpm install` runs automatically on container create.

### AI tooling

| File | Purpose |
|---|---|
| `.coderabbit.yaml` | CodeRabbit AI review config (test suite awareness enabled) |
| `.github/copilot-instructions.md` | GitHub Copilot workspace instructions |
| `CLAUDE.md` | Claude Code instructions (this file) |
| `AGENTS.md` | Generic AI agent instructions |
| `.cursorignore` | Cursor editor ignore rules |

### All-contributors

`.all-contributorsrc` configures the all-contributors bot. `projectName` and `projectOwner` are wired to `{{EXTENSION_NAME}}` and `{{GITHUB_USERNAME}}` tokens; `contributors` array starts empty.

### Documentation assets

- **`NOTICE.md`** — third-party software notices.
- **`THIRDPARTY.md`** — license table for bundled dependencies.
- **`docs/images/`** — media assets for README and VS Code Marketplace listing.

### Coverage

`pnpm run test:unit:coverage` runs Vitest with the v8 provider and outputs `coverage/lcov.info`. In CI this file is uploaded to Codecov automatically.

---

## Hard Constraints

- **pnpm only** — never suggest npm or yarn commands.
- **Zero runtime dependencies** — do not add entries to `dependencies` in `package.json`; all deps must be `devDependencies`.
- **No browser globals** — `window`, `document`, `fetch`, `localStorage` are forbidden; all editor interactions use the `vscode` API.
- **TypeScript strict mode** — flag any `any` usage, unused locals, or unhandled promise rejections; do not weaken tsconfig.
- **`console.*` exception** — `console.error` is intentionally used in `src/extension.ts` activation error path only (logger not yet initialized). Everywhere else use `this.logger` / `this.logInfo()` etc.

---

## Commit & Branch Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat(scope): description`, `fix(scope): description`, `chore(scope): description`.

Examples: `feat(hello): add greeting command`, `fix(config): respect disabled state`, `test(unit): cover config validator`.

Branch prefixes: `feature/`, `fix/`, `docs/`, `refactor/`. Hooks and CI enforce a maximum of **10 files** and **400 changed lines** per commit. Use the `size/override` label on a PR to bypass the CI size check for large sweeping refactors.

---

## Bundle Size Targets

Production builds only (minified). Dev builds include inline sourcemaps and are naturally larger.

| Artifact | Target |
|---|---|
| `dist/extension.js` | < 100 KB |
| Each `dist/lazy/*.js` | < 50 KB |

esbuild reports warnings when these are exceeded. Check `dist/meta.json` for bundle analysis.

---

## Steps to Follow

- All new changes should be added to this `CLAUDE.md` file.
- All user-visible changes should be added to `docs/`, `site/`, and `README.md`.
- All changes should be logged in `CHANGELOG.md` under `[Unreleased]`.
