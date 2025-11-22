import { z } from "zod";
import { ILogger } from "./logger.js";

/**
 * Configuration for creating a step instance
 */
export interface IStepConfig<TIn = unknown, TOut = unknown> {
  description?: string;
  execute: (input: TIn, context: IStepExecutionContext) => Promise<TOut>;
  id: string;
  inputSchema?: z.ZodType<TIn>;
  outputSchema?: z.ZodType<TOut>;
}

/**
 * Step execution context with typed dependencies
 */
export interface IStepExecutionContext {
  [key: string]: unknown;
  logger?: ILogger;
  metadata?: Record<string, unknown>;
}

/**
 * Step instance returned by createStep
 */
export interface IStepInstance<TIn = unknown, TOut = unknown> {
  description?: string;
  execute: (input: TIn, context: IStepExecutionContext) => Promise<TOut>;
  id: string;
  inputSchema?: z.ZodType<TIn>;
  outputSchema?: z.ZodType<TOut>;
}

/**
 * Configuration for creating a workflow instance
 */
export interface IWorkflowConfig<TIn = unknown, TOut = unknown> {
  description?: string;
  id: string;
  inputSchema?: z.ZodType<TIn>;
  name: string;
  outputSchema?: z.ZodType<TOut>;
  steps: ReadonlyArray<IStepInstance>;
}

/**
 * Context passed during workflow execution with logger and metadata
 */
export interface IWorkflowExecutionContext {
  [key: string]: unknown;
  logger?: ILogger;
  metadata?: Record<string, unknown>;
}

/**
 * Result of workflow execution with success status and optional data
 */
export interface IWorkflowExecutionResult<TOut = unknown> {
  data?: TOut;
  duration?: number;
  error?: Error;
  results?: ReadonlyArray<unknown>;
  success: boolean;
}

/**
 * Workflow instance returned by createWorkflow
 */
export interface IWorkflowInstance<TIn = unknown, TOut = unknown> {
  description?: string;
  execute?: (input: TIn, context?: IWorkflowExecutionContext) => Promise<TOut>;
  id: string;
  inputSchema?: z.ZodType<TIn>;
  name?: string;
  outputSchema?: z.ZodType<TOut>;
  steps: ReadonlyArray<IStepInstance>;
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
