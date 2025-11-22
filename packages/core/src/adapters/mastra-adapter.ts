import { z } from "zod";
import type {
  IStepConfig,
  IStepExecutionContext,
  IStepInstance,
  IWorkflowConfig,
  IWorkflowExecutionContext,
  IWorkflowExecutionResult,
  IWorkflowInstance,
  IWorkflowProvider,
} from "../workflow-provider.js";

/**
 * Mastra workflow provider adapter
 * Note: This is a simplified implementation providing type-safe workflow execution.
 * Full Mastra integration pending API stabilization in future versions.
 * The adapter provides the structure for future integration while maintaining type safety.
 */
export class MastraAdapter implements IWorkflowProvider {
  /**
   * Creates a type-safe step instance with schema validation
   * @param config - Step configuration including id, description, schemas, and execute function
   * @returns A step instance with validated input/output execution
   */
  createStep<TIn = unknown, TOut = unknown>(
    config: IStepConfig<TIn, TOut>
  ): IStepInstance<TIn, TOut> {
    const { description, execute, id, inputSchema, outputSchema } = config;

    // Use provided schemas or create default ones if not specified
    const effectiveInputSchema = inputSchema || (z.unknown() as z.ZodType<TIn>);
    const effectiveOutputSchema = outputSchema || (z.unknown() as z.ZodType<TOut>);

    // Create a step instance that matches IStepInstance interface
    // This provides type-safe execution with Zod schema validation
    return {
      description,
      id,
      inputSchema: effectiveInputSchema,
      outputSchema: effectiveOutputSchema,
      /**
       * Executes the step with input and output validation
       * @param input - The input data for the step
       * @param context - Execution context with logger and metadata
       * @returns The validated output from the step execution
       */
      execute: async (input: TIn, context: IStepExecutionContext) => {
        this.validateInput(inputSchema, effectiveInputSchema, input);
        const result = await execute(input, context);
        this.validateOutput(outputSchema, effectiveOutputSchema, result);
        return result;
      },
    };
  }

  /**
   * Creates a type-safe workflow instance with sequential step execution
   * @param config - Workflow configuration including id, name, description, schemas, and steps
   * @returns A workflow instance with validated execution
   */
  createWorkflow<TIn = unknown, TOut = unknown>(
    config: IWorkflowConfig<TIn, TOut>
  ): IWorkflowInstance<TIn, TOut> {
    const { description, id, inputSchema, name, outputSchema, steps } = config;

    // Use provided schemas or create default ones if not specified
    const effectiveInputSchema = inputSchema || (z.unknown() as z.ZodType<TIn>);
    const effectiveOutputSchema = outputSchema || (z.unknown() as z.ZodType<TOut>);

    // Create a workflow instance that matches IWorkflowInstance interface
    // This provides type-safe workflow composition with schema validation
    return {
      description,
      id,
      inputSchema: effectiveInputSchema,
      name,
      outputSchema: effectiveOutputSchema,
      steps: Object.freeze([...steps]),
      /**
       * Executes the workflow with input and output validation
       * @param input - The input data for the workflow
       * @param context - Execution context with logger and metadata
       * @returns The validated output from the workflow execution
       */
      execute: async (input: TIn, context?: IWorkflowExecutionContext) => {
        this.validateInput(inputSchema, effectiveInputSchema, input, "Workflow input");
        const output = await this.executeStepsSequentially<TIn, TOut>(steps, input, context);
        this.validateOutput(outputSchema, effectiveOutputSchema, output, "Workflow output");
        return output;
      },
    };
  }

  /**
   * Executes a workflow instance and returns the result with timing information
   * @param workflow - The workflow instance to execute
   * @param input - The input data for the workflow
   * @param context - Optional execution context with logger and metadata
   * @returns Workflow execution result with success status, data, and duration
   */
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

  /**
   * Creates an error result object with error details and timing
   * @param error - The error that occurred during execution
   * @param startTime - The timestamp when execution started
   * @returns Workflow execution result indicating failure
   */
  private createErrorResult<TOut>(
    error: unknown,
    startTime: number
  ): IWorkflowExecutionResult<TOut> {
    return {
      data: undefined,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error : new Error(String(error)),
      results: Object.freeze([]),
      success: false,
    };
  }

  /**
   * Creates a success result object with execution data and timing
   * @param data - The successful output data
   * @param startTime - The timestamp when execution started
   * @returns Workflow execution result indicating success
   */
  private createSuccessResult<TOut>(data: TOut, startTime: number): IWorkflowExecutionResult<TOut> {
    return {
      data,
      duration: Date.now() - startTime,
      error: undefined,
      results: Object.freeze([]),
      success: true,
    };
  }

  /**
   * Executes an array of steps sequentially, passing output from one step to the next
   * @param steps - Array of step instances to execute in order
   * @param input - Initial input data for the first step
   * @param context - Optional execution context with logger and metadata
   * @returns The final output after all steps have been executed
   */
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

  /**
   * Executes a workflow using its execute method or falls back to sequential step execution
   * @param workflow - The workflow instance to execute
   * @param input - The input data for the workflow
   * @param context - Optional execution context with logger and metadata
   * @returns The output data from the workflow execution
   */
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

  /**
   * Validates input data against the provided schema if defined
   * @param schema - Optional Zod schema for validation
   * @param effectiveSchema - The effective schema to use for validation
   * @param input - The input data to validate
   * @param prefix - Prefix for error messages
   * @returns void
   */
  private validateInput<T>(
    schema: undefined | z.ZodType<T>,
    effectiveSchema: z.ZodType<T>,
    input: T,
    prefix: string = "Input"
  ): void {
    if (!schema) return;
    this.validateWithSchema(effectiveSchema, input, prefix);
  }

  /**
   * Validates output data against the provided schema if defined
   * @param schema - Optional Zod schema for validation
   * @param effectiveSchema - The effective schema to use for validation
   * @param output - The output data to validate
   * @param prefix - Prefix for error messages
   * @returns void
   */
  private validateOutput<T>(
    schema: undefined | z.ZodType<T>,
    effectiveSchema: z.ZodType<T>,
    output: T,
    prefix: string = "Output"
  ): void {
    if (!schema) return;
    this.validateWithSchema(effectiveSchema, output, prefix);
  }

  /**
   * Validates data against a Zod schema and throws on validation failure
   * @param schema - Zod schema to validate against
   * @param data - The data to validate
   * @param prefix - Prefix for error messages
   * @returns void
   */
  private validateWithSchema<T>(schema: z.ZodType<T>, data: T, prefix: string): void {
    const parseResult = schema.safeParse(data);
    if (!parseResult.success) {
      throw new Error(`${prefix} validation failed: ${parseResult.error.message}`);
    }
  }
}
