import { isFunction, isObject } from "@repo/utils";

/**
 * Logger interface for dependency injection
 * Allows different logging implementations (pino, winston, console, etc.)
 */
export interface ILogger {
  child(bindings: Record<string, unknown>): ILogger;
  debug(msg: string, ...args: unknown[]): void;

  debug(obj: object, msg?: string, ...args: unknown[]): void;
  error(msg: string, ...args: unknown[]): void;

  error(obj: object, msg?: string, ...args: unknown[]): void;
  fatal(msg: string, ...args: unknown[]): void;

  fatal(obj: object, msg?: string, ...args: unknown[]): void;
  info(msg: string, ...args: unknown[]): void;

  info(obj: object, msg?: string, ...args: unknown[]): void;
  trace(msg: string, ...args: unknown[]): void;

  trace(obj: object, msg?: string, ...args: unknown[]): void;
  warn(msg: string, ...args: unknown[]): void;

  warn(obj: object, msg?: string, ...args: unknown[]): void;
}

/**
 * Type guard to check if an object is a valid ILogger
 * @param obj - The object to check
 * @returns True if the object is a valid ILogger, false otherwise
 */
export function isLogger(obj: unknown): obj is ILogger {
  return isObject(obj) && hasLoggerMethods(obj);
}

/**
 * Checks if a logger has advanced log methods (error, fatal, child)
 * @param logger - The logger object to check
 * @returns True if the logger has all advanced log methods, false otherwise
 */
function hasAdvancedLogMethods(logger: Record<string, unknown>): boolean {
  return isFunction(logger.error) && isFunction(logger.fatal) && isFunction(logger.child);
}

/**
 * Checks if a logger has basic log methods (trace, debug, info, warn)
 * @param logger - The logger object to check
 * @returns True if the logger has all basic log methods, false otherwise
 */
function hasBasicLogMethods(logger: Record<string, unknown>): boolean {
  const methods = [logger.trace, logger.debug, logger.info, logger.warn];
  return methods.every((element) => isFunction(element));
}

/**
 * Checks if an object has all required logger methods
 * @param obj - The object to check
 * @returns True if the object has all required logger methods, false otherwise
 */
function hasLoggerMethods(obj: unknown): boolean {
  const maybeLogger = obj as Record<string, unknown>;
  return hasBasicLogMethods(maybeLogger) && hasAdvancedLogMethods(maybeLogger);
}
