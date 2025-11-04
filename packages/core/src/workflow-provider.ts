import { z } from 'zod';

/**
 * Generic workflow provider interface
 * Allows swapping between Mastra, LangGraph, or other workflow engines
 */
export interface WorkflowProvider {
  createStep<TIn, TOut>(config: StepConfig<TIn, TOut>): any;
  createWorkflow<TIn, TOut>(config: WorkflowConfig<TIn, TOut>): any;
  execute(workflow: any, input: any, context?: any): Promise<any>;
}

export interface StepConfig<TIn = any, TOut = any> {
  id: string;
  description?: string;
  inputSchema?: z.ZodType<TIn>;
  outputSchema?: z.ZodType<TOut>;
  execute: (input: TIn, context: any) => Promise<TOut>;
}

export interface WorkflowConfig<TIn = any, TOut = any> {
  id: string;
  name: string;
  description?: string;
  inputSchema?: z.ZodType<TIn>;
  outputSchema?: z.ZodType<TOut>;
  steps: any[];
}

export interface WorkflowExecutionContext {
  logger?: any;
  metadata?: Record<string, unknown>;
  [key: string]: any;
}
