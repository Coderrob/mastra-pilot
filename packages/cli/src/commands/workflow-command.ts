import { ILogger } from "@repo/core";
import { executeWorkflow } from "../executors/workflow-executor.js";
import { handleError, handleSuccess } from "../handlers/result-handlers.js";
import { parseInput } from "../input/parse-input.js";
import { createLogger } from "../logger/create-logger.js";
import { createOutputWriter } from "../output/console-writer.js";
import { IOutputWriter } from "../output/types.js";

/**
 * Configuration options for running a single workflow
 */
interface WorkflowOptions {
  file?: string;
  input?: string;
}

/**
 * Executes a workflow command with the specified name and options
 * @param name The name/ID of the workflow to run
 * @param options Configuration options including input data or file path
 */
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

/**
 * Handles the result of a single workflow execution
 * @param result - Workflow execution result
 * @param result.success - Whether the workflow succeeded
 * @param result.duration - Execution duration in milliseconds
 * @param result.data - Output data from the workflow
 * @param result.error - Error object if workflow failed
 * @param writer - Output writer for displaying messages
 * @param logger - Logger instance for error logging
 */
function handleWorkflowResult(
  result: { data?: unknown; duration?: number; error?: Error; success: boolean; },
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
