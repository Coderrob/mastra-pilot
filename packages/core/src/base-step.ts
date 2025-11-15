import { z } from 'zod';
import { ILogger } from './logger.js';

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
 * BaseStep implements the Command pattern for workflow steps
 * Generic type parameters TIn and TOut define input and output types
 */
export abstract class BaseStep<TIn = unknown, TOut = unknown> {
  protected readonly name: string;
  protected readonly inputSchema?: z.ZodSchema<TIn>;
  protected readonly outputSchema?: z.ZodSchema<TOut>;

  constructor(
    name: string,
    inputSchema?: z.ZodSchema<TIn>,
    outputSchema?: z.ZodSchema<TOut>
  ) {
    this.name = name;
    this.inputSchema = inputSchema;
    this.outputSchema = outputSchema;
  }

  /**
   * Execute the step with input validation
   */
  async execute(input: TIn, context: IStepContext): Promise<StepResult<TOut>> {
    const startTime = Date.now();
    context.logger.info({ step: this.name, input }, 'Step execution started');

    try {
      // Validate input if schema is provided
      if (this.inputSchema) {
        this.inputSchema.parse(input);
      }

      // Execute the step implementation
      const result = await this.run(input, context);

      // Validate output if schema is provided
      if (this.outputSchema && result.data) {
        this.outputSchema.parse(result.data);
      }

      const duration = Date.now() - startTime;
      context.logger.info(
        { step: this.name, duration, success: result.success },
        'Step execution completed'
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const stepError = error instanceof Error ? error : new Error(String(error));
      
      context.logger.error(
        { step: this.name, duration, error: stepError.message },
        'Step execution failed'
      );

      return {
        success: false,
        error: stepError,
      };
    }
  }

  /**
   * Abstract method to be implemented by concrete steps
   */
  protected abstract run(input: TIn, context: IStepContext): Promise<StepResult<TOut>>;

  /**
   * Get step name
   */
  getName(): string {
    return this.name;
  }
}
