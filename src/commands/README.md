# src/commands/ — Command Handlers

Command handlers are the user-facing actions of the extension.
Every command is a class that extends `BaseCommandHandler` and implements `execute()`.

## What lives here

| File pattern | Purpose |
|---|---|
| `ICommandHandler.ts` | Interface: `execute(): Promise<CommandResult>` |
| `BaseCommandHandler.ts` | Abstract base — extend this for every command |
| `*Command.ts` | Concrete command handlers (one per command) |
| `index.ts` | Barrel (`CommandHandlerFactory` type export) |

## Conventions

- Extend `BaseCommandHandler`; pass `'MyCommandName'` as the `name` arg to `super()`.
- Implement `execute(): Promise<CommandResult>` and return via `this.success(msg)` or `this.error(msg, err?)`.
- Handlers are **stateless** (or reset state at the top of `execute()`). The same instance is reused on every invocation.
- Use `this.logger` / `this.logInfo()` etc. — never `console.*` in handler code.
- Use `this.announceSuccess()` / `this.announceError()` for screen reader announcements.
- Never instantiate services with `new` inside a handler — receive them via constructor injection.

## Helpers available in BaseCommandHandler

```typescript
this.getActiveEditor()          // TextEditor | undefined
this.requireActiveEditor()      // TextEditor — throws if none open
this.hasSelection()             // boolean
this.getSelectedText()          // string

this.success('Done')            // CommandResult { success: true, message }
this.error('Failed', err)       // CommandResult { success: false, message, error }

this.showInfo/Warning/Error('message')
this.announce/announceSuccess/announceError('message')
this.logInfo/logDebug/logWarn/logError('message', data?)
```

## How to add a new command

1. Copy `HelloWorldCommand.ts` → `MyFeatureCommand.ts`.
2. Rename the class; pass `'MyFeatureCommand'` to `super()`.
3. Inject additional services via constructor (e.g. `IMyService`).
4. Implement `execute()` using service methods; return `this.success()` or `this.error()`.
5. Register in `src/managers/CommandsManager.ts`:
   ```typescript
   this.registry.registerCommand({
     id: '{{EXTENSION_ID}}.myFeature',
     title: 'My Feature',
     category: '{{DISPLAY_NAME}}',
     handlerFactory: () => new MyFeatureCommand(logger, a11y, myService),
   });
   ```
6. Add to `package.json` `contributes.commands` (and `contributes.menus` if needed).
7. Add `test/unit/MyFeatureCommand.test.ts` (Vitest) and `test/suite/myFeature.test.ts` (Mocha).

## Reference architecture

As features are added, each command is a `BaseCommandHandler` subclass that delegates to a
service — for example:

- `ExampleCommand` → `IExampleService`
- `FooCommand` → `IFooService`

Group related commands by feature and register them all in `CommandsManager`.
Each handler delegates its logic to a dedicated service in `src/services/`.

## See also

- [`src/README.md`](../README.md) — architecture overview
- [`src/managers/README.md`](../managers/README.md) — how `CommandsManager` registers handlers
- [`LLM.txt`](../../../LLM.txt) — "How to Add a Command" walkthrough and full LLM-guided feature recipe
