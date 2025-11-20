import pino from "pino";
import { LogLevel } from "./enums.js";
import { ILogger } from "./logger.js";
import { Workflow, WorkflowResult } from "./workflow.js";

export interface IRunnerOptions {
  logger?: ILogger;
  logLevel?: LogLevel;
}

/**
 * Runner interface for workflow execution
 * Defines contract for workflow orchestration with Strategy pattern
 */
export interface IRunner {
  registerWorkflow(workflow: Workflow): this;
  runWorkflow(
    name: string,
    input?: unknown,
    metadata?: Record<string, unknown>
  ): Promise<WorkflowResult>;
  runWorkflowsParallel(
    workflows: Array<{
      name: string;
      input?: unknown;
      metadata?: Record<string, unknown>;
    }>
  ): Promise<WorkflowResult[]>;
  runWorkflowsSequential(
    workflows: Array<{
      name: string;
      input?: unknown;
      metadata?: Record<string, unknown>;
    }>
  ): Promise<WorkflowResult[]>;
  getWorkflows(): string[];
  getLogger(): ILogger;
}

/**
 * Runner implements the Strategy pattern for executing workflows
 * Provides different execution strategies and observability
 */
export class Runner implements IRunner {
  private readonly logger: ILogger;
  private readonly workflows: Map<string, Workflow> = new Map();

  constructor(options: IRunnerOptions = {}) {
    this.logger = options.logger ?? this.createDefaultLogger(options.logLevel);
  }

  private createDefaultLogger(logLevel?: LogLevel): ILogger {
    return pino({
      level: logLevel ?? LogLevel.INFO,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
    });
  }

  registerWorkflow(workflow: Workflow): this {
    this.workflows.set(workflow.getName(), workflow);
    this.logger.info({ workflow: workflow.getName() }, "Workflow registered");
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

    this.logger.info({ workflow: name }, "Starting workflow execution");
    return workflow.execute(input, metadata);
  }

  async runWorkflowsParallel(
    workflows: Array<{
      name: string;
      input?: unknown;
      metadata?: Record<string, unknown>;
    }>
  ): Promise<WorkflowResult[]> {
    this.logger.info(
      { count: workflows.length },
      "Starting parallel workflow execution"
    );
    return Promise.all(
      workflows.map(({ name, input, metadata }) =>
        this.runWorkflow(name, input, metadata)
      )
    );
  }

  async runWorkflowsSequential(
    workflows: Array<{
      name: string;
      input?: unknown;
      metadata?: Record<string, unknown>;
    }>
  ): Promise<WorkflowResult[]> {
    this.logger.info(
      { count: workflows.length },
      "Starting sequential workflow execution"
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
      currentInput = this.extractNextInput(result, currentInput);
    }

    return results;
  }

  private extractNextInput(result: WorkflowResult, fallback: unknown): unknown {
    if (!this.hasValidResults(result)) return fallback;
    const lastResult = result.results.at(-1);
    return lastResult ? lastResult.data : fallback;
  }

  private hasValidResults(result: WorkflowResult): boolean {
    return result.success && result.results.length > 0;
  }

  getWorkflows(): string[] {
    return Array.from(this.workflows.keys());
  }

  getLogger(): ILogger {
    return this.logger;
  }
}
