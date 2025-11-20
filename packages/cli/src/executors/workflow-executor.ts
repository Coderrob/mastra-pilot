import { ILogger, RunnerAdapter, Workflow, WorkflowExecutionResult, WorkflowId } from "@repo/core";
import { createDevAutoWorkflow } from "@repo/workflows";

type WorkflowFactory = (options: { logger: ILogger }) => Workflow;

const WORKFLOW_REGISTRY: Record<WorkflowId, WorkflowFactory> = {
  [WorkflowId.DEV_AUTO]: createDevAutoWorkflow,
};

function createWorkflow(name: string, logger: ILogger): Workflow {
  const factory = WORKFLOW_REGISTRY[name as WorkflowId];

  if (!factory) {
    throw new Error(`Unknown workflow: ${name}`);
  }

  return factory({ logger });
}

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
