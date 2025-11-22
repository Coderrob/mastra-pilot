import pino from "pino";
import { hasGetName, hasId } from "@repo/utils";
import { MastraAdapter } from "./adapters/mastra-adapter.js";
import { LogLevel } from "./enums.js";
import { WorkflowExecutionError } from "./errors.js";
import { ILogger } from "./logger.js";
import { IWorkflowExecutionResult, WorkflowFacade } from "./workflow-facade.js";
import {
  IWorkflowProvider,
  IWorkflowInstance as ProviderWorkflowInstance,
} from "./workflow-provider.js";
import { Workflow } from "./workflow.js";

/**
 * Configuration options for RunnerAdapter initialization
 */
export interface IRunnerAdapterOptions {
  logger?: ILogger;
  logLevel?: LogLevel;
  provider?: IWorkflowProvider;
}

/**
 * Workflow instance - can be legacy Workflow, Mastra workflow, or Mastra step
 */
export type WorkflowInstance =
  | Workflow
  | {
      [key: string]: unknown;
      execute?: (input: unknown, context?: unknown) => Promise<unknown>;
      getName?: () => string;
      id?: string;
    };

/**
 * RunnerAdapter - Adapter pattern for executing workflows through provider abstraction
 * Supports both legacy workflows and provider-based workflows (Mastra, LangGraph, etc.)
 */
export class RunnerAdapter {
  private readonly facade: WorkflowFacade;
  private readonly logger: ILogger;
  private readonly workflows: Map<string, Readonly<WorkflowInstance>> = new Map();

  /**
   * Creates a new RunnerAdapter instance
   * @param options Configuration options including logger, log level, and provider
   */
  constructor(options: IRunnerAdapterOptions = {}) {
    this.logger = this.createLogger(options);
    this.facade = this.createFacade(options);
  }

  /**
   * Get the workflow facade
   * @returns The workflow facade instance
   */
  getFacade(): WorkflowFacade {
    return this.facade;
  }

  /**
   * Get the logger instance
   * @returns The logger instance used by this adapter
   */
  getLogger(): ILogger {
    return this.logger;
  }

  /**
   * Get all registered workflow IDs
   * @returns Array of registered workflow identifiers
   */
  getWorkflows(): string[] {
    return [...this.workflows.keys()];
  }

  /**
   * Register a workflow (can be legacy or provider-based)
   * @param workflow - The workflow instance to register
   * @param id - Optional custom ID for the workflow
   * @returns The runner adapter instance for method chaining
   */
  registerWorkflow(workflow: WorkflowInstance, id?: string): this {
    const workflowId = this.getWorkflowId(workflow, id);
    this.workflows.set(workflowId, Object.freeze(workflow));
    this.logger.info({ workflow: workflowId }, "Workflow registered");
    return this;
  }

  /**
   * Execute a workflow by ID
   * @param id - The unique identifier of the workflow to execute
   * @param input - Optional input data for the workflow
   * @param context - Optional execution context with metadata
   * @returns A promise resolving to the workflow execution result
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

    this.logger.info({ workflow: id }, "Starting workflow execution");

    // Create execution context with logger and custom metadata
    const executionContext = {
      logger: this.logger,
      metadata: context || {},
      ...context,
    };

    // Execute through the facade - cast workflow for execution compatibility
    return this.facade.execute(
      workflow as unknown as ProviderWorkflowInstance,
      input,
      executionContext
    );
  }

  /**
   * Execute multiple workflows in parallel
   * @param workflows - Array of workflow configurations with ID, input, and context
   * @returns A promise resolving to an array of execution results
   */
  async runWorkflowsParallel(
    workflows: ReadonlyArray<{
      context?: Record<string, unknown>;
      id: string;
      input?: unknown;
    }>
  ): Promise<IWorkflowExecutionResult[]> {
    this.logger.info({ count: workflows.length }, "Starting parallel workflow execution");

    const promises = workflows.map(({ context, id, input }) =>
      this.runWorkflow(id, input, context)
    );

    return Promise.all(promises);
  }

  /**
   * Execute multiple workflows sequentially
   * @param workflows - Array of workflow configurations with ID, input, and context
   * @returns A promise resolving to an array of execution results
   */
  async runWorkflowsSequential(
    workflows: ReadonlyArray<{
      context?: Record<string, unknown>;
      id: string;
      input?: unknown;
    }>
  ): Promise<IWorkflowExecutionResult[]> {
    this.logger.info({ count: workflows.length }, "Starting sequential workflow execution");

    const results: IWorkflowExecutionResult[] = [];
    let currentInput: unknown;

    for (const config of workflows) {
      const result = await this.executeWorkflowInSequence(config, currentInput);
      results.push(result);
      currentInput = this.updateInputFromResult(result, currentInput);
    }

    return results;
  }

  /**
   * Creates a WorkflowFacade with the provided options
   * @param options - Configuration options for the facade
   * @returns A new WorkflowFacade instance
   */
  private createFacade(options: IRunnerAdapterOptions): WorkflowFacade {
    const provider = options.provider || new MastraAdapter();
    return new WorkflowFacade(provider);
  }

  /**
   * Creates a logger instance from options or default pino logger
   * @param options Configuration options containing optional logger and log level
   * @returns A configured logger instance
   */
  private createLogger(options: IRunnerAdapterOptions): ILogger {
    return (
      options.logger ??
      pino({
        level: options.logLevel ?? LogLevel.INFO,
        transport: {
          options: {
            colorize: true,
          },
          target: "pino-pretty",
        },
      })
    );
  }

  /**
   * Executes a single workflow as part of a sequential chain.
   * @param config - Workflow configuration
   * @param config.id - The workflow ID to execute
   * @param config.input - Optional workflow input
   * @param config.context - Optional execution context
   * @param currentInput - The current input from previous workflow results
   * @returns A promise resolving to the workflow execution result
   */
  private async executeWorkflowInSequence(
    config: { context?: Record<string, unknown>; id: string; input?: unknown },
    currentInput: unknown
  ): Promise<IWorkflowExecutionResult> {
    return this.runWorkflow(config.id, config.input ?? currentInput, config.context);
  }

  /**
   * Extracts a unique identifier from a workflow instance.
   * @param workflow - The workflow instance to extract ID from
   * @returns The workflow ID, name, or "unnamed-workflow" as fallback
   */
  private extractWorkflowId(workflow: WorkflowInstance): string {
    if (this.hasWorkflowId(workflow)) return workflow.id;
    if (hasGetName(workflow)) return workflow.getName();
    return "unnamed-workflow";
  }

  /**
   * Gets the workflow ID from either the provided ID or the workflow instance
   * @param workflow - The workflow instance
   * @param id - Optional custom ID for the workflow
   * @returns The workflow ID
   */
  private getWorkflowId(workflow: WorkflowInstance, id?: string): string {
    return id || this.extractWorkflowId(workflow);
  }

  /**
   * Type guard to check if a workflow has a valid ID property.
   * @param workflow - The workflow instance to check
   * @returns True if the workflow has a non-empty ID
   */
  private hasWorkflowId(workflow: WorkflowInstance): workflow is WorkflowInstance & { id: string } {
    return hasId(workflow) && workflow.id != undefined && workflow.id !== "";
  }

  /**
   * Updates the input for the next workflow based on the previous result.
   * @param result - The execution result from the previous workflow
   * @param currentInput - The current input value
   * @returns The result data if successful, otherwise the current input
   */
  private updateInputFromResult(result: IWorkflowExecutionResult, currentInput: unknown): unknown {
    return result.success && result.data ? result.data : currentInput;
  }
}
