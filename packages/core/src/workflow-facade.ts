import type { 
  IWorkflowProvider, 
  IStepConfig, 
  IWorkflowConfig, 
  IWorkflowExecutionContext,
  IWorkflowInstance,
  IStepExecutionContext
} from './workflow-provider.js';
import { MastraAdapter } from './adapters/mastra-adapter.js';
import { ILogger } from './logger.js';
import { WorkflowExecutionError } from './errors.js';
import { isString } from '@repo/utils';

/**
 * Workflow Facade - Provider-agnostic workflow orchestration
 * Uses adapter pattern to support multiple workflow engines (Mastra, LangGraph, etc.)
 */
export class WorkflowFacade<TProvider extends IWorkflowProvider = IWorkflowProvider> {
  private provider: TProvider;
  private workflows: Map<string, Readonly<IWorkflowInstance>> = new Map();

  constructor(provider?: TProvider) {
    // Default to MastraAdapter if no provider specified
    // This is safe because MastraAdapter implements IWorkflowProvider
    this.provider = provider ?? (new MastraAdapter() as TProvider);
  }

  /**
   * Create a step with dependency injection support
   */
  createStep<TIn = unknown, TOut = unknown>(config: IStepConfig<TIn, TOut>) {
    return this.provider.createStep(config);
  }

  /**
   * Create a workflow from steps
   */
  createWorkflow<TIn = unknown, TOut = unknown>(config: IWorkflowConfig<TIn, TOut>): IWorkflowInstance<TIn, TOut> {
    const workflow = this.provider.createWorkflow(config);
    // Store as readonly to prevent mutations - cast to unknown for storage
    this.workflows.set(config.id, Object.freeze(workflow as unknown as IWorkflowInstance));
    return workflow;
  }

  /**
   * Execute a workflow with context
   * @throws {WorkflowExecutionError} When workflow is not found or execution fails
   */
  async execute<TIn = unknown, TOut = unknown>(
    workflowIdOrInstance: string | Readonly<IWorkflowInstance<TIn, TOut>>,
    input: TIn,
    context?: IWorkflowExecutionContext
  ): Promise<IWorkflowExecutionResult<TOut>> {
    let workflow: Readonly<IWorkflowInstance<TIn, TOut>> | undefined;
    
    if (isString(workflowIdOrInstance)) {
      workflow = this.workflows.get(workflowIdOrInstance) as Readonly<IWorkflowInstance<TIn, TOut>> | undefined;
    } else {
      workflow = workflowIdOrInstance;
    }

    if (!workflow) {
      const errorId = isString(workflowIdOrInstance) ? workflowIdOrInstance : 'unknown';
      throw new WorkflowExecutionError(`Workflow not found: ${errorId}`, errorId);
    }

    // Remove readonly for execution - structurally compatible
    return this.provider.execute(workflow as IWorkflowInstance<TIn, TOut>, input, context);
  }

  /**
   * Get registered workflow by ID
   */
  getWorkflow(id: string): Readonly<IWorkflowInstance> | undefined {
    return this.workflows.get(id);
  }

  /**
   * List all registered workflows
   */
  listWorkflows(): string[] {
    return Array.from(this.workflows.keys());
  }
}

export interface IWorkflowExecutionResult<TOut = unknown> {
  success: boolean;
  data?: TOut;
  error?: Error;
  results?: ReadonlyArray<unknown>;
  duration?: number;
}

// Alias for backward compatibility
export type WorkflowExecutionResult<TOut = unknown> = IWorkflowExecutionResult<TOut>;

/**
 * Helper to create step config with logger injection
 */
export function createStepWithLogger<TIn, TOut>(
  config: Omit<IStepConfig<TIn, TOut>, 'execute'> & {
    execute: (input: TIn, context: IStepExecutionContext & { logger: ILogger }) => Promise<TOut>;
  }
): IStepConfig<TIn, TOut> {
  return config as IStepConfig<TIn, TOut>;
}
