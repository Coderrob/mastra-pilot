import type { WorkflowProvider, StepConfig, WorkflowConfig, WorkflowExecutionContext } from './workflow-provider.js';
import { MastraAdapter } from './adapters/mastra-adapter.js';
import { Logger } from 'pino';

/**
 * Workflow Facade - Provider-agnostic workflow orchestration
 * Uses adapter pattern to support multiple workflow engines (Mastra, LangGraph, etc.)
 */
export class WorkflowFacade<TProvider extends WorkflowProvider = MastraAdapter> {
  private provider: TProvider;
  private workflows: Map<string, any> = new Map();

  constructor(provider?: TProvider) {
    this.provider = provider || (new MastraAdapter() as unknown as TProvider);
  }

  /**
   * Create a step with dependency injection support
   */
  createStep<TIn = any, TOut = any>(config: StepConfig<TIn, TOut>) {
    return this.provider.createStep(config);
  }

  /**
   * Create a workflow from steps
   */
  createWorkflow<TIn = any, TOut = any>(config: WorkflowConfig<TIn, TOut>) {
    const workflow = this.provider.createWorkflow(config);
    this.workflows.set(config.id, workflow);
    return workflow;
  }

  /**
   * Execute a workflow with context
   */
  async execute<TIn = any, TOut = any>(
    workflowIdOrInstance: string | any,
    input: TIn,
    context?: WorkflowExecutionContext
  ): Promise<WorkflowExecutionResult<TOut>> {
    const workflow = typeof workflowIdOrInstance === 'string'
      ? this.workflows.get(workflowIdOrInstance)
      : workflowIdOrInstance;

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowIdOrInstance}`);
    }

    return this.provider.execute(workflow, input, context);
  }

  /**
   * Get registered workflow by ID
   */
  getWorkflow(id: string) {
    return this.workflows.get(id);
  }

  /**
   * List all registered workflows
   */
  listWorkflows(): string[] {
    return Array.from(this.workflows.keys());
  }
}

export interface WorkflowExecutionResult<TOut = any> {
  success: boolean;
  data?: TOut;
  error?: Error;
  results?: any[];
  duration?: number;
}

/**
 * Helper to create step config with logger injection
 */
export function createStepWithLogger<TIn, TOut>(
  config: Omit<StepConfig<TIn, TOut>, 'execute'> & {
    execute: (input: TIn, context: { logger: Logger; [key: string]: any }) => Promise<TOut>;
  }
): StepConfig<TIn, TOut> {
  return config as StepConfig<TIn, TOut>;
}
