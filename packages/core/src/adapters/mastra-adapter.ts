import { z } from 'zod';
import type { 
  IStepConfig, 
  IStepExecutionContext, 
  IStepInstance, 
  IWorkflowConfig,
  IWorkflowExecutionContext,
  IWorkflowExecutionResult,
  IWorkflowInstance,
  IWorkflowProvider 
} from '../workflow-provider.js';

/**
 * Mastra workflow provider adapter
 * Note: This is a simplified implementation providing type-safe workflow execution.
 * Full Mastra integration pending API stabilization in future versions.
 * The adapter provides the structure for future integration while maintaining type safety.
 */
export class MastraAdapter implements IWorkflowProvider {
  createStep<TIn = unknown, TOut = unknown>(config: IStepConfig<TIn, TOut>): IStepInstance<TIn, TOut> {
    const { id, description, inputSchema, outputSchema, execute } = config;

    // Use provided schemas or create default ones if not specified
    const effectiveInputSchema = inputSchema || z.unknown() as z.ZodType<TIn>;
    const effectiveOutputSchema = outputSchema || z.unknown() as z.ZodType<TOut>;

    // Create a step instance that matches IStepInstance interface
    // This provides type-safe execution with Zod schema validation
    return {
      id,
      description,
      inputSchema: effectiveInputSchema,
      outputSchema: effectiveOutputSchema,
      execute: async (input: TIn, context: IStepExecutionContext) => {
        this.validateInput(inputSchema, effectiveInputSchema, input);
        const result = await execute(input, context);
        this.validateOutput(outputSchema, effectiveOutputSchema, result);
        return result;
      },
    };
  }

  createWorkflow<TIn = unknown, TOut = unknown>(config: IWorkflowConfig<TIn, TOut>): IWorkflowInstance<TIn, TOut> {
    const { id, name, description, inputSchema, outputSchema, steps } = config;

    // Use provided schemas or create default ones if not specified
    const effectiveInputSchema = inputSchema || z.unknown() as z.ZodType<TIn>;
    const effectiveOutputSchema = outputSchema || z.unknown() as z.ZodType<TOut>;

    // Create a workflow instance that matches IWorkflowInstance interface
    // This provides type-safe workflow composition with schema validation
    return {
      id,
      name,
      description,
      inputSchema: effectiveInputSchema,
      outputSchema: effectiveOutputSchema,
      steps: Object.freeze([...steps]),
      execute: async (input: TIn, context?: IWorkflowExecutionContext) => {
        this.validateInput(inputSchema, effectiveInputSchema, input, 'Workflow input');
        const output = await this.executeStepsSequentially<TIn, TOut>(steps, input, context);
        this.validateOutput(outputSchema, effectiveOutputSchema, output, 'Workflow output');
        return output;
      },
    };
  }

  async execute<TIn = unknown, TOut = unknown>(
    workflow: IWorkflowInstance<TIn, TOut>,
    input: TIn,
    context?: IWorkflowExecutionContext
  ): Promise<IWorkflowExecutionResult<TOut>> {
    const startTime = Date.now();
    
    try {
      const data = await this.executeWorkflow(workflow, input, context);
      return this.createSuccessResult(data, startTime);
    } catch (error) {
      return this.createErrorResult(error, startTime);
    }
  }

  private validateInput<T>(
    schema: z.ZodType<T> | undefined,
    effectiveSchema: z.ZodType<T>,
    input: T,
    prefix: string = 'Input'
  ): void {
    if (!schema) return;
    this.validateWithSchema(effectiveSchema, input, prefix);
  }

  private validateOutput<T>(
    schema: z.ZodType<T> | undefined,
    effectiveSchema: z.ZodType<T>,
    output: T,
    prefix: string = 'Output'
  ): void {
    if (!schema) return;
    this.validateWithSchema(effectiveSchema, output, prefix);
  }

  private validateWithSchema<T>(
    schema: z.ZodType<T>,
    data: T,
    prefix: string
  ): void {
    const parseResult = schema.safeParse(data);
    if (!parseResult.success) {
      throw new Error(`${prefix} validation failed: ${parseResult.error.message}`);
    }
  }

  private async executeStepsSequentially<TIn, TOut>(
    steps: readonly IStepInstance[],
    input: TIn,
    context?: IWorkflowExecutionContext
  ): Promise<TOut> {
    let currentInput: unknown = input;
    for (const step of steps) {
      currentInput = await step.execute(currentInput, context || {});
    }
    return currentInput as TOut;
  }

  private async executeWorkflow<TIn, TOut>(
    workflow: IWorkflowInstance<TIn, TOut>,
    input: TIn,
    context?: IWorkflowExecutionContext
  ): Promise<TOut> {
    if (workflow.execute) {
      return await workflow.execute(input, context);
    }
    return await this.executeStepsSequentially(workflow.steps, input, context);
  }

  private createSuccessResult<TOut>(data: TOut, startTime: number): IWorkflowExecutionResult<TOut> {
    return {
      success: true,
      data,
      error: undefined,
      results: Object.freeze([]),
      duration: Date.now() - startTime,
    };
  }

  private createErrorResult<TOut>(error: unknown, startTime: number): IWorkflowExecutionResult<TOut> {
    return {
      success: false,
      data: undefined,
      error: error instanceof Error ? error : new Error(String(error)),
      results: Object.freeze([]),
      duration: Date.now() - startTime,
    };
  }
}
