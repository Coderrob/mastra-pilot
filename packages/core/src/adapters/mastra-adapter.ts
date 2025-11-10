import { z } from 'zod';
import type { 
  IWorkflowProvider, 
  IStepConfig, 
  IWorkflowConfig as ProviderWorkflowConfig, 
  IWorkflowExecutionContext,
  IWorkflowInstance,
  IStepInstance,
  IWorkflowExecutionResult,
  IStepExecutionContext
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
        // Validate input using Zod schema if provided
        if (inputSchema) {
          const parseResult = effectiveInputSchema.safeParse(input);
          if (!parseResult.success) {
            throw new Error(`Input validation failed: ${parseResult.error.message}`);
          }
        }

        // Execute the user's function with validated input and context
        const result = await execute(input, context);

        // Validate output using Zod schema if provided
        if (outputSchema) {
          const parseResult = effectiveOutputSchema.safeParse(result);
          if (!parseResult.success) {
            throw new Error(`Output validation failed: ${parseResult.error.message}`);
          }
        }

        return result;
      },
    };
  }

  createWorkflow<TIn = unknown, TOut = unknown>(config: ProviderWorkflowConfig<TIn, TOut>): IWorkflowInstance<TIn, TOut> {
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
        // Validate workflow input
        if (inputSchema) {
          const parseResult = effectiveInputSchema.safeParse(input);
          if (!parseResult.success) {
            throw new Error(`Workflow input validation failed: ${parseResult.error.message}`);
          }
        }

        // Execute steps sequentially, passing output to next step
        let currentInput: unknown = input;
        for (const step of steps) {
          currentInput = await step.execute(currentInput, context || {});
        }

        // Validate workflow output
        const output = currentInput as TOut;
        if (outputSchema) {
          const parseResult = effectiveOutputSchema.safeParse(output);
          if (!parseResult.success) {
            throw new Error(`Workflow output validation failed: ${parseResult.error.message}`);
          }
        }

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
      // Execute workflow using its execute function if available
      let data: TOut;
      if (workflow.execute) {
        data = await workflow.execute(input, context);
      } else {
        // Fallback: execute steps sequentially
        let currentInput: unknown = input;
        for (const step of workflow.steps) {
          currentInput = await step.execute(currentInput, context || {});
        }
        data = currentInput as TOut;
      }

      return {
        success: true,
        data,
        error: undefined,
        results: Object.freeze([]),
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        data: undefined,
        error: error instanceof Error ? error : new Error(String(error)),
        results: Object.freeze([]),
        duration: Date.now() - startTime,
      };
    }
  }
}
