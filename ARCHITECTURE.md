# Architecture

> Skeleton. Replace the placeholders as {{DISPLAY_NAME}} grows.

## Overview

{{DESCRIPTION}}

## Layout

| Path | Responsibility |
| --- | --- |
| `src/extension.ts` | Activation entry point. Registers commands and disposables. |
| `src/` | Extension source, bundled to `dist/extension.js` by esbuild. |
| `test/unit/` | Vitest tests that run without VS Code. |
| `test/suite/` | Mocha tests that run inside VS Code through `@vscode/test-cli`. |

## Activation

`activate()` in `src/extension.ts` runs these steps in order:

1. `initializeContainer(context)` registers the logger, configuration service, and accessibility service in the DI container.
2. `new ExtensionManager()` resolves the logger and configuration service from the container and creates a `CommandsManager`.
3. `ExtensionManager.activate(context)` validates the configuration with `ConfigValidator`.
4. `initializeComponents` calls `CommandsManager.initialize(context)`, which registers the command handlers, then subscribes to configuration changes.
5. It registers the `{{EXTENSION_ID}}.showOutputChannel` command and a disposal hook on `context.subscriptions`.
6. It sets the `{{EXTENSION_ID}}.enabled` context key from the configuration.

If any step throws, `activate()` logs the error, shows it in an output channel, and displays an error message. `deactivate()` disposes the manager.

## Data flow

Describe how a command reaches its service and what state it reads or writes.

## Component boundaries

List each service, what it owns, and what it must not import.
