import pino from "pino";
import { LogLevel } from "./enums.js";
import { ILogger } from "./logger.js";
import { Workflow, WorkflowResult } from "./workflow.js";

/**
 * Runner interface for workflow execution
 * Defines contract for workflow orchestration with Strategy pattern
 */
export interface IRunner {
  getLogger(): ILogger;
  getWorkflows(): string[];
  registerWorkflow(workflow: Workflow): this;
  runWorkflow(
    name: string,
    input?: unknown,
    metadata?: Record<string, unknown>
  ): Promise<WorkflowResult>;
  runWorkflowsParallel(
    workflows: Array<{
      input?: unknown;
      metadata?: Record<string, unknown>;
      name: string;
    }>
  ): Promise<WorkflowResult[]>;
  runWorkflowsSequential(
    workflows: Array<{
      input?: unknown;
      metadata?: Record<string, unknown>;
      name: string;
    }>
  ): Promise<WorkflowResult[]>;
}

/**
 * Configuration options for Runner initialization
 */
export interface IRunnerOptions {
  logger?: ILogger;
  logLevel?: LogLevel;
}

/**
 * Runner implements the Strategy pattern for executing workflows
 * Provides different execution strategies and observability
 */
export class Runner implements IRunner {
  private readonly logger: ILogger;
  private readonly workflows: Map<string, Workflow> = new Map();

  /**
   * Creates a new Runner instance with optional configuration
   * @param options Configuration options including logger and log level
   */
  constructor(options: IRunnerOptions = {}) {
    this.logger = options.logger ?? this.createDefaultLogger(options.logLevel);
  }

  /**
   * Gets the logger instance used by this runner
   * @returns The logger instance
   */
  getLogger(): ILogger {
    return this.logger;
  }

  /**
   * Gets the names of all registered workflows
   * @returns Array of registered workflow names
   */
  getWorkflows(): string[] {
    return [...this.workflows.keys()];
  }

  /**
   * Registers a workflow for execution
   * @param workflow The workflow instance to register
   * @returns This runner instance for chaining
   */
  registerWorkflow(workflow: Workflow): this {
    this.workflows.set(workflow.getName(), workflow);
    this.logger.info({ workflow: workflow.getName() }, "Workflow registered");
    return this;
  }

  /**
   * Executes a registered workflow by name
   * @param name The name of the workflow to execute
   * @param input Optional input data for the workflow
   * @param metadata Optional metadata for the workflow execution
   * @returns A promise resolving to the workflow execution result
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

    this.logger.info({ workflow: name }, "Starting workflow execution");
    return workflow.execute(input, metadata);
  }

  /**
   * Executes multiple workflows in parallel
   * @param workflows Array of workflow configurations to execute
   * @returns A promise resolving to an array of workflow results
   */
  async runWorkflowsParallel(
    workflows: Array<{
      input?: unknown;
      metadata?: Record<string, unknown>;
      name: string;
    }>
  ): Promise<WorkflowResult[]> {
    this.logger.info({ count: workflows.length }, "Starting parallel workflow execution");
    return Promise.all(
      workflows.map(({ input, metadata, name }) => this.runWorkflow(name, input, metadata))
    );
  }

  /**
   * Executes multiple workflows sequentially, passing output to next workflow
   * @param workflows Array of workflow configurations to execute
   * @returns A promise resolving to an array of workflow results
   */
  async runWorkflowsSequential(
    workflows: Array<{
      input?: unknown;
      metadata?: Record<string, unknown>;
      name: string;
    }>
  ): Promise<WorkflowResult[]> {
    this.logger.info({ count: workflows.length }, "Starting sequential workflow execution");

    const results: WorkflowResult[] = [];
    let currentInput: unknown;

    for (const { input, metadata, name } of workflows) {
      const result = await this.runWorkflow(name, input ?? currentInput, metadata);
      results.push(result);
      currentInput = this.extractNextInput(result, currentInput);
    }

    return results;
  }

  /**
   * Creates a default pino logger with pretty printing
   * @param logLevel The log level to use for the logger
   * @returns A configured pino logger instance
   */
  private createDefaultLogger(logLevel?: LogLevel): ILogger {
    return pino({
      level: logLevel ?? LogLevel.INFO,
      transport: {
        options: {
          colorize: true,
        },
        target: "pino-pretty",
      },
    });
  }

  /**
   * Extracts the next input from a workflow result or returns fallback
   * @param result The workflow result to extract data from
   * @param fallback The fallback value if extraction fails
   * @returns The extracted input or fallback value
   */
  private extractNextInput(result: WorkflowResult, fallback: unknown): unknown {
    if (!this.hasValidResults(result)) return fallback;
    const lastResult = result.results.at(-1);
    return lastResult ? lastResult.data : fallback;
  }

  /**
   * Checks if a workflow result contains valid results
   * @param result The workflow result to validate
   * @returns True if the result is successful and has results
   */
  private hasValidResults(result: WorkflowResult): boolean {
    return result.success && result.results.length > 0;
  }
}
