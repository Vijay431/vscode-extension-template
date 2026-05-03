import type { ILogger } from './interfaces/ILogger';
import type { IConfigurationService } from './interfaces/IConfigurationService';
import type { IAccessibilityService } from './interfaces/IAccessibilityService';
import { TYPES } from './types';

type ServiceFactory<T> = () => T;

interface ServiceDescriptor<T> {
  factory: ServiceFactory<T>;
  instance?: T;
  isInstantiated: boolean;
}

export class DIContainer {
  private services = new Map<symbol, ServiceDescriptor<unknown>>();
  private parent?: DIContainer;

  constructor(parent?: DIContainer) {
    if (parent !== undefined) {
      this.parent = parent;
    }
  }

  registerSingleton<T>(token: symbol, factory: ServiceFactory<T>): this {
    this.services.set(token, { factory, instance: undefined, isInstantiated: false });
    return this;
  }

  registerInstance<T>(token: symbol, instance: T): this {
    this.services.set(token, { factory: () => instance, instance, isInstantiated: true });
    return this;
  }

  get<T>(token: symbol): T {
    const descriptor = this.services.get(token);

    if (descriptor) {
      if (!descriptor.isInstantiated) {
        descriptor.instance = descriptor.factory();
        descriptor.isInstantiated = true;
      }
      return descriptor.instance as T;
    }

    if (this.parent) {
      return this.parent.get<T>(token);
    }

    throw new Error(`Service not registered: ${token.toString()}`);
  }

  has(token: symbol): boolean {
    return this.services.has(token) || (this.parent?.has(token) ?? false);
  }

  clear(): void {
    this.services.clear();
  }

  createChild(): DIContainer {
    return new DIContainer(this);
  }
}

export const container = new DIContainer();

export async function initializeContainer(context: {
  subscriptions: { dispose(): void }[];
}): Promise<void> {
  const { Logger } = await import('../utils/logger');
  const { ConfigurationService } = await import('../services/configurationService');
  const { AccessibilityService } = await import('../services/accessibilityService');

  container.registerSingleton<ILogger>(TYPES.Logger, () => {
    const logger = Logger.getInstance();
    context.subscriptions.push({ dispose: () => logger.dispose() });
    return logger;
  });

  container.registerSingleton<IConfigurationService>(TYPES.ConfigurationService, () => {
    const logger = container.get<ILogger>(TYPES.Logger);
    return ConfigurationService.create(logger);
  });

  container.registerSingleton<IAccessibilityService>(TYPES.AccessibilityService, () => {
    const logger = container.get<ILogger>(TYPES.Logger);
    return AccessibilityService.create(logger);
  });

  // Register additional services here as your extension grows.
  // Lazy-loaded services (for large features) are imported dynamically in command handlers.
}

export function getService<T>(token: symbol): T {
  return container.get<T>(token);
}

export function hasService(token: symbol): boolean {
  return container.has(token);
}
