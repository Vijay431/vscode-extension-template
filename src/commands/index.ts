export { BaseCommandHandler, type CommandResult } from './BaseCommandHandler';
export type { ICommandHandler } from './ICommandHandler';
export { HelloWorldCommand } from './HelloWorldCommand';

export type CommandHandlerFactory = () => {
  execute: () => Promise<unknown>;
  dispose?: () => void;
};
