import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DIContainer, container, getService, initializeContainer } from '../../src/di/container';
import type { IAccessibilityService } from '../../src/di/interfaces/IAccessibilityService';
import type { IConfigurationService } from '../../src/di/interfaces/IConfigurationService';
import type { ILogger } from '../../src/di/interfaces/ILogger';
import { TYPES } from '../../src/di/types';

describe('DIContainer', () => {
  it('should throw for unregistered tokens', () => {
    expect(() => new DIContainer().get(Symbol('x'))).toThrow(/not registered/);
  });

  it('should memoize singleton factories', () => {
    const c = new DIContainer();
    const factory = vi.fn(() => ({}));
    const t = Symbol('t');
    c.registerSingleton(t, factory);
    expect(c.get(t)).toBe(c.get(t));
    expect(factory).toHaveBeenCalledOnce();
  });

  it('should resolve from a parent container', () => {
    const parent = new DIContainer();
    const t = Symbol('t');
    parent.registerInstance(t, 42);
    expect(parent.createChild().get<number>(t)).toBe(42);
  });
});

describe('initializeContainer', () => {
  beforeEach(() => container.clear());

  it('should register Logger, ConfigurationService and AccessibilityService', async () => {
    await initializeContainer({ subscriptions: [] });
    expect(getService<ILogger>(TYPES.Logger)).toBeDefined();
    expect(getService<IConfigurationService>(TYPES.ConfigurationService)).toBeDefined();
    expect(getService<IAccessibilityService>(TYPES.AccessibilityService)).toBeDefined();
  });

  it('should return the same instance on repeated resolution', async () => {
    await initializeContainer({ subscriptions: [] });
    expect(getService(TYPES.Logger)).toBe(getService(TYPES.Logger));
  });

  it('should push a disposable per service into subscriptions once resolved', async () => {
    const subscriptions: { dispose(): void }[] = [];
    await initializeContainer({ subscriptions });
    expect(subscriptions).toHaveLength(0);
    getService(TYPES.Logger);
    getService(TYPES.ConfigurationService);
    getService(TYPES.AccessibilityService);
    expect(subscriptions).toHaveLength(3);
  });

  it('should dispose the logger when subscriptions are disposed', async () => {
    const subscriptions: { dispose(): void }[] = [];
    await initializeContainer({ subscriptions });
    const logger = getService<ILogger>(TYPES.Logger);
    const spy = vi.spyOn(logger, 'dispose');
    getService(TYPES.ConfigurationService);
    getService(TYPES.AccessibilityService);
    for (const s of subscriptions) s.dispose();
    expect(spy).toHaveBeenCalledOnce();
  });
});
