# VS Code Extension Template

A production-ready, opinionated template for building VS Code extensions. Mirrors the architecture of a published extension: DI container, manager/command/service split, esbuild bundler with lazy-chunk support, Vitest unit tests, Mocha integration tests, Jekyll docs site, and dual-marketplace CI (VS Code Marketplace + Open VSX).

## What's included

| Layer | Details |
|---|---|
| **Build** | esbuild with lazy-service chunk splitting; production minification; bundle size reporting |
| **DI container** | Lightweight singleton container — no InversifyJS dependency |
| **Commands** | `BaseCommandHandler` abstract class + `ICommandHandler` interface; `CommandsManager` registers all commands |
| **Services** | `ConfigurationService`, `AccessibilityService` wired at startup |
| **Utils** | `Logger`, `Cache` (LRU + TTL), `ConfigValidator`, `PathValidator`, accessibility helpers |
| **Tests** | Vitest unit tests (no live VS Code); Mocha integration tests (live Extension Host via `@vscode/test-electron`) |
| **CI/CD** | Placeholder GitHub Actions that become active after bootstrap: lint → unit tests → integration tests → cross-platform build → release → dual publish → GitHub Pages |
| **Docs site** | Jekyll on GitHub Pages; assets/layouts/pages included |
| **Starter command** | Hello World wired end-to-end (DI → manager → command → test) |

## Bootstrap a new extension

### Option A — Curl one-liner (recommended)

No clone needed. Run from any directory:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Vijay431/vscode-extension-template/main/install.sh)
```

The script prompts for your extension name and other details, clones the template into `./<extension-name>/`, removes the template git history, replaces all `{{TOKEN}}` placeholders, and self-deletes.

### Option B — GitHub template

1. Click **Use this template** on GitHub.
2. Clone your new repo locally.
3. Run `pnpm run init` and follow the prompts.

### Option C — degit / git clone

```bash
pnpm dlx degit Vijay431/vscode-extension-template my-extension
cd my-extension
pnpm run init
```

The `install.sh` script (both Option B and C):
- Prompts for extension name, publisher, description, author, repo URL, etc. — press Enter to accept smart defaults.
- Shows all values in an alignment-formatted confirmation block before applying.
- Replaces all `{{TOKEN}}` placeholders across every file.
- Enables GitHub Actions by renaming `.github/workflows/*.yml.init` placeholders to normal `.yml` workflow files.
- Verifies no tokens remain, then self-deletes, leaving a clean repo.

## Adding your first real command

1. Copy `src/commands/HelloWorldCommand.ts` → `src/commands/MyCommand.ts`.
2. Rename the class and implement `execute()`.
3. Import and register it in `src/managers/CommandsManager.ts`.
4. Add the command entry to `package.json` `contributes.commands`.
5. Add a unit test in `test/unit/MyCommand.test.ts`.
6. Add an integration test in `test/suite/myCommand.test.ts`.

## Publishing

### First release
```bash
git tag v0.0.1 && git push origin v0.0.1
```
CI handles packaging, verification, and dual-publish.

### Pre-release (odd minor version)
```bash
git tag v0.1.0-beta.1 && git push origin v0.1.0-beta.1
```

### Stable release (even minor version after pre-release)
```bash
git tag v0.2.0 && git push origin v0.2.0
```

## Secrets required

| Secret | Where |
|--------|-------|
| `VSCE_PAT` | VS Code Marketplace Personal Access Token |
| `OVSX_PAT` | Open VSX Registry token |

## Development

```bash
pnpm install           # install dependencies
pnpm run build         # build extension
pnpm run watch         # watch mode
pnpm run test:unit     # run unit tests
pnpm run test:integration  # run integration tests (requires display)
pnpm run lint          # ESLint
pnpm run format        # Prettier
```

Press **F5** in VS Code to launch the Extension Development Host.
