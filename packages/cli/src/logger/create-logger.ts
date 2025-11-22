import pino from "pino";
import { ILogger } from "@repo/core";

/**
 * Creates a pino logger instance with the specified log level.
 * @param level - The log level (e.g., "info", "debug", "error"). Defaults to "info"
 * @returns A configured logger instance
 */
export function createLogger(level: string = "info"): ILogger {
  return pino({ level });
}
