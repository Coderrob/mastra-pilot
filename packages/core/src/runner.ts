import { Workflow, WorkflowResult } from './workflow.js';
import pino, { Logger } from 'pino';
import { LogLevel } from './enums.js';

export interface RunnerOptions {
  logger?: Logger;
  logLevel?: LogLevel;
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
      level: options.logLevel ?? LogLevel.INFO,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    });
  }

  registerWorkflow(workflow: Workflow): this {
    this.workflows.set(workflow.getName(), workflow);
    this.logger.info({ workflow: workflow.getName() }, 'Workflow registered');
    return this;
  }

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

  async runWorkflowsParallel(
    workflows: Array<{ name: string; input?: unknown; metadata?: Record<string, unknown> }>
  ): Promise<WorkflowResult[]> {
    this.logger.info({ count: workflows.length }, 'Starting parallel workflow execution');
    return Promise.all(workflows.map(({ name, input, metadata }) =>
      this.runWorkflow(name, input, metadata)
    ));
  }

  async runWorkflowsSequential(
    workflows: Array<{ name: string; input?: unknown; metadata?: Record<string, unknown> }>
  ): Promise<WorkflowResult[]> {
    this.logger.info({ count: workflows.length }, 'Starting sequential workflow execution');

    const results: WorkflowResult[] = [];
    let currentInput: unknown;

    for (const { name, input, metadata } of workflows) {
      const result = await this.runWorkflow(name, input ?? currentInput, metadata);
      results.push(result);
      
      if (result.success && result.results.length > 0) {
        currentInput = result.results[result.results.length - 1].data;
      }
    }

    return results;
  }

  getWorkflows(): string[] {
    return Array.from(this.workflows.keys());
  }

  getLogger(): Logger {
    return this.logger;
  }
}
