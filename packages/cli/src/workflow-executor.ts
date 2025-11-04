import { RunnerAdapter, Workflow, WorkflowExecutionResult } from '@repo/core';
import { Logger } from 'pino';
import { createDevAutoWorkflow } from '@repo/workflows';

type WorkflowFactory = (options: { logger: Logger }) => Workflow;

const WORKFLOW_REGISTRY: Record<string, WorkflowFactory> = {
  'dev-auto': createDevAutoWorkflow,
};

/**
 * Create workflow instance by name
 */
export function createWorkflow(name: string, logger: Logger): Workflow {
  const factory = WORKFLOW_REGISTRY[name];
  
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
  logger: Logger
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
  logger: Logger,
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
