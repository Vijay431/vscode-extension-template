# src/di/ — Dependency Injection

The DI layer wires all service singletons together.
It provides the container, token symbols, and (in `interfaces/`) TypeScript contracts.

## What lives here

| File | Purpose |
|---|---|
| `container.ts` | `DIContainer` class + `initializeContainer()` factory; registers all singletons |
| `types.ts` | `TYPES` — `Symbol.for()` token map; one entry per injectable service |
| `index.ts` | Barrel: re-exports `container`, `types`, and the `interfaces/` barrel |
| `interfaces/` | One `I*.ts` interface file per service (see `interfaces/README.md`) |

## Conventions

- All services are **singletons** registered via `container.registerSingleton(TYPES.Token, factory)`.
- Resolve services with `container.get<IMyService>(TYPES.MyService)`.
- Never call `new MyService()` outside of the factory function passed to `registerSingleton`.
- Use `container.createChild()` in tests for isolation.
- Every new service needs both a `TYPES` token AND an `I*Service` interface before registering.

## DIContainer API

```typescript
container.registerSingleton(TYPES.MyService, () => MyService.create(logger));
const svc = container.get<IMyService>(TYPES.MyService);  // throws if unregistered
container.has(TYPES.MyService);                           // boolean
const child = container.createChild();                    // inherits parent registrations
```

## How to add a new service

1. Add a token in `types.ts`:
   ```typescript
   MyService: Symbol.for('MyService'),
   ```
2. Create the interface `di/interfaces/IMyService.ts` (see `interfaces/README.md`).
3. Export it from `di/interfaces/index.ts`.
4. Implement the service in `src/services/myService.ts`.
5. Register in `initializeContainer()` in `container.ts`:
   ```typescript
   container.registerSingleton(TYPES.MyService, () =>
     MyService.create(container.get<ILogger>(TYPES.Logger))
   );
   ```
6. Inject where needed: `container.get<IMyService>(TYPES.MyService)`.

## Reference architecture

As an extension grows, `initializeContainer()` registers one singleton per service
alongside the built-ins (`Logger`, `ConfigurationService`, `AccessibilityService`). For example:

```typescript
container.registerSingleton(TYPES.ExampleService, () =>
  ExampleService.create(container.get<ILogger>(TYPES.Logger))
);
```

The `TYPES` map grows one entry per service. All are registered in `initializeContainer()`.

## See also

- [`di/interfaces/README.md`](interfaces/README.md) — interface conventions
- [`src/README.md`](../README.md) — layered architecture overview
- [`LLM.txt`](../../../LLM.txt) — step-by-step add-a-feature recipe
