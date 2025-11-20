import { z } from "zod";
import { ILogger } from "./logger.js";

/**
 * Step execution context with typed dependencies
 */
export interface IStepExecutionContext {
  logger?: ILogger;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Step instance returned by createStep
 */
export interface IStepInstance<TIn = unknown, TOut = unknown> {
  id: string;
  description?: string;
  inputSchema?: z.ZodType<TIn>;
  outputSchema?: z.ZodType<TOut>;
  execute: (input: TIn, context: IStepExecutionContext) => Promise<TOut>;
}

/**
 * Workflow instance returned by createWorkflow
 */
export interface IWorkflowInstance<TIn = unknown, TOut = unknown> {
  id: string;
  name?: string;
  description?: string;
  inputSchema?: z.ZodType<TIn>;
  outputSchema?: z.ZodType<TOut>;
  steps: ReadonlyArray<IStepInstance>;
  execute?: (input: TIn, context?: IWorkflowExecutionContext) => Promise<TOut>;
}

/**
 * Generic workflow provider interface
 * Allows swapping between Mastra, LangGraph, or other workflow engines
 */
export interface IWorkflowProvider {
  createStep<TIn = unknown, TOut = unknown>(
    config: IStepConfig<TIn, TOut>
  ): IStepInstance<TIn, TOut>;
  createWorkflow<TIn = unknown, TOut = unknown>(
    config: IWorkflowConfig<TIn, TOut>
  ): IWorkflowInstance<TIn, TOut>;
  execute<TIn = unknown, TOut = unknown>(
    workflow: IWorkflowInstance<TIn, TOut>,
    input: TIn,
    context?: IWorkflowExecutionContext
  ): Promise<IWorkflowExecutionResult<TOut>>;
}

export interface IStepConfig<TIn = unknown, TOut = unknown> {
  id: string;
  description?: string;
  inputSchema?: z.ZodType<TIn>;
  outputSchema?: z.ZodType<TOut>;
  execute: (input: TIn, context: IStepExecutionContext) => Promise<TOut>;
}

export interface IWorkflowConfig<TIn = unknown, TOut = unknown> {
  id: string;
  name: string;
  description?: string;
  inputSchema?: z.ZodType<TIn>;
  outputSchema?: z.ZodType<TOut>;
  steps: ReadonlyArray<IStepInstance>;
}

export interface IWorkflowExecutionContext {
  logger?: ILogger;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface IWorkflowExecutionResult<TOut = unknown> {
  success: boolean;
  data?: TOut;
  error?: Error;
  results?: ReadonlyArray<unknown>;
  duration?: number;
}
