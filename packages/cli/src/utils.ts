import { readFileSync } from 'fs';
import pino from 'pino';
import { ILogger, InputParseError } from '@repo/core';
import { IOutputWriter, ConsoleOutputWriter } from './output-writer.js';

/**
 * Parse input from JSON string or file
 * @throws {InputParseError} When JSON parsing fails
 */
export function parseInput(options: { input?: string; file?: string }): unknown {
  try {
    if (options.input) {
      return JSON.parse(options.input);
    }
    
    if (options.file) {
      return JSON.parse(readFileSync(options.file, 'utf-8'));
    }
    
    return {};
  } catch (error) {
    const source = options.input ? 'input string' : options.file || 'unknown';
    throw new InputParseError(
      `Failed to parse JSON from ${source}`,
      source,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Create a logger instance
 * Returns pino logger that implements ILogger interface
 */
export function createLogger(level: string = 'info'): ILogger {
  return pino({ level }) as ILogger;
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
export function handleError(writer: IOutputWriter, _logger: ILogger, error: unknown, context: string): never {
  const message = error instanceof Error ? error.message : String(error);
  writer.fatal(`${context}: ${message}`);
}
