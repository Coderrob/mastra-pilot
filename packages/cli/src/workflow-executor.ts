import { RunnerAdapter, Workflow, WorkflowExecutionResult, ILogger, WorkflowId } from '@repo/core';
import { createDevAutoWorkflow } from '@repo/workflows';

type WorkflowFactory = (options: { logger: ILogger }) => Workflow;

const WORKFLOW_REGISTRY: Record<WorkflowId, WorkflowFactory> = {
  [WorkflowId.DEV_AUTO]: createDevAutoWorkflow,
};

/**
 * Create workflow instance by name
 */
export function createWorkflow(name: string, logger: ILogger): Workflow {
  const factory = WORKFLOW_REGISTRY[name as WorkflowId];
  
  if (!factory) {
    throw new Error(`Unknown workflow: ${name}`);
  }
  
  return factory({ logger });
}

/**
 * Execute a single workflow using the adapter pattern
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
 * Execute multiple workflows with strategy using adapter pattern
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
  
  const workflowConfigs = names.map(name => ({ id: name, input }));
  
  return parallel
    ? runner.runWorkflowsParallel(workflowConfigs)
    : runner.runWorkflowsSequential(workflowConfigs);
}
