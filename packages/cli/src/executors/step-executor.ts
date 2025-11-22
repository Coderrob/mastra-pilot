import { BaseStep, ILogger, StepResult, StepType, UnknownStepTypeError } from "@repo/core";
import { CsvWriteStep, FileReadStep, GitStep, HttpStep, ShellStep } from "@repo/steps";

/**
 * Constructor type for creating step instances
 */
type StepConstructor = new () => BaseStep<unknown, unknown>;

const STEP_REGISTRY: Record<StepType, StepConstructor> = {
  [StepType.CSV_WRITE]: CsvWriteStep,
  [StepType.FILE_READ]: FileReadStep,
  [StepType.GIT]: GitStep,
  [StepType.HTTP]: HttpStep,
  [StepType.SHELL]: ShellStep,
};

/**
 * Creates a step instance by type using the registry
 * @param type - The step type identifier
 * @returns Configured step instance
 * @throws UnknownStepTypeError if step type is not found in registry
 */
export function createStep(type: string): BaseStep<unknown, unknown> {
  const StepClass = STEP_REGISTRY[type as StepType];

  if (!StepClass) {
    const validTypes = Object.values(StepType);
    throw new UnknownStepTypeError(type, validTypes);
  }

  return new StepClass();
}

/**
 * Executes a step with the provided input and context
 * @param step - The step instance to execute
 * @param input - Input data for the step
 * @param logger - Logger instance for tracking execution
 * @returns Step execution result including success status and output data
 */
export async function executeStep<TIn, TOut>(
  step: BaseStep<TIn, TOut>,
  input: TIn,
  logger: ILogger
): Promise<StepResult<TOut>> {
  return step.execute(input, { logger, metadata: {} });
}
