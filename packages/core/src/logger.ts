import { isFunction, isObject } from "@repo/utils";

/**
 * Logger interface for dependency injection
 * Allows different logging implementations (pino, winston, console, etc.)
 */
export interface ILogger {
  trace(msg: string, ...args: unknown[]): void;
  trace(obj: object, msg?: string, ...args: unknown[]): void;

  debug(msg: string, ...args: unknown[]): void;
  debug(obj: object, msg?: string, ...args: unknown[]): void;

  info(msg: string, ...args: unknown[]): void;
  info(obj: object, msg?: string, ...args: unknown[]): void;

  warn(msg: string, ...args: unknown[]): void;
  warn(obj: object, msg?: string, ...args: unknown[]): void;

  error(msg: string, ...args: unknown[]): void;
  error(obj: object, msg?: string, ...args: unknown[]): void;

  fatal(msg: string, ...args: unknown[]): void;
  fatal(obj: object, msg?: string, ...args: unknown[]): void;

  child(bindings: Record<string, unknown>): ILogger;
}

/**
 * Type guard to check if an object is a valid ILogger
 */
export function isLogger(obj: unknown): obj is ILogger {
  return isObject(obj) && hasLoggerMethods(obj);
}

function hasLoggerMethods(obj: unknown): boolean {
  const maybeLogger = obj as Record<string, unknown>;
  return hasBasicLogMethods(maybeLogger) && hasAdvancedLogMethods(maybeLogger);
}

function hasBasicLogMethods(logger: Record<string, unknown>): boolean {
  const methods = [logger.trace, logger.debug, logger.info, logger.warn];
  return methods.every(isFunction);
}

function hasAdvancedLogMethods(logger: Record<string, unknown>): boolean {
  return isFunction(logger.error) && isFunction(logger.fatal) && isFunction(logger.child);
}
