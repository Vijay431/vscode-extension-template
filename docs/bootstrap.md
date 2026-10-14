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
