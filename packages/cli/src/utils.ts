import { readFileSync } from 'fs';
import pino, { Logger } from 'pino';
import { IOutputWriter, ConsoleOutputWriter } from './output-writer.js';

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
 * Create an output writer instance
 */
export function createOutputWriter(): IOutputWriter {
  return new ConsoleOutputWriter();
}

/**
 * Handle success result and exit
 */
export function handleSuccess(writer: IOutputWriter, message: string, data?: unknown): never {
  writer.info(message, data);
  process.exit(0);
}

/**
 * Handle error and exit
 */
export function handleError(writer: IOutputWriter, _logger: Logger, error: unknown, context: string): never {
  const message = error instanceof Error ? error.message : String(error);
  writer.fatal(`${context}: ${message}`);
}
