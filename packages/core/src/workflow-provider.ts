import { z } from 'zod';
import { Logger } from 'pino';

/**
 * Step execution context with typed dependencies
 */
export interface StepExecutionContext {
  logger?: Logger;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Step instance returned by createStep
 */
export interface StepInstance<TIn = unknown, TOut = unknown> {
  id: string;
  description?: string;
  inputSchema?: z.ZodType<TIn>;
  outputSchema?: z.ZodType<TOut>;
  execute: (input: TIn, context: StepExecutionContext) => Promise<TOut>;
}

/**
 * Workflow instance returned by createWorkflow
 */
export interface WorkflowInstance<TIn = unknown, TOut = unknown> {
  id: string;
  name?: string;
  description?: string;
  inputSchema?: z.ZodType<TIn>;
  outputSchema?: z.ZodType<TOut>;
  steps: ReadonlyArray<StepInstance>;
  execute?: (input: TIn, context?: WorkflowExecutionContext) => Promise<TOut>;
}

/**
 * Generic workflow provider interface
 * Allows swapping between Mastra, LangGraph, or other workflow engines
 */
export interface WorkflowProvider {
  createStep<TIn = unknown, TOut = unknown>(config: StepConfig<TIn, TOut>): StepInstance<TIn, TOut>;
  createWorkflow<TIn = unknown, TOut = unknown>(config: WorkflowConfig<TIn, TOut>): WorkflowInstance<TIn, TOut>;
  execute<TIn = unknown, TOut = unknown>(
    workflow: WorkflowInstance<TIn, TOut>,
    input: TIn,
    context?: WorkflowExecutionContext
  ): Promise<WorkflowExecutionResult<TOut>>;
}

export interface StepConfig<TIn = unknown, TOut = unknown> {
  id: string;
  description?: string;
  inputSchema?: z.ZodType<TIn>;
  outputSchema?: z.ZodType<TOut>;
  execute: (input: TIn, context: StepExecutionContext) => Promise<TOut>;
}

export interface WorkflowConfig<TIn = unknown, TOut = unknown> {
  id: string;
  name: string;
  description?: string;
  inputSchema?: z.ZodType<TIn>;
  outputSchema?: z.ZodType<TOut>;
  steps: ReadonlyArray<StepInstance>;
}

export interface WorkflowExecutionContext {
  logger?: Logger;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface WorkflowExecutionResult<TOut = unknown> {
  success: boolean;
  data?: TOut;
  error?: Error;
  results?: ReadonlyArray<unknown>;
  duration?: number;
}
