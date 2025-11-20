import { ILogger, WorkflowId } from "@repo/core";
import { executeWorkflows } from "../executors/workflow-executor.js";
import { handleError, handleSuccess } from "../handlers/result-handlers.js";
import { parseInput } from "../input/parse-input.js";
import { createLogger } from "../logger/create-logger.js";
import { createOutputWriter } from "../output/console-writer.js";
import { IOutputWriter } from "../output/types.js";

interface RunOptions {
  input?: string;
  file?: string;
  workflows?: string[];
  parallel?: boolean;
}

function getWorkflowNames(options: RunOptions): string[] {
  return options.workflows || [WorkflowId.DEV_AUTO];
}

function checkWorkflowResults(results: Array<{ success: boolean }>): boolean {
  return results.every((r) => r.success);
}

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
