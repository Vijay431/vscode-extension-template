# Keeping extensions in sync with the template

The template (`vscode-extension-template`) is the canonical baseline. Sibling extensions (`additional-context-menus`, `keypress-notifications`) converge on it by hand. There is no sync bot. A hardening made in a sibling is upstreamed to the template first.

## File classes

**Shared.** Same content in every repo. Only tokens and project values differ.

- Lint and format: `biome.json`, `.markdownlint-cli2.jsonc`, `commitlint.config.mjs`, `.gitattributes`, `.editorconfig`
- Hooks: `.husky/pre-commit`, `.husky/commit-msg`. `lint-staged` config lives in `package.json`.
- Tests: `.vscode-test.mjs`, `vitest.config.ts`
- Scripts: `scripts/check-prerelease.cjs`, `scripts/smoke-bundle.cjs`, `.github/scripts/release-gate.sh`
- Workflows: `ci`, `release`, `security-daily`, `codeql`, `scorecard`, `labels-sync`, `all-contributors`
- Community: `dependabot.yml`, `labels.yml`, `ISSUE_TEMPLATE/*`, `PULL_REQUEST_TEMPLATE.md`, `VULNERABILITY_REPORT.yml`, `SUPPORT.md`, `SECURITY.md`, `codecov.yml`, `.all-contributorsrc`, `.coderabbit.yaml`, `AGENTS.md`, `ARCHITECTURE.md`

**Template-only.** `install.sh`, `template-check.yml`, `openspec/`, `graphify-out/`, and `.init` suffixes. `install.sh` strips or renames these.

**Extension-specific.** Source, `package.json` contributions, README, CHANGELOG, `logo.png`, demo media, and the layout section of `AGENTS.md` and `ARCHITECTURE.md`.

## Retired files

These must not exist in any repo.

- ESLint and Prettier: `eslint.config.mjs`, `tsconfig.eslint.json`, `.prettierrc`, `.prettierignore`, `.lintstagedrc`, and their packages
- `.github/workflows/{pr-commit-size,stale,cache-cleanup,security-pr,pr-title}.yml` and the `security-remediate-agent.*` files with their test
- `scripts/check-commit-size.sh`, `scripts/commit-size-excludes.txt`, `scripts/convert-encoding.sh`
- `test/runTests.ts`, `test/suite/index.ts`
- `CONTRIBUTORS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.antigravitycli/`, `.cursorignore`
- Duplicates of `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md` under `.github/`
- The `stale` label

Check with `git ls-files` in each repo.

## Allowed deviations

| Repo | Deviation |
| --- | --- |
| additional-context-menus | Extra issue templates (`context_menu_enhancement`, `framework_specific`, `terminal_configuration`) and their labels. Demo media and `logo.png`. Project `engines`, contributions, and dependencies. |
| keypress-notifications | Project `engines`, contributions, and dependencies. |
| both | None. All repos pin Node 24 strictly (`engines.node` is `>=24 <25`, CI matrices run `24.x` only). |

Record every Biome rule override and every deferred dependency bump below.

### Recorded overrides and deferrals

#### Biome

- ACM `src/services/enumGeneratorService.ts`: inline `biome-ignore` for `noEmptyCharacterClassInRegex`. The `/(['])([^]]*)\1/g` pattern is kept as is, because fixing it would change which string literals are extracted.
- ACM `src/services/cronJobTimerGeneratorService.ts`: `Number.parseInt(value, 10)` (rule `useParseIntRadix`). Hex strings such as `0x1` no longer parse as numbers.

#### Workflows

- All repos pin `packageManager` to `pnpm@12.4.2` and omit `version` on `pnpm/action-setup`; the action reads the pinned version from `package.json`.

#### Tests

- No "Extension Tests" launch entry in any repo. Without `suite/index.ts` it cannot start; debug integration tests from the Test Explorer (`ms-vscode.extension-test-runner`), which reads `.vscode-test.mjs`.

#### Dependabot consolidation (2026-10-15)

Branch `chore/consolidate-deps` in ACM and KPN.

| Repo | PR | Disposition |
| --- | --- | --- |
| ACM | #389 `eslint`, #393 `typescript-eslint`, #397 `eslint-plugin-n`, #392 `mocha` | Superseded: package removed |
| ACM | #390 `ovsx`, #391 `lint-staged`, #394 `tsx`, #395 and #398 `@commitlint/*`, #396 `@babel/parser`, #399 `@vitest/mocker` | Already at or above the target in the branch lockfile |
| KPN | #237, #238, #157 `typescript-eslint`, `@typescript-eslint/*` | Superseded: package removed |
| KPN | #217 `actions/stale` | Superseded: workflow removed |
| KPN | #218 `setup-node`, #186 `checkout` | Applied: workflows pinned to v7 SHAs |
| KPN | #185 `actions/cache` | Superseded: no workflow uses the cache action |
| KPN | #239 `tsx`, #235 `esbuild`, #234 `ovsx` | Applied |
| KPN | #159, #153, #147 `vitest`, `@vitest/coverage-v8` | Applied at 4.1.11 (the PRs target 4.1.8 and 4.1.0) |
| KPN | #236 `@types/node` 22 to 26 | Deferred: all repos pin Node 24 strictly, so `@types/node` stays on 24 and Dependabot ignores its major bumps |

KPN also takes the template's `pnpm-workspace.yaml` overrides and the `braces` audit ignore, so `pnpm audit` is clean. ACM #388 and KPN #291 are not Dependabot PRs and were left alone.

## Notes

- CodeQL and Scorecard need a public repository or GitHub Advanced Security.
- Every workflow action is pinned to a commit SHA with a `# vX` comment. Dependabot's `github-actions` ecosystem keeps the pins current. Template `.init` workflows are not scanned by Dependabot, so refresh their pins by hand before a template release.
- Re-running a failed release needs the `RELEASE_WHITELIST_ACTORS` variable. See [bootstrap.md](bootstrap.md).

## Repository settings checklist

These are repository settings, not files. Confirm each in Settings or with `gh api`.

- [ ] Ruleset on `main`: require a pull request, require the `CI` checks, block force pushes and deletion
- [ ] Private vulnerability reporting enabled
- [ ] Dependabot alerts and security updates enabled
- [ ] Code scanning (CodeQL) enabled
- [ ] `RELEASE_WHITELIST_ACTORS` variable set
- [ ] `VSCE_PAT` and `OVSX_PAT` secrets set
- [ ] OpenSSF Scorecard badge added to the README
- [ ] OpenSSF Best Practices badge earned and added to the README

Scorecard's Branch-Protection check scores above 0 once the ruleset exists.
