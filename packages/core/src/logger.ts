import { isObject, isFunction } from '@repo/utils';

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
  if (!isObject(obj)) {
    return false;
  }
  
  // Type-safe checking without casting
  const maybeLogger = obj as Record<string, unknown>;
  return (
    isFunction(maybeLogger.trace) &&
    isFunction(maybeLogger.debug) &&
    isFunction(maybeLogger.info) &&
    isFunction(maybeLogger.warn) &&
    isFunction(maybeLogger.error) &&
    isFunction(maybeLogger.fatal) &&
    isFunction(maybeLogger.child)
  );
}
