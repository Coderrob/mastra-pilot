import type { 
  WorkflowProvider, 
  StepConfig, 
  WorkflowConfig, 
  WorkflowExecutionContext,
  WorkflowInstance,
  StepExecutionContext
} from './workflow-provider.js';
import { MastraAdapter } from './adapters/mastra-adapter.js';
import { Logger } from 'pino';

/**
 * Workflow Facade - Provider-agnostic workflow orchestration
 * Uses adapter pattern to support multiple workflow engines (Mastra, LangGraph, etc.)
 */
export class WorkflowFacade<TProvider extends WorkflowProvider = MastraAdapter> {
  private provider: TProvider;
  private workflows: Map<string, Readonly<WorkflowInstance>> = new Map();

  constructor(provider?: TProvider) {
    this.provider = provider || (new MastraAdapter() as unknown as TProvider);
  }

  /**
   * Create a step with dependency injection support
   */
  createStep<TIn = unknown, TOut = unknown>(config: StepConfig<TIn, TOut>) {
    return this.provider.createStep(config);
  }

  /**
   * Create a workflow from steps
   */
  createWorkflow<TIn = unknown, TOut = unknown>(config: WorkflowConfig<TIn, TOut>): WorkflowInstance<TIn, TOut> {
    const workflow = this.provider.createWorkflow(config);
    // Store as readonly to prevent mutations - cast to unknown for storage
    this.workflows.set(config.id, Object.freeze(workflow as unknown as WorkflowInstance));
    return workflow;
  }

  /**
   * Execute a workflow with context
   */
  async execute<TIn = unknown, TOut = unknown>(
    workflowIdOrInstance: string | Readonly<WorkflowInstance<TIn, TOut>>,
    input: TIn,
    context?: WorkflowExecutionContext
  ): Promise<WorkflowExecutionResult<TOut>> {
    const workflow = typeof workflowIdOrInstance === 'string'
      ? this.workflows.get(workflowIdOrInstance) as Readonly<WorkflowInstance<TIn, TOut>> | undefined
      : workflowIdOrInstance;

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowIdOrInstance}`);
    }

    return this.provider.execute(workflow as WorkflowInstance<TIn, TOut>, input, context);
  }

  /**
   * Get registered workflow by ID
   */
  getWorkflow(id: string): Readonly<WorkflowInstance> | undefined {
    return this.workflows.get(id);
  }

  /**
   * List all registered workflows
   */
  listWorkflows(): string[] {
    return Array.from(this.workflows.keys());
  }
}

export interface WorkflowExecutionResult<TOut = unknown> {
  success: boolean;
  data?: TOut;
  error?: Error;
  results?: ReadonlyArray<unknown>;
  duration?: number;
}

/**
 * Helper to create step config with logger injection
 */
export function createStepWithLogger<TIn, TOut>(
  config: Omit<StepConfig<TIn, TOut>, 'execute'> & {
    execute: (input: TIn, context: StepExecutionContext & { logger: Logger }) => Promise<TOut>;
  }
): StepConfig<TIn, TOut> {
  return config as StepConfig<TIn, TOut>;
}
