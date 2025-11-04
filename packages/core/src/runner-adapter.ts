import pino, { Logger } from 'pino';
import { LogLevel } from './enums.js';
import { WorkflowFacade, WorkflowExecutionResult } from './workflow-facade.js';
import { WorkflowProvider } from './workflow-provider.js';
import { MastraAdapter } from './adapters/mastra-adapter.js';

export interface RunnerAdapterOptions {
  logger?: Logger;
  logLevel?: LogLevel;
  provider?: WorkflowProvider;
}

/**
 * RunnerAdapter - Adapter pattern for executing workflows through provider abstraction
 * Supports both legacy workflows and provider-based workflows (Mastra, LangGraph, etc.)
 */
export class RunnerAdapter {
  private readonly logger: Logger;
  private readonly facade: WorkflowFacade;
  private readonly workflows: Map<string, any> = new Map();

  constructor(options: RunnerAdapterOptions = {}) {
    this.logger = options.logger ?? pino({
      level: options.logLevel ?? LogLevel.INFO,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    });

    // Use provided adapter or default to Mastra
    const provider = options.provider || new MastraAdapter();
    this.facade = new WorkflowFacade(provider);
  }

  /**
   * Register a workflow (can be legacy or provider-based)
   */
  registerWorkflow(workflow: any, id?: string): this {
    const workflowId = id || workflow.id || workflow.getName?.() || 'unnamed-workflow';
    this.workflows.set(workflowId, workflow);
    this.logger.info({ workflow: workflowId }, 'Workflow registered');
    return this;
  }

  /**
   * Execute a workflow by ID
   */
  async runWorkflow(
    id: string,
    input?: unknown,
    context?: Record<string, unknown>
  ): Promise<WorkflowExecutionResult> {
    const workflow = this.workflows.get(id);
    
    if (!workflow) {
      const error = new Error(`Workflow '${id}' not found`);
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

    // Execute through the facade
    return this.facade.execute(workflow, input, executionContext);
  }

  /**
   * Execute multiple workflows in parallel
   */
  async runWorkflowsParallel(
    workflows: Array<{ id: string; input?: unknown; context?: Record<string, unknown> }>
  ): Promise<WorkflowExecutionResult[]> {
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
    workflows: Array<{ id: string; input?: unknown; context?: Record<string, unknown> }>
  ): Promise<WorkflowExecutionResult[]> {
    this.logger.info({ count: workflows.length }, 'Starting sequential workflow execution');

    const results: WorkflowExecutionResult[] = [];
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
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Get the workflow facade
   */
  getFacade(): WorkflowFacade {
    return this.facade;
  }
}
