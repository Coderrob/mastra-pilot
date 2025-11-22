import { ILogger } from "@repo/core";
import { IOutputWriter } from "../output/types.js";

/**
 * Handles execution errors by logging and writing fatal output before exiting.
 * @param writer - Output writer for formatted messages
 * @param logger - Logger for structured error logging
 * @param error - The error that occurred
 * @param context - Context string describing where the error occurred
 */
export function handleError(
  writer: IOutputWriter,
  logger: ILogger,
  error: unknown,
  context: string
): never {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error({ context, error }, "Execution failed");
  writer.fatal(`${context}: ${errorMessage}`);
}

/**
 * Handles successful execution by writing output and exiting the process.
 * @param writer - Output writer for formatted messages
 * @param message - Success message to display
 * @param data - Optional data to include in the output
 */
export function handleSuccess(writer: IOutputWriter, message: string, data?: unknown): never {
  writer.info(message, data);
  process.exit(0);
}
