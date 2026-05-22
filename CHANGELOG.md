# Changelog

All notable changes to **{{DISPLAY_NAME}}** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `src/utils/configValidator.ts`: generic `ValidationResult`/`ValidationError` interfaces, `validateConfigValue<T>()` helper, and `formatValidationErrors()` — ported from `additional-contexts-menu`, feature-neutral and reusable by any command that validates string-enum config values
- `src/services/configurationService.ts` + `IConfigurationService`: `getConfiguration()` returns full typed `ExtensionConfiguration`; `updateConfiguration<T>(key, value, target?)` writes a setting to Global/Workspace/WorkspaceFolder scope
- `src/utils/logger.ts` + `ILogger`: `LogCategory` enum (`GENERAL`, `PERFORMANCE`, `OPERATION`, `SECURITY`) now threaded through `log()` and exposed as optional 3rd param on `debug/info/warn/error`; non-GENERAL categories emit a `[CATEGORY]` prefix in text format and a `category` field in JSON format; level resolution uses an explicit `switch` instead of enum reverse-lookup
- `test/unit/configurationService.test.ts`: unit tests for `getConfiguration()` defaults/values and `updateConfiguration()` target mapping
- `LLM.txt`: single-file architecture guide for building on this template with any LLM; paste alongside feature requirements to leverage existing primitives (not published in `.vsix`)
- Per-directory `README.md` architecture scaffolds: `src/` index hub, `src/commands/`, `src/di/`, `src/di/interfaces/`, `src/managers/`, `src/services/`, `src/types/`, `src/utils/`, `test/unit/`, `test/suite/` — each documents purpose, conventions, how-to-extend, and reference architecture examples

### Changed

- `install.sh`: now auto-restores all `.github/**/*.init` placeholders during bootstrap — no manual workflow-enable step required; workflows and all other `.github/` files become live immediately after bootstrap
- `install.sh`: replaced 11-field dual-mode bootstrap with a lean 3-input flow (project-id, project-name, package manager); derives all other tokens (author from git config, GitHub username/URLs from author slug); supports npm/pnpm/yarn; exits with "Happy coding!"
- Package manager constraint relaxed: default remains **pnpm**; npm and yarn are now supported via the `install.sh` provider prompt
- All `.github/` files (workflows, templates, dependabot, CODEOWNERS, labels, etc.) are now deformed to `*.init` so the template repo itself triggers no GitHub automation
- `docs/` is now the optional GitHub Pages source (Settings → Pages → Deploy from branch → `/docs`); no Actions workflow required
- `package.json`: removed `site:serve`, `site:live`; `system:verify` simplified to `husky`
- `README.md`: expanded install.sh guide with step-by-step flow, derived-tokens table, `scripts/` documentation

### Removed

- `init.mjs` — superseded by `install.sh` (was the old Node-based bootstrap; also the source of pre-existing lint warnings)
- `scripts/test-install-workflows.sh` — tested workflow-enable behavior that is no longer part of the `install.sh` flow
- `package.json` `init` script — local init mode dropped; use the curl one-liner bootstrap
- `site/` — Jekyll GitHub Pages site removed; replaced by optional `docs/`-based GitHub legacy Pages
- `.devcontainer/` — removed from template
- `.coderabbit.yaml` — removed from template
- `.github/copilot-instructions.md` — removed from template
- `AGENTS.md` — removed; generic AI guidance now lives in `LLM.txt`
- `CLAUDE.md` — removed; architecture reference consolidated into `LLM.txt` and per-directory `README.md` files
- `.github/workflows/deploy-pages.yml.init` — Jekyll Pages CI removed
- Sample unit and integration tests — template now ships clean test harness + `README.md` scaffolds; add tests for your own features

