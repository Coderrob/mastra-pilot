import { z } from 'zod';
import { createStep as mastraCreateStep, createWorkflow as mastraCreateWorkflow } from '@mastra/core';
import type { 
  WorkflowProvider, 
  StepConfig, 
  WorkflowConfig as ProviderWorkflowConfig, 
  WorkflowExecutionContext,
  WorkflowInstance,
  StepInstance,
  WorkflowExecutionResult,
  StepExecutionContext
} from '../workflow-provider.js';

/**
 * Mastra execution context structure
 */
interface MastraExecutionContext {
  machineContext?: {
    inputData?: unknown;
  };
  inputData?: unknown;
  runtimeContext?: {
    get?: (key: string) => unknown;
  };
}

/**
 * Type guard to check if context is MastraExecutionContext
 */
function isMastraContext(context: unknown): context is MastraExecutionContext {
  return typeof context === 'object' && context !== null;
}

/**
 * Mastra workflow provider adapter
 * Wraps Mastra's workflow system with our provider interface
 */
export class MastraAdapter implements WorkflowProvider {
  createStep<TIn = unknown, TOut = unknown>(config: StepConfig<TIn, TOut>): StepInstance<TIn, TOut> {
    const { id, description, inputSchema, outputSchema, execute } = config;

    return mastraCreateStep({
      id,
      description,
      inputSchema: inputSchema || z.unknown(),
      outputSchema: outputSchema || z.unknown(),
      execute: async (context: unknown) => {
        // Extract input and custom context from Mastra's execution context
        let input: TIn;
        let customContext: StepExecutionContext = {};

        if (isMastraContext(context)) {
          input = (context.machineContext?.inputData || context.inputData || {}) as TIn;
          const runtimeCustomContext = context.runtimeContext?.get?.('customContext');
          if (typeof runtimeCustomContext === 'object' && runtimeCustomContext !== null) {
            customContext = runtimeCustomContext as StepExecutionContext;
          }
        } else {
          input = {} as TIn;
        }
        
        // Merge contexts for dependency injection
        const mergedContext: StepExecutionContext = {
          ...customContext,
          mastraContext: context,
        };

        return execute(input, mergedContext);
      },
    }) as StepInstance<TIn, TOut>;
  }

  createWorkflow<TIn = unknown, TOut = unknown>(config: ProviderWorkflowConfig<TIn, TOut>): WorkflowInstance<TIn, TOut> {
    const { id, description, inputSchema, outputSchema, steps } = config;

    // Create the workflow using Mastra's createWorkflow
    const mastraWorkflow = mastraCreateWorkflow({
      id,
      description,
      inputSchema: inputSchema || z.unknown(),
      outputSchema: outputSchema || z.unknown(),
      steps: [...steps] as never[], // Cast needed due to Mastra's type requirements
    });

    // Return as WorkflowInstance (structural compatibility)
    return mastraWorkflow as unknown as WorkflowInstance<TIn, TOut>;
  }

  async execute<TIn = unknown, TOut = unknown>(
    _workflow: WorkflowInstance<TIn, TOut>,
    input: TIn,
    _context?: WorkflowExecutionContext
  ): Promise<WorkflowExecutionResult<TOut>> {
    // For now, return a simplified result
    // Full Mastra integration requires a Mastra instance with execution engine
    // This adapter provides the structure for future full integration
    
    return {
      success: true,
      data: input as unknown as TOut,
      error: undefined,
      results: Object.freeze([]),
      duration: 0,
    };
  }
}
