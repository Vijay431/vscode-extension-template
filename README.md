# VS Code Extension Template

A production-ready, opinionated template for building VS Code extensions. Mirrors the architecture of a published extension: DI container, manager/command/service split, esbuild bundler with lazy-chunk support, Vitest unit tests, Mocha integration tests, and dual-marketplace CI (VS Code Marketplace + Open VSX).

## What's included

| Layer | Details |
|---|---|
| **Build** | esbuild with lazy-service chunk splitting; production minification; bundle size reporting |
| **DI container** | Lightweight singleton container — no InversifyJS dependency |
| **Commands** | `BaseCommandHandler` abstract class + `ICommandHandler` interface; `CommandsManager` registers all commands |
| **Services** | `ConfigurationService`, `AccessibilityService` wired at startup |
| **Utils** | `Logger`, `Cache` (LRU + TTL), `ConfigValidator`, `PathValidator`, accessibility helpers |
| **Tests** | Vitest unit test harness (no live VS Code); Mocha integration test harness (live Extension Host via `@vscode/test-electron`) |
| **CI/CD** | GitHub Actions that activate on bootstrap: lint → unit tests → integration tests → cross-platform build → release → dual publish |
| **Starter command** | Hello World wired end-to-end (DI → manager → command) |

## Bootstrap a new extension

Run from any directory — no clone needed:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Vijay431/vscode-extension-template/main/install.sh)
```

### What the script prompts for

| Prompt | Example | Notes |
|---|---|---|
| Project ID | `my-ext` | Required; kebab-case; becomes the package name, config namespace, and directory name |
| Project name | `My Ext` | Human-readable title (default: Title-Case of Project ID) |
| Package manager | `pnpm` | `pnpm` (default), `npm`, or `yarn` |

### What the script derives automatically

From the three inputs above, the script computes all 11 `{{TOKEN}}` placeholders without
additional prompts:

| Token | Source |
|---|---|
| `{{EXTENSION_NAME}}` | Project ID (as-is) |
| `{{EXTENSION_ID}}` | camelCase of Project ID |
| `{{DISPLAY_NAME}}` | Project name |
| `{{AUTHOR_NAME}}` | `git config user.name` |
| `{{AUTHOR_EMAIL}}` | `git config user.email` |
| `{{GITHUB_USERNAME}}` | Slugified author name |
| `{{PUBLISHER}}` | Same as GitHub username |
| `{{REPO_URL}}` | `https://github.com/<username>/<project-id>` |
| `{{SITE_URL}}` | `https://<username>.github.io/<project-id>` |
| `{{YEAR}}` | Current year |
| `{{DESCRIPTION}}` | Generic default (edit after bootstrap) |

### Step-by-step bootstrap flow

1. **Preflight** — verifies `git` is available; sets up the chosen package manager via
   corepack if needed (pnpm/yarn) or checks for npm.
2. **Prompt & confirm** — collects the three inputs, shows a summary, and asks for `y` to proceed.
3. **Target dir check** — aborts with an error if `./<project-id>` already exists and is non-empty (safe re-run).
4. **Clone** — `git clone --depth 1 --branch main <template-repo> <project-id>`, then removes the template's `.git/` history and `install.sh` from the clone.
5. **Token fill** — replaces all 11 `{{TOKEN}}` placeholders across every tracked text file; warns if any remain unfilled.
6. **Un-deform `.github/`** — renames every `.github/**/*.init` file back to its real name, activating GitHub Actions, issue templates, and PR templates. (`dependabot.yml` ships live in the template and is already active.)
7. **Lockfile cleanup** — if provider is not pnpm, removes `pnpm-lock.yaml` and `pnpm-workspace.yaml`.
8. **Install** — runs `<provider> install`.
9. **Greet** — prints next steps and "Happy coding!".

### Re-run / abort behavior

- **Already exists:** the script refuses to overwrite a non-empty directory; remove or rename it first.
- **Abort at confirmation:** type anything other than `y` — no files are touched.
- **Provider fallback:** an unrecognised provider name falls back to `pnpm` with a warning.

## Building with an LLM

`LLM.txt` (repo root) is a single-file architecture guide you can paste into any LLM alongside your feature requirements. The LLM will extend the template using its existing primitives rather than reinventing them.

> `LLM.txt` is **not published** in the extension `.vsix` — it is a developer/contributor tool only.

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

### Stable release
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
pnpm install               # install dependencies
pnpm run build             # build extension
pnpm run watch             # watch mode
pnpm run test:unit         # run unit tests
pnpm run test:integration  # run integration tests (requires display)
pnpm run lint              # ESLint
pnpm run format            # Prettier
```

Press **F5** in VS Code to launch the Extension Development Host.

## scripts/

| Script | Purpose |
|---|---|
| `check-commit-size.sh` | Enforces ≤ 10 files and ≤ 400 changed lines per staged commit. Invoked by the `pre-commit` Husky hook and the `pr-commit-size` CI job. Accepts `--excludes <file>` to point at a custom exclusion patterns file. |
| `commit-size-excludes.txt` | Glob patterns excluded from the commit size count — lockfiles, generated files, etc. Referenced by `check-commit-size.sh` by default. |
| `convert-encoding.sh` | Normalizes all tracked text files to UTF-8 encoding and LF line endings. Run manually when files arrive with CRLF or non-UTF-8 encoding. |

## Optional: GitHub Pages

Place an `index.md` in `docs/` and enable **Settings → Pages → Deploy from branch → `main` / `docs/`** for a simple no-workflow documentation site. See `docs/README.md` for details.
