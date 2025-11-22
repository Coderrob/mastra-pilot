import { ILogger, WorkflowId } from "@repo/core";
import { executeWorkflows } from "../executors/workflow-executor.js";
import { handleError, handleSuccess } from "../handlers/result-handlers.js";
import { parseInput } from "../input/parse-input.js";
import { createLogger } from "../logger/create-logger.js";
import { createOutputWriter } from "../output/console-writer.js";
import { IOutputWriter } from "../output/types.js";

/**
 * Configuration options for running workflows
 */
interface RunOptions {
  file?: string;
  input?: string;
  parallel?: boolean;
  workflows?: string[];
}

/**
 * Executes multiple workflows based on provided options
 * @param options - Run configuration including input, workflows, and execution mode
 */
export async function runWorkflows(options: RunOptions): Promise<void> {
  const logger = createLogger();
  const writer = createOutputWriter();

  try {
    const input = parseInput(options);
    const names = getWorkflowNames(options);
    const parallel = options.parallel || false;
    const results = await executeWorkflows(names, input, logger, parallel);

    handleWorkflowResults(results, writer, logger);
  } catch (error) {
    handleError(writer, logger, error, "Error running workflows");
  }
}

/**
 * Checks if all workflow executions were successful
 * @param results - Array of workflow execution results
 * @returns True if all workflows succeeded, false otherwise
 */
function checkWorkflowResults(results: Array<{ success: boolean }>): boolean {
  return results.every((r) => r.success);
}

/**
 * Extracts workflow names from options or returns default workflow
 * @param options - Run configuration options
 * @returns Array of workflow names to execute
 */
function getWorkflowNames(options: RunOptions): string[] {
  return options.workflows || [WorkflowId.DEV_AUTO];
}

/**
 * Handles the results of multiple workflow executions
 * @param results - Array of workflow execution results
 * @param writer - Output writer for displaying messages
 * @param logger - Logger instance for error logging
 */
function handleWorkflowResults(
  results: Array<{ success: boolean }>,
  writer: IOutputWriter,
  logger: ILogger
): void {
  const allSucceeded = checkWorkflowResults(results);

  if (allSucceeded) {
    handleSuccess(writer, "All workflows completed successfully");
  } else {
    handleError(writer, logger, new Error("Some workflows failed"), "Workflow execution failed");
  }
}
