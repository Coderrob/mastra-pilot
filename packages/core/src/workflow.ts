import { BaseStep, IStepContext, StepResult } from "./base-step.js";
import { ILogger } from "./logger.js";

/**
 * Definition of a workflow step with its instance and name
 */
export type StepDefinition = {
  name: string;
  step: BaseStep<unknown, unknown>;
};

/**
 * Configuration options for creating a workflow instance
 */
export interface WorkflowOptions {
  continueOnError?: boolean;
  logger: ILogger;
  name: string;
}

/**
 * Result of a workflow execution with aggregated step results
 */
export interface WorkflowResult {
  duration: number;
  error?: Error;
  results: StepResult<unknown>[];
  success: boolean;
}

/**
 * Workflow implements the Composite pattern for orchestrating multiple steps
 */
export class Workflow {
  private readonly continueOnError: boolean;
  private readonly logger: ILogger;
  private readonly name: string;
  private readonly steps: StepDefinition[] = [];

  /**
   * Creates a new Workflow instance
   * @param options - Configuration options for the workflow
   */
  constructor(options: WorkflowOptions) {
    this.name = options.name;
    this.logger = options.logger;
    this.continueOnError = options.continueOnError ?? false;
  }

  /**
   * Adds a step to the workflow
   * @param step - The step to add to the workflow
   * @param name - Optional custom name for the step
   * @returns The workflow instance for method chaining
   */
  addStep(step: BaseStep<unknown, unknown>, name?: string): this {
    this.steps.push({
      name: name ?? step.getName(),
      step,
    });
    return this;
  }

  /**
   * Executes the workflow with the provided input and metadata
   * @param initialInput - The initial input data for the workflow
   * @param metadata - Additional metadata to pass to steps
   * @returns A promise that resolves to the workflow execution result
   */
  async execute(
    initialInput: unknown = {},
    metadata: Record<string, unknown> = {}
  ): Promise<WorkflowResult> {
    const startTime = Date.now();
    this.logger.info({ workflow: this.name }, "Workflow execution started");

    const context: IStepContext = {
      logger: this.logger.child({ workflow: this.name }),
      metadata,
    };

    const results = await this.executeSteps(initialInput, context, startTime);
    return this.createResult(results, startTime);
  }

  /**
   * Gets the name of the workflow
   * @returns The workflow name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Gets a copy of the workflow's steps
   * @returns An array of step definitions
   */
  getSteps(): StepDefinition[] {
    return [...this.steps];
  }

  /**
   * Creates the workflow result from step results
   * @param results - The array of step execution results
   * @param startTime - The workflow start time in milliseconds
   * @returns The workflow execution result
   */
  private createResult(results: StepResult<unknown>[], startTime: number): WorkflowResult {
    const duration = Date.now() - startTime;
    const success = results.every((r) => r.success);
    const error = results.find((r) => !r.success)?.error;

    this.logger.info({ duration, success, workflow: this.name }, "Workflow execution completed");

    return {
      duration,
      error,
      results,
      success,
    };
  }

  /**
   * Executes a single step in the workflow
   * @param stepDef - The step definition to execute
   * @param input - The input data for the step
   * @param context - The execution context for the step
   * @returns A promise that resolves to the step execution result
   */
  private async executeStep(
    stepDef: StepDefinition,
    input: unknown,
    context: IStepContext
  ): Promise<StepResult<unknown>> {
    return stepDef.step.execute(input, context);
  }

  /**
   * Executes all steps in the workflow sequentially
   * @param initialInput - The initial input data for the first step
   * @param context - The execution context for the steps
   * @param startTime - The workflow start time in milliseconds
   * @returns A promise that resolves to an array of step results
   */
  private async executeSteps(
    initialInput: unknown,
    context: IStepContext,
    startTime: number
  ): Promise<StepResult<unknown>[]> {
    const results: StepResult<unknown>[] = [];
    let currentInput = initialInput;

    for (const stepDef of this.steps) {
      const result = await this.executeStep(stepDef, currentInput, context);
      results.push(result);

      if (this.shouldStopExecution(result)) {
        this.logFailure(startTime, stepDef.name);
        return results;
      }

      currentInput = result.data;
    }

    return results;
  }

  /**
   * Logs a workflow failure
   * @param startTime - The workflow start time in milliseconds
   * @param stepName - The name of the step that failed
   */
  private logFailure(startTime: number, stepName: string): void {
    const duration = Date.now() - startTime;
    this.logger.error(
      { duration, failedStep: stepName, workflow: this.name },
      "Workflow execution failed"
    );
  }

  /**
   * Determines whether workflow execution should stop based on step result
   * @param result - The result of the step execution
   * @returns True if execution should stop, false otherwise
   */
  private shouldStopExecution(result: StepResult<unknown>): boolean {
    return !result.success && !this.continueOnError;
  }
}
