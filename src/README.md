# src/ — Architecture Overview

This directory contains all extension source code, organized into focused layers.
Each subdirectory carries its own `README.md` explaining conventions and how to extend it.

## Layered model

```
extension.ts
  └─ initializeContainer()          ← wires all service singletons into the DI container
  └─ ExtensionManager.activate()
       └─ CommandsManager            ← registers commands via CommandRegistry
            └─ BaseCommandHandler    ← command execute() logic; injected with services
                 └─ Services         ← business logic singletons (one domain each)
                      └─ Utils       ← stateless helpers (logger, cache, validators…)
```

## Directory index

| Directory | Purpose |
|---|---|
| [`commands/`](commands/README.md) | Command handlers — user-facing actions extending `BaseCommandHandler` |
| [`di/`](di/README.md) | DI container, token map (`TYPES`), and service lifecycle |
| [`di/interfaces/`](di/interfaces/README.md) | TypeScript contracts (`I*Service`) for every DI-injected service |
| [`managers/`](managers/README.md) | Lifecycle and wiring layer (`ExtensionManager`, `CommandsManager`, `CommandRegistry`) |
| [`services/`](services/README.md) | Business-logic singletons, each focused on one domain |
| [`types/`](types/README.md) | Shared TypeScript type definitions and defaults |
| [`utils/`](utils/README.md) | Stateless, standalone utilities (logger, cache, validators, metrics, a11y helpers) |

## Entry point

`extension.ts` is the VS Code activation entry point.
It calls `initializeContainer(context)` (from `di/container.ts`) to register all singletons,
then `ExtensionManager.create(context, container).activate()` to wire commands and context keys.
All feature logic lives in layers beneath — `extension.ts` stays thin.

## See also

- [`LLM.txt`](../../LLM.txt) — full architecture reference, hard constraints, add-a-command walkthrough; paste into any LLM to build on this template
- [`test/`](../../test/) — unit (`test/unit/`) and integration (`test/suite/`) test layers
