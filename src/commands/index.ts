import type { ICommandHandler } from './ICommandHandler';

export { BaseCommandHandler, type CommandResult } from './BaseCommandHandler';
export type { ICommandHandler };
export { HelloWorldCommand } from './HelloWorldCommand';

export type CommandHandlerFactory = () => ICommandHandler;
