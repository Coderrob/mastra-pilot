import { z } from "zod";
import { ILogger } from "./logger.js";

/**
 * Execution context passed to step operations
 */
export interface IStepContext {
  logger: ILogger;
  metadata: Record<string, unknown>;
}

/**
 * Result object returned by step execution.
 * Contains the success status, output data, error information, and optional metadata.
 */
export interface StepResult<TOut> {
  data?: TOut;
  error?: Error;
  metadata?: Record<string, unknown>;
  success: boolean;
}

/**
 * BaseStep: Command pattern for workflow steps
 */
export abstract class BaseStep<TIn = unknown, TOut = unknown> {
  /**
   * Creates a new BaseStep instance.
   * @param name - Unique identifier for this step
   * @param inputSchema - Optional Zod schema for validating input data
   * @param outputSchema - Optional Zod schema for validating output data
   */
  constructor(
    protected readonly name: string,
    protected readonly inputSchema?: z.ZodSchema<TIn>,
    protected readonly outputSchema?: z.ZodSchema<TOut>
  ) {}

  /**
   * Executes the step with input validation, error handling, and logging.
   * @param input - The input data for this step
   * @param context - The execution context providing logger and metadata
   * @returns A promise resolving to the step result
   */
  async execute(input: TIn, context: IStepContext): Promise<StepResult<TOut>> {
    const startTime = Date.now();
    this.logStart(context, input);

    try {
      this.validateInput(input);
      const result = await this.run(input, context);
      this.validateOutput(result.data);
      this.logSuccess(context, startTime, result.success);
      return result;
    } catch (error) {
      return this.handleError(context, error, startTime);
    }
  }

  /**
   * Gets the name of this step.
   * @returns The step name
   */
  getName(): string {
    return this.name;
  }

  protected abstract run(input: TIn, context: IStepContext): Promise<StepResult<TOut>>;

  /**
   * Handles errors during step execution by logging and returning a failure result.
   * @param context - The execution context
   * @param error - The error that occurred
   * @param startTime - The timestamp when execution started
   * @returns A failure step result containing the error
   */
  private handleError(context: IStepContext, error: unknown, startTime: number): StepResult<TOut> {
    const stepError = error instanceof Error ? error : new Error(String(error));
    context.logger.error(
      { duration: Date.now() - startTime, error: stepError.message, step: this.name },
      "Step failed"
    );
    return { error: stepError, success: false };
  }

  /**
   * Logs the start of step execution.
   * @param context - The execution context
   * @param input - The input data being processed
   */
  private logStart(context: IStepContext, input: TIn): void {
    context.logger.info({ input, step: this.name }, "Step started");
  }

  /**
   * Logs the successful completion of step execution with duration.
   * @param context - The execution context
   * @param startTime - The timestamp when execution started
   * @param success - Whether the step completed successfully
   */
  private logSuccess(context: IStepContext, startTime: number, success: boolean): void {
    context.logger.info(
      { duration: Date.now() - startTime, step: this.name, success },
      "Step completed"
    );
  }

  /**
   * Validates the input against the configured schema if present.
   * @param input - The input data to validate
   * @throws {ZodError} When validation fails
   */
  private validateInput(input: TIn): void {
    if (this.inputSchema) {
      this.inputSchema.parse(input);
    }
  }

  /**
   * Validates the output data against the configured schema if present.
   * @param data - The output data to validate
   * @throws {ZodError} When validation fails
   */
  private validateOutput(data: TOut | undefined): void {
    if (this.outputSchema && data) {
      this.outputSchema.parse(data);
    }
  }
}
