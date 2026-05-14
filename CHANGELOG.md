# Changelog

All notable changes to **{{DISPLAY_NAME}}** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
