import { z } from "zod";
import { ILogger } from "./logger.js";

export interface IStepContext {
  logger: ILogger;
  metadata: Record<string, unknown>;
}

export interface StepResult<TOut> {
  success: boolean;
  data?: TOut;
  error?: Error;
  metadata?: Record<string, unknown>;
}

/**
 * BaseStep: Command pattern for workflow steps
 */
export abstract class BaseStep<TIn = unknown, TOut = unknown> {
  constructor(
    protected readonly name: string,
    protected readonly inputSchema?: z.ZodSchema<TIn>,
    protected readonly outputSchema?: z.ZodSchema<TOut>
  ) {}

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

  protected abstract run(input: TIn, context: IStepContext): Promise<StepResult<TOut>>;

  getName(): string {
    return this.name;
  }

  private validateInput(input: TIn): void {
    if (this.inputSchema) {
      this.inputSchema.parse(input);
    }
  }

  private validateOutput(data: TOut | undefined): void {
    if (this.outputSchema && data) {
      this.outputSchema.parse(data);
    }
  }

  private logStart(context: IStepContext, input: TIn): void {
    context.logger.info({ step: this.name, input }, "Step started");
  }

  private logSuccess(context: IStepContext, startTime: number, success: boolean): void {
    context.logger.info(
      { step: this.name, duration: Date.now() - startTime, success },
      "Step completed"
    );
  }

  private handleError(context: IStepContext, error: unknown, startTime: number): StepResult<TOut> {
    const stepError = error instanceof Error ? error : new Error(String(error));
    context.logger.error(
      { step: this.name, duration: Date.now() - startTime, error: stepError.message },
      "Step failed"
    );
    return { success: false, error: stepError };
  }
}
