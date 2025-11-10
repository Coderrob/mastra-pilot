import { BaseStep, StepResult, StepType, UnknownStepTypeError, ILogger } from '@repo/core';
import {
  FileReadStep,
  CsvWriteStep,
  HttpStep,
  ShellStep,
  GitStep,
} from '@repo/steps';

type StepConstructor = new () => BaseStep<any, any>;

/**
 * Step registry mapping StepType enum values to their implementations
 * Uses enum keys instead of hard-coded strings for type safety
 */
const STEP_REGISTRY: Record<StepType, StepConstructor> = {
  [StepType.FILE_READ]: FileReadStep,
  [StepType.CSV_WRITE]: CsvWriteStep,
  [StepType.HTTP]: HttpStep,
  [StepType.SHELL]: ShellStep,
  [StepType.GIT]: GitStep,
};

/**
 * Create step instance by type
 * Accepts string input from CLI and validates against StepType enum
 * @throws {UnknownStepTypeError} When step type is not recognized
 */
export function createStep<TIn = unknown, TOut = unknown>(type: string): BaseStep<TIn, TOut> {
  // Validate that the type is a valid StepType by checking the registry
  const StepClass = STEP_REGISTRY[type as StepType];
  
  if (!StepClass) {
    const validTypes = Object.values(StepType);
    throw new UnknownStepTypeError(type, validTypes);
  }
  
  return new StepClass();
}

/**
 * Execute a step with given input
 */
export async function executeStep<TIn, TOut>(
  step: BaseStep<TIn, TOut>,
  input: TIn,
  logger: ILogger
): Promise<StepResult<TOut>> {
  return step.execute(input, { logger, metadata: {} });
}
