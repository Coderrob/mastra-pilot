import pino from 'pino';
import { LogLevel } from './enums.js';
import { ILogger } from './logger.js';
import { WorkflowFacade, IWorkflowExecutionResult } from './workflow-facade.js';
import { IWorkflowProvider, IWorkflowInstance as ProviderWorkflowInstance } from './workflow-provider.js';
import { MastraAdapter } from './adapters/mastra-adapter.js';
import { Workflow } from './workflow.js';
import { WorkflowExecutionError } from './errors.js';
import { hasId, hasGetName } from '@repo/utils';

/**
 * Workflow instance - can be legacy Workflow, Mastra workflow, or Mastra step
 */
export type WorkflowInstance = Workflow | {
  id?: string;
  getName?: () => string;
  execute?: (input: unknown, context?: unknown) => Promise<unknown>;
  [key: string]: unknown;
};

export interface IRunnerAdapterOptions {
  logger?: ILogger;
  logLevel?: LogLevel;
  provider?: IWorkflowProvider;
}

/**
 * RunnerAdapter - Adapter pattern for executing workflows through provider abstraction
 * Supports both legacy workflows and provider-based workflows (Mastra, LangGraph, etc.)
 */
export class RunnerAdapter {
  private readonly logger: ILogger;
  private readonly facade: WorkflowFacade;
  private readonly workflows: Map<string, Readonly<WorkflowInstance>> = new Map();

  constructor(options: IRunnerAdapterOptions = {}) {
    this.logger = options.logger ?? (pino({
      level: options.logLevel ?? LogLevel.INFO,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    }) as ILogger);

    // Use provided adapter or default to Mastra
    const provider = options.provider || new MastraAdapter();
    this.facade = new WorkflowFacade(provider);
  }

  /**
   * Register a workflow (can be legacy or provider-based)
   */
  registerWorkflow(workflow: WorkflowInstance, id?: string): this {
    // Determine workflow ID using type guards
    let workflowId = id;
    
    if (!workflowId && hasId(workflow)) {
      workflowId = workflow.id;
    }
    
    if (!workflowId && hasGetName(workflow)) {
      workflowId = workflow.getName();
    }
    
    if (!workflowId) {
      workflowId = 'unnamed-workflow';
    }
    
    // Store as readonly to prevent mutations
    this.workflows.set(workflowId, Object.freeze(workflow));
    this.logger.info({ workflow: workflowId }, 'Workflow registered');
    return this;
  }

  /**
   * Execute a workflow by ID
   * @throws {WorkflowExecutionError} When workflow is not found
   */
  async runWorkflow(
    id: string,
    input?: unknown,
    context?: Record<string, unknown>
  ): Promise<IWorkflowExecutionResult> {
    const workflow = this.workflows.get(id);
    
    if (!workflow) {
      const error = new WorkflowExecutionError(`Workflow '${id}' not found`, id);
      this.logger.error({ workflow: id }, error.message);
      throw error;
    }

    this.logger.info({ workflow: id }, 'Starting workflow execution');

    // Create execution context with logger and custom metadata
    const executionContext = {
      logger: this.logger,
      metadata: context || {},
      ...context,
    };

    // Execute through the facade - cast workflow for execution compatibility
    return this.facade.execute(workflow as unknown as ProviderWorkflowInstance, input, executionContext);
  }

  /**
   * Execute multiple workflows in parallel
   */
  async runWorkflowsParallel(
    workflows: ReadonlyArray<{ id: string; input?: unknown; context?: Record<string, unknown> }>
  ): Promise<IWorkflowExecutionResult[]> {
    this.logger.info({ count: workflows.length }, 'Starting parallel workflow execution');

    const promises = workflows.map(({ id, input, context }) =>
      this.runWorkflow(id, input, context)
    );

    return Promise.all(promises);
  }

  /**
   * Execute multiple workflows sequentially
   */
  async runWorkflowsSequential(
    workflows: ReadonlyArray<{ id: string; input?: unknown; context?: Record<string, unknown> }>
  ): Promise<IWorkflowExecutionResult[]> {
    this.logger.info({ count: workflows.length }, 'Starting sequential workflow execution');

    const results: IWorkflowExecutionResult[] = [];
    let currentInput: unknown;

    for (const { id, input, context } of workflows) {
      const result = await this.runWorkflow(id, input ?? currentInput, context);
      results.push(result);
      
      // Use last successful result as input for next workflow
      if (result.success && result.data) {
        currentInput = result.data;
      }
    }

    return results;
  }

  /**
   * Get all registered workflow IDs
   */
  getWorkflows(): string[] {
    return Array.from(this.workflows.keys());
  }

  /**
   * Get the logger instance
   */
  getLogger(): ILogger {
    return this.logger;
  }

  /**
   * Get the workflow facade
   */
  getFacade(): WorkflowFacade {
    return this.facade;
  }
}
