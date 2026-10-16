# Repository Guidelines

## Project Structure & Module Organization

This is a TypeScript VS Code extension. Source code lives in `src/` and is bundled by esbuild into `dist/`. Unit tests are in `test/unit/`, integration tests in `test/suite/`, mocks in `test/__mocks__/`, and fixtures in `test/fixtures/`. Do not edit generated output in `dist/`, `out-test/`, or `coverage/`.

See [ARCHITECTURE.md](ARCHITECTURE.md) for module boundaries and data flow before proposing sweeping design changes.

## Build, Test, and Development Commands

- `pnpm install`: install dependencies.
- `pnpm build`: bundle the extension with esbuild.
- `pnpm watch`: rebuild during development.
- `pnpm lint`: run Biome (lint and format check).
- `pnpm lint:fix`: apply Biome fixes.
- `pnpm lint:md`: run markdownlint.
- `pnpm typecheck`: TypeScript type checking (no emit).
- `pnpm test:unit`: run Vitest unit tests.
- `pnpm test:integration`: compile tests and run VS Code integration tests with `@vscode/test-cli`. On Linux, wrap it in `xvfb-run -a`.
- `pnpm package`: create a `.vsix` package.

Use Node.js 24+ and pnpm. For manual testing, open the repo in VS Code and press `F5`.

## Coding Style & Naming Conventions

Write TypeScript and keep modules focused by responsibility. Biome is the only linter and formatter. Do not add ESLint or Prettier. Do not commit compiled `.js` or `.js.map` files under `src/`, `test/`, or `scripts/`.

## Testing Guidelines

Add unit tests in `test/unit/*.test.ts` for services, utilities, and validators. Add integration tests in `test/suite/*.test.ts` when a change touches VS Code commands, settings, or editor behavior. Test names start with `should`. Debug a test from the Test Explorer (Extension Test Runner, reads `.vscode-test.mjs`); there is no launch entry for it.

## Commit & Pull Request Guidelines

Use Conventional Commits, for example `feat(scope): add thing` or `fix(config): respect setting`. Husky runs Biome and markdownlint on staged files and commitlint on the message. Branch from `main` using prefixes such as `feature/`, `fix/`, `docs/`, or `refactor/`.

Before opening a PR, run `pnpm lint`, `pnpm lint:md`, `pnpm typecheck`, `pnpm test:unit`, and `pnpm build`. Update `README.md` and `CHANGELOG.md` when commands or behavior change.

## Security & Configuration Tips

Do not commit secrets, local VS Code state, generated packages, or build artifacts. Review `SECURITY.md` for vulnerability reporting. Releases run from a `v*` tag; see `docs/bootstrap.md`.
