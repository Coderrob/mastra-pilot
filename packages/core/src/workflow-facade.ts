import { isString } from "@repo/utils";
import { MastraAdapter } from "./adapters/mastra-adapter.js";
import { WorkflowExecutionError } from "./errors.js";
import { ILogger } from "./logger.js";
import type {
  IStepConfig,
  IStepExecutionContext,
  IWorkflowConfig,
  IWorkflowExecutionContext,
  IWorkflowInstance,
  IWorkflowProvider,
} from "./workflow-provider.js";

/**
 * Result of a workflow execution containing success status, data, and metadata
 */
export interface IWorkflowExecutionResult<TOut = unknown> {
  data?: TOut;
  duration?: number;
  error?: Error;
  results?: ReadonlyArray<unknown>;
  success: boolean;
}

// Alias for backward compatibility
/**
 * Type alias for workflow execution result (backward compatibility)
 */
export type WorkflowExecutionResult<TOut = unknown> = IWorkflowExecutionResult<TOut>;

/**
 * Workflow Facade - Provider-agnostic workflow orchestration
 * Uses adapter pattern to support multiple workflow engines (Mastra, LangGraph, etc.)
 */
export class WorkflowFacade<TProvider extends IWorkflowProvider = IWorkflowProvider> {
  private provider: TProvider;
  private workflows: Map<string, Readonly<IWorkflowInstance>> = new Map();

  /**
   * Creates a new WorkflowFacade instance
   * @param provider - The workflow provider implementation (defaults to MastraAdapter)
   */
  constructor(provider?: TProvider) {
    // Default to MastraAdapter if no provider specified
    // This is safe because MastraAdapter implements IWorkflowProvider
    this.provider = provider ?? (new MastraAdapter() as unknown as TProvider);
  }

  /**
   * Create a step with dependency injection support
   * @param config - Step configuration including execution logic
   * @returns The created step instance
   */
  createStep<TIn = unknown, TOut = unknown>(config: IStepConfig<TIn, TOut>) {
    return this.provider.createStep(config);
  }

  /**
   * Create a workflow from steps
   * @param config - Workflow configuration including steps and execution settings
   * @returns The created workflow instance
   */
  createWorkflow<TIn = unknown, TOut = unknown>(
    config: IWorkflowConfig<TIn, TOut>
  ): IWorkflowInstance<TIn, TOut> {
    const workflow = this.provider.createWorkflow(config);
    // Store as readonly to prevent mutations - cast to unknown for storage
    this.workflows.set(config.id, Object.freeze(workflow as unknown as IWorkflowInstance));
    return workflow;
  }

  /**
   * Execute a workflow with context
   * @param workflowIdOrInstance - Workflow ID string or workflow instance to execute
   * @param input - Input data for the workflow execution
   * @param context - Optional execution context with logger and additional data
   * @returns Promise resolving to workflow execution result
   * @throws {WorkflowExecutionError} When workflow is not found or execution fails
   */
  async execute<TIn = unknown, TOut = unknown>(
    workflowIdOrInstance: Readonly<IWorkflowInstance<TIn, TOut>> | string,
    input: TIn,
    context?: IWorkflowExecutionContext
  ): Promise<IWorkflowExecutionResult<TOut>> {
    const workflow = this.resolveWorkflow(workflowIdOrInstance);

    if (!workflow) {
      const errorId = this.getWorkflowErrorId(workflowIdOrInstance);
      throw new WorkflowExecutionError(`Workflow not found: ${errorId}`, errorId);
    }

    // Remove readonly for execution - structurally compatible
    return this.provider.execute(workflow as IWorkflowInstance<TIn, TOut>, input, context);
  }

  /**
   * Get registered workflow by ID
   * @param id - The workflow ID to retrieve
   * @returns The workflow instance or undefined if not found
   */
  getWorkflow(id: string): Readonly<IWorkflowInstance> | undefined {
    return this.workflows.get(id);
  }

  /**
   * List all registered workflows
   * @returns Array of workflow IDs
   */
  listWorkflows(): string[] {
    return [...this.workflows.keys()];
  }

  /**
   * Extracts workflow ID for error messages
   * @param workflowIdOrInstance - Workflow ID string or workflow instance
   * @returns The workflow ID or 'unknown' if not a string
   */
  private getWorkflowErrorId<TIn, TOut>(
    workflowIdOrInstance: Readonly<IWorkflowInstance<TIn, TOut>> | string
  ): string {
    return isString(workflowIdOrInstance) ? workflowIdOrInstance : "unknown";
  }

  /**
   * Resolves a workflow from ID or instance
   * @param workflowIdOrInstance - Workflow ID string or workflow instance
   * @returns The resolved workflow instance or undefined if not found
   */
  private resolveWorkflow<TIn, TOut>(
    workflowIdOrInstance: Readonly<IWorkflowInstance<TIn, TOut>> | string
  ): Readonly<IWorkflowInstance<TIn, TOut>> | undefined {
    if (isString(workflowIdOrInstance)) {
      return this.workflows.get(workflowIdOrInstance) as
        | Readonly<IWorkflowInstance<TIn, TOut>>
        | undefined;
    }
    return workflowIdOrInstance;
  }
}

/**
 * Helper to create step config with logger injection
 * @param config - Step configuration with logger-aware execution function
 * @returns Step configuration compatible with the workflow provider
 */
export function createStepWithLogger<TIn, TOut>(
  config: Omit<IStepConfig<TIn, TOut>, "execute"> & {
    execute: (input: TIn, context: IStepExecutionContext & { logger: ILogger }) => Promise<TOut>;
  }
): IStepConfig<TIn, TOut> {
  return config as IStepConfig<TIn, TOut>;
}
