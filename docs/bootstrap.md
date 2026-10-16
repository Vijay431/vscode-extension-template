# Bootstrap (`install.sh`)

`bash install.sh` creates `./<project-id>/` from this template. It asks one question (the Project ID) and ends with an installed, committed repository.

## Inputs

| Input                      | Required | Source and default                                    |
| -------------------------- | -------- | ----------------------------------------------------- |
| Project ID (kebab-case)    | Yes      | Prompt, or `PROJECT_ID` env var for non-interactive use |
| `PROJECT_NAME`             | No       | Title-cased Project ID                                |
| `GITHUB_USERNAME`          | No       | Slug of `git config user.name`                        |
| `PUBLISHER`                | No       | `GITHUB_USERNAME`                                     |
| `AUTHOR_NAME`, `AUTHOR_EMAIL` | No    | `git config user.name` / `user.email`                 |
| `DESCRIPTION`              | No       | `A VS Code extension.`                                |
| `TEMPLATE_REPO_URL`, `TEMPLATE_BRANCH` | No | This repository, `main`                         |

## Prerequisites

| Tool    | Required | Notes                                                                 |
| ------- | -------- | --------------------------------------------------------------------- |
| git     | Yes      | Also used for the initial commit                                      |
| Node.js | Yes      | Must satisfy the template's `engines.node` (checked after cloning)    |
| Network | Yes      | Clone and `pnpm install`                                              |
| pnpm    | No       | Activated automatically through corepack at the `devEngines` version  |

## What you get

- Tokens replaced, template-only files (`openspec/`, `graphify-out/`, `.claude/`, `install.sh`, template CI) removed.
- `.github/*.init` files enabled, dependencies and Husky hooks installed.
- One commit: `chore: init from vscode-extension-template`.
- On any failure the partial directory is removed and the failing step is named.

## Releasing a generated project

Releases start from a version tag, never from a merge to `main`.

1. Set `version` in `package.json`, merge to `main`, then push the matching tag: `git tag v1.2.3 && git push origin v1.2.3`.
2. The `Release` workflow runs `.github/scripts/release-gate.sh`. It fails before any build unless the tag matches `v<major>.<minor>.<patch>[-suffix]`, equals `package.json` `version` at the tagged commit, and is reachable from `main`.
3. It publishes to the VS Code Marketplace (`VSCE_PAT`) and Open VSX (`OVSX_PAT`), attests the `.vsix` build provenance, and attaches the `.vsix` to the GitHub Release.

Verify a download with `gh attestation verify <file>.vsix --repo <owner>/<repo>`.

### Re-running a failed release

Run the `Release` workflow manually (`workflow_dispatch`) and give the existing tag as the `tag` input. The workflow builds from that tag, not from the branch you dispatch on. Publishing a version that already exists is skipped, and an existing GitHub Release gets its assets replaced.

Only actors listed in the `RELEASE_WHITELIST_ACTORS` repository variable can re-run. Set it under **Settings → Secrets and variables → Actions → Variables** as a comma-separated list of GitHub usernames, for example `alice,bob`. When the variable is empty or missing, every manual run fails.
