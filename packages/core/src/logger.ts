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
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  const logger = obj as ILogger;
  return (
    typeof logger.trace === 'function' &&
    typeof logger.debug === 'function' &&
    typeof logger.info === 'function' &&
    typeof logger.warn === 'function' &&
    typeof logger.error === 'function' &&
    typeof logger.fatal === 'function' &&
    typeof logger.child === 'function'
  );
}
