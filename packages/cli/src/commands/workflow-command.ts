import { ILogger } from "@repo/core";
import { executeWorkflow } from "../executors/workflow-executor.js";
import { handleError, handleSuccess } from "../handlers/result-handlers.js";
import { parseInput } from "../input/parse-input.js";
import { createLogger } from "../logger/create-logger.js";
import { createOutputWriter } from "../output/console-writer.js";
import { IOutputWriter } from "../output/types.js";

interface WorkflowOptions {
  input?: string;
  file?: string;
}

function handleWorkflowResult(
  result: { success: boolean; duration?: number; data?: unknown; error?: Error },
  writer: IOutputWriter,
  logger: ILogger
): void {
  if (result.success) {
    handleSuccess(
      writer,
      `Workflow completed successfully (${result.duration || 0}ms)`,
      result.data
    );
  } else {
    handleError(writer, logger, result.error, "Workflow failed");
  }
}

export async function runWorkflow(name: string, options: WorkflowOptions): Promise<void> {
  const logger = createLogger();
  const writer = createOutputWriter();

  try {
    const input = parseInput(options);
    const result = await executeWorkflow(name, input, logger);
    handleWorkflowResult(result, writer, logger);
  } catch (error) {
    handleError(writer, logger, error, "Error executing workflow");
  }
}