- `install.sh` — dual-mode interactive bootstrap: curl-pipe mode (`bash <(curl -fsSL …/install.sh)`) clones template into `./<extension-name>/`, removes template git history, replaces all 11 `{{TOKEN}}` placeholders, and self-deletes; local mode (`pnpm run init`) does the same in-place after a manual clone
- `pnpm-workspace.yaml` with `allowBuilds` entries for esbuild/vsce-sign/keytar and `overrides` for fast-uri, serialize-javascript, postcss, brace-expansion, diff, tmp
- `scripts/commit-size-excludes.txt` centralising lockfile exclusion patterns shared between `check-commit-size.sh` and the CI `pr-commit-size.yml` workflow
- Jekyll site: `@keyframes copy-flash` for code-copy button feedback; `<link rel="preconnect">` tags for Google Fonts performance

### Changed

- Node baseline bumped to `>=22`; `.nvmrc` → `lts/jod`; esbuild target → `node22`; CI build matrix → `22.x`/`24.x`/`26.x`
- Commit-size limits tightened to **10 files / 400 lines**; `scripts/check-commit-size.sh` and `.github/workflows/pr-commit-size.yml` updated accordingly
- `pr-commit-size.yml` switched to `marocchino/sticky-pull-request-comment@v2` for persistent PR comments; `size/override` label bypass added
- `all-contributors.yml` security hardened: restricted to OWNER/MEMBER/COLLABORATOR associations, comment format validated
- `.gitignore`, `.prettierignore`, `.cursorignore`, `.vscodeignore` expanded with coverage/, .claude/, .code-review-graph/, .worktrees/ and similar tool-generated paths
- `tsconfig.test.json` tightened: `strict`, `noImplicitAny`, `noEmitOnError` enabled
- `eslint.config.mjs`: `*.config.ts` added to config-files glob; `jQuery`/`$` globals added to site-JS block; `security/detect-non-literal-fs-filename` and `security/detect-object-injection` turned off in config-files block
- `package.json` `init` script changed from `node init.mjs` → `bash install.sh`
- `src/utils/cache.ts` dispose: replaced `delete (this as ...)` cast with `this.cleanupTimer = undefined`
- Jekyll site code-copy button: added `aria-label`, `aria-hidden` on icon, visible `<span class="copy-label">`, switched to `navigator.clipboard.writeText().then()`
- Jekyll site `throttle()`: replaced `arguments`/`apply` pattern with rest-params arrow function
- Jekyll site: removed redundant card hover-translate JS block (CSS handles hover)
- Dependency minor/patch refresh: `@types/node` ^22, `@types/vscode` ^1.111, `@typescript-eslint/*` ^8.59.3, `@vscode/vsce` ^3.9.1, `ovsx` ^0.10.12, `prettier` ^3.8.3, `tsx` ^4.22.1, `mocha` 11.7.5, `eslint-plugin-promise` ^7.3.0
- `.devcontainer/devcontainer.json` name tokenized to `{{DISPLAY_NAME}}`
- `.devcontainer/` with Node 20 base image and headless test dependencies (xvfb, GTK) for VS Code integration tests
- Full OSS automation: `all-contributors.yml`, `stale.yml` (60-day stale / 14-day close), `labels-sync.yml` workflows
- `.github/labels.yml` (14 repository labels) and `.github/release.yml` (release-notes categories)
- `NOTICE.md` (third-party software notices) and `THIRDPARTY.md` (license table)
- `docs/images/` directory for README and Marketplace media assets
- `.all-contributorsrc` for all-contributors bot (tokens wired to `{{EXTENSION_NAME}}` / `{{GITHUB_USERNAME}}`)
- `.cursorignore` and `.github/copilot-instructions.md` for Cursor and Copilot AI tooling
- `test:unit:coverage` script — Vitest with v8 coverage provider, outputs `coverage/lcov.info` (uploaded to Codecov in CI)
- Initial release

### Changed

- CI/release pipeline split: `ci.yml` now triggers only on `main` pushes and PRs (lint + build + test); `release.yml` owns the full release pipeline including VSIX verifier and GitHub Release creation
- Issue templates genericized — removed `additional-contexts-menu`-specific content
- `.coderabbit.yaml` updated to reflect test suite presence

[Unreleased]: {{REPO_URL}}/commits/main
