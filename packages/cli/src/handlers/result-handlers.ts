import { ILogger } from "@repo/core";
import { IOutputWriter } from "../output/types.js";

export function handleSuccess(writer: IOutputWriter, message: string, data?: unknown): never {
  writer.info(message, data);
  process.exit(0);
}

export function handleError(
  writer: IOutputWriter,
  logger: ILogger,
  error: unknown,
  context: string
): never {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error({ error: err, context }, "Execution failed");
  writer.fatal(context, err);
}
