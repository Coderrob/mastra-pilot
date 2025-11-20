import pino from 'pino';
import { hasGetName, hasId } from '@repo/utils';
import { MastraAdapter } from './adapters/mastra-adapter.js';
import { LogLevel } from './enums.js';
import { WorkflowExecutionError } from './errors.js';
import { ILogger } from './logger.js';
import { IWorkflowExecutionResult, WorkflowFacade } from './workflow-facade.js';
import { IWorkflowProvider, IWorkflowInstance as ProviderWorkflowInstance } from './workflow-provider.js';
import { Workflow } from './workflow.js';

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
    this.logger = this.createLogger(options);
    this.facade = this.createFacade(options);
  }

  private createLogger(options: IRunnerAdapterOptions): ILogger {
    return options.logger ?? (pino({
      level: options.logLevel ?? LogLevel.INFO,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    }) as ILogger);
  }

  private createFacade(options: IRunnerAdapterOptions): WorkflowFacade {
    const provider = options.provider || new MastraAdapter();
    return new WorkflowFacade(provider);
  }

  /**
   * Register a workflow (can be legacy or provider-based)
   */
  registerWorkflow(workflow: WorkflowInstance, id?: string): this {
    const workflowId = this.getWorkflowId(workflow, id);
    this.workflows.set(workflowId, Object.freeze(workflow));
    this.logger.info({ workflow: workflowId }, 'Workflow registered');
    return this;
  }

  private getWorkflowId(workflow: WorkflowInstance, id?: string): string {
    return id || this.extractWorkflowId(workflow);
  }

  private extractWorkflowId(workflow: WorkflowInstance): string {
    if (this.hasWorkflowId(workflow)) return workflow.id;
    if (hasGetName(workflow)) return workflow.getName();
    return 'unnamed-workflow';
  }

  private hasWorkflowId(workflow: WorkflowInstance): workflow is WorkflowInstance & { id: string } {
    return hasId(workflow) && workflow.id !== undefined && workflow.id !== '';
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

    for (const config of workflows) {
      const result = await this.executeWorkflowInSequence(config, currentInput);
      results.push(result);
      currentInput = this.updateInputFromResult(result, currentInput);
    }

    return results;
  }

  private async executeWorkflowInSequence(
    config: { id: string; input?: unknown; context?: Record<string, unknown> },
    currentInput: unknown
  ): Promise<IWorkflowExecutionResult> {
    return this.runWorkflow(config.id, config.input ?? currentInput, config.context);
  }

  private updateInputFromResult(
    result: IWorkflowExecutionResult,
    currentInput: unknown
  ): unknown {
    return result.success && result.data ? result.data : currentInput;
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
