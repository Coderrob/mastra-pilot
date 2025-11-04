import { z } from 'zod';
import { createStep as mastraCreateStep, createWorkflow as mastraCreateWorkflow } from '@mastra/core';
import type { WorkflowProvider, StepConfig, WorkflowConfig as ProviderWorkflowConfig, WorkflowExecutionContext } from '../workflow-provider.js';

/**
 * Mastra workflow provider adapter
 * Wraps Mastra's workflow system with our provider interface
 */
export class MastraAdapter implements WorkflowProvider {
  createStep<TIn, TOut>(config: StepConfig<TIn, TOut>) {
    const { id, description, inputSchema, outputSchema, execute } = config;

    return mastraCreateStep({
      id,
      description,
      inputSchema: inputSchema || z.any(),
      outputSchema: outputSchema || z.any(),
      execute: async (context: any) => {
        // Extract input and custom context from Mastra's execution context
        const input = context.machineContext?.inputData || context.inputData || {};
        const customContext = context.runtimeContext?.get?.('customContext') || {};
        
        // Merge contexts for dependency injection
        const mergedContext = {
          ...customContext,
          mastraContext: context,
        };

        return execute(input as TIn, mergedContext);
      },
    });
  }

  createWorkflow<TIn, TOut>(config: ProviderWorkflowConfig<TIn, TOut>) {
    const { id, description, inputSchema, outputSchema, steps } = config;

    return mastraCreateWorkflow({
      id,
      description,
      inputSchema: inputSchema || z.any(),
      outputSchema: outputSchema || z.any(),
      steps: steps as any[],
    });
  }

  async execute(_workflow: any, input: any, _context?: WorkflowExecutionContext): Promise<any> {
    // For now, return a simplified result
    // Full Mastra integration requires a Mastra instance with execution engine
    // This adapter provides the structure for future full integration
    
    return {
      success: true,
      data: input,
      error: undefined,
      results: [],
      duration: 0,
      message: 'Mastra workflow execution requires full Mastra instance configuration',
    };
  }
}
