# src/managers/ — Lifecycle and Wiring

Managers orchestrate the extension lifecycle and wire commands to the DI container.
They contain no business logic — that belongs in `services/`.

## What lives here

| File | Purpose |
|---|---|
| `ExtensionManager.ts` | Lifecycle root: validates config, sets `setContext` key, wires config-change handler |
| `CommandsManager.ts` | Registers all commands at startup via `CommandRegistry` |
| `CommandRegistry.ts` | Generic registry: `registerCommand`, `executeCommand`, `unregisterCommand`, `dispose` |
| `index.ts` | Barrel |

## Conventions

- Managers are singletons registered in the DI container (`TYPES.ExtensionManager`, etc.).
- `CommandRegistry` holds handler instances for the lifetime of the extension. The same instance is reused per invocation — keep handlers stateless.
- `CommandsManager` is the only place new commands are wired up; don't register commands in services or `extension.ts`.
- No business logic in managers — delegate to services.

## CommandRegistry pattern

```typescript
this.registry.registerCommand({
  id: '{{EXTENSION_ID}}.myFeature',
  title: 'My Feature',
  category: '{{DISPLAY_NAME}}',
  handlerFactory: () => new MyFeatureCommand(logger, a11y),
});
```

`handlerFactory` is called immediately at registration and the instance is stored.

## How to add a new manager

1. Create `MyManager.ts` as a singleton class with a `static create(...)` factory.
2. Add a `TYPES.MyManager` token in `src/di/types.ts`.
3. Add `IMyManager` interface in `src/di/interfaces/`.
4. Register in `src/di/container.ts` `initializeContainer()`.
5. Wire activation in `ExtensionManager.activate()`.

## Reference architecture

Beyond `ExtensionManager` and `CommandsManager`, an extension may add managers that
coordinate a group of commands or UI state. For example, an `ExampleMenuManager` could wire a
set of related commands and manage context-key lifecycle
(`vscode.commands.executeCommand('setContext', '{{EXTENSION_ID}}.isReady', value)`) so menu
items appear/hide based on editor state. Keep wiring here; keep business logic in services.

## See also

- [`src/commands/README.md`](../commands/README.md) — command handler patterns
- [`src/di/README.md`](../di/README.md) — container and token registration
- [`src/README.md`](../README.md) — layered architecture overview
