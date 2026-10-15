import type { ICommandHandler } from './ICommandHandler';

export { BaseCommandHandler, type CommandResult } from './BaseCommandHandler';
export { HelloWorldCommand } from './HelloWorldCommand';
export type { ICommandHandler };

export type CommandHandlerFactory = () => ICommandHandler;
