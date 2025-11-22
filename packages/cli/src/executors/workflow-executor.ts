import { ILogger, RunnerAdapter, Workflow, WorkflowExecutionResult, WorkflowId } from "@repo/core";
import { createDevAutoWorkflow } from "@repo/workflows";

/**
 * Factory function type for creating workflow instances
 */
type WorkflowFactory = (options: { logger: ILogger }) => Workflow;

const WORKFLOW_REGISTRY: Record<WorkflowId, WorkflowFactory> = {
  [WorkflowId.DEV_AUTO]: createDevAutoWorkflow,
};

/**
 * Executes a single workflow with the provided input
 * @param name - The workflow identifier
 * @param input - Input data for the workflow
 * @param logger - Logger instance for tracking execution
 * @returns Workflow execution result including success status and output data
 */
export async function executeWorkflow(
  name: string,
  input: unknown,
  logger: ILogger
): Promise<WorkflowExecutionResult> {
  const runner = new RunnerAdapter({ logger });
  const workflow = createWorkflow(name, logger);
  runner.registerWorkflow(workflow, name);
  return runner.runWorkflow(name, input);
}

/**
 * Executes multiple workflows either in parallel or sequentially
 * @param names - Array of workflow identifiers
 * @param input - Input data shared across all workflows
 * @param logger - Logger instance for tracking execution
 * @param parallel - Whether to execute workflows in parallel (true) or sequentially (false)
 * @returns Array of workflow execution results
 */
export async function executeWorkflows(
  names: string[],
  input: unknown,
  logger: ILogger,
  parallel: boolean
): Promise<WorkflowExecutionResult[]> {
  const runner = new RunnerAdapter({ logger });

  for (const name of names) {
    const workflow = createWorkflow(name, logger);
    runner.registerWorkflow(workflow, name);
  }

  const workflowConfigs = names.map((id) => ({ id, input }));

  return parallel
    ? runner.runWorkflowsParallel(workflowConfigs)
    : runner.runWorkflowsSequential(workflowConfigs);
}

/**
 * Creates a workflow instance by name using the registry
 * @param name - The workflow identifier
 * @param logger - Logger instance for the workflow
 * @returns Configured workflow instance
 * @throws Error if workflow name is not found in registry
 */
function createWorkflow(name: string, logger: ILogger): Workflow {
  const factory = WORKFLOW_REGISTRY[name as WorkflowId];

  if (!factory) {
    throw new Error(`Unknown workflow: ${name}`);
  }

  return factory({ logger });
}
