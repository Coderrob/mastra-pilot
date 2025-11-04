import { Workflow, WorkflowResult } from './workflow.js';
import pino, { Logger } from 'pino';

export interface RunnerOptions {
  logger?: Logger;
  logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
}

/**
 * Runner implements the Strategy pattern for executing workflows
 * Provides different execution strategies and observability
 */
export class Runner {
  private readonly logger: Logger;
  private readonly workflows: Map<string, Workflow> = new Map();

  constructor(options: RunnerOptions = {}) {
    this.logger = options.logger ?? pino({
      level: options.logLevel ?? 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    });
  }

  /**
   * Register a workflow with the runner
   */
  registerWorkflow(workflow: Workflow): this {
    this.workflows.set(workflow.getName(), workflow);
    this.logger.info({ workflow: workflow.getName() }, 'Workflow registered');
    return this;
  }

  /**
   * Execute a workflow by name
   */
  async runWorkflow(
    name: string,
    input?: unknown,
    metadata?: Record<string, unknown>
  ): Promise<WorkflowResult> {
    const workflow = this.workflows.get(name);
    
    if (!workflow) {
      const error = new Error(`Workflow '${name}' not found`);
      this.logger.error({ workflow: name }, error.message);
      throw error;
    }

    this.logger.info({ workflow: name }, 'Starting workflow execution');
    return workflow.execute(input, metadata);
  }

  /**
   * Execute multiple workflows in parallel
   */
  async runWorkflowsParallel(
    workflows: Array<{ name: string; input?: unknown; metadata?: Record<string, unknown> }>
  ): Promise<WorkflowResult[]> {
    this.logger.info(
      { count: workflows.length },
      'Starting parallel workflow execution'
    );

    const promises = workflows.map(({ name, input, metadata }) =>
      this.runWorkflow(name, input, metadata)
    );

    return Promise.all(promises);
  }

  /**
   * Execute multiple workflows in sequence
   */
  async runWorkflowsSequential(
    workflows: Array<{ name: string; input?: unknown; metadata?: Record<string, unknown> }>
  ): Promise<WorkflowResult[]> {
    this.logger.info(
      { count: workflows.length },
      'Starting sequential workflow execution'
    );

    const results: WorkflowResult[] = [];
    let currentInput: unknown;

    for (const { name, input, metadata } of workflows) {
      const result = await this.runWorkflow(
        name,
        input ?? currentInput,
        metadata
      );
      results.push(result);
      
      // Use last successful result as input for next workflow
      if (result.success && result.results.length > 0) {
        const lastResult = result.results[result.results.length - 1];
        currentInput = lastResult.data;
      }
    }

    return results;
  }

  /**
   * Get all registered workflows
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
}
