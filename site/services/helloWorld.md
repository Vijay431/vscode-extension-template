---
layout: page
title: Hello World
parent: Services
nav_order: 1
---

# Hello World

The Hello World command is the starter pattern for all commands in **{{DISPLAY_NAME}}**.

## How it works

1. User invokes `{{EXTENSION_ID}}.helloWorld` from the Command Palette.
2. `CommandsManager` delegates to `HelloWorldCommand` via `CommandRegistry`.
3. `HelloWorldCommand.execute()` shows an information message and announces success to screen readers.

## Adding your own commands

Copy `src/commands/HelloWorldCommand.ts`, rename the class, implement `execute()`, then register it in `src/managers/CommandsManager.ts`.
