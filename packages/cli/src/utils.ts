import { readFileSync } from 'fs';
import pino, { Logger } from 'pino';

/**
 * Parse input from JSON string or file
 */
export function parseInput(options: { input?: string; file?: string }): unknown {
  if (options.input) {
    return JSON.parse(options.input);
  }
  
  if (options.file) {
    return JSON.parse(readFileSync(options.file, 'utf-8'));
  }
  
  return {};
}

/**
 * Create a logger instance
 */
export function createLogger(level: string = 'info'): Logger {
  return pino({ level });
}

/**
 * Handle success result and exit
 */
export function handleSuccess(message: string, data?: unknown): never {
  console.log(`✓ ${message}`);
  if (data !== undefined) {
    console.log(JSON.stringify(data, null, 2));
  }
  process.exit(0);
}

/**
 * Handle error and exit
 */
export function handleError(logger: Logger, error: unknown, context: string): never {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`✗ ${context}: ${message}`);
  logger.error(error, context);
  process.exit(1);
}
