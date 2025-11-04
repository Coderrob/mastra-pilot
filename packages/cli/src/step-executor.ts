import { BaseStep, StepResult } from '@repo/core';
import { Logger } from 'pino';
import {
  FileReadStep,
  CsvWriteStep,
  HttpStep,
  ShellStep,
  GitStep,
} from '@repo/steps';

type StepConstructor = new () => BaseStep<any, any>;

const STEP_REGISTRY: Record<string, StepConstructor> = {
  'file-read': FileReadStep,
  'csv-write': CsvWriteStep,
  'http': HttpStep,
  'shell': ShellStep,
  'git': GitStep,
};

/**
 * Create step instance by type
 */
export function createStep(type: string): BaseStep<any, any> {
  const StepClass = STEP_REGISTRY[type];
  
  if (!StepClass) {
    throw new Error(`Unknown step type: ${type}`);
  }
  
  return new StepClass();
}

/**
 * Execute a step with given input
 */
export async function executeStep<TIn, TOut>(
  step: BaseStep<TIn, TOut>,
  input: TIn,
  logger: Logger
): Promise<StepResult<TOut>> {
  return step.execute(input, { logger, metadata: {} });
}
