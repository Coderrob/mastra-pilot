import { BaseStep, ILogger, StepResult, StepType, UnknownStepTypeError } from "@repo/core";
import { CsvWriteStep, FileReadStep, GitStep, HttpStep, ShellStep } from "@repo/steps";

type StepConstructor = new () => BaseStep<unknown, unknown>;

const STEP_REGISTRY: Record<StepType, StepConstructor> = {
  [StepType.FILE_READ]: FileReadStep,
  [StepType.CSV_WRITE]: CsvWriteStep,
  [StepType.HTTP]: HttpStep,
  [StepType.SHELL]: ShellStep,
  [StepType.GIT]: GitStep,
};

export function createStep(type: string): BaseStep<unknown, unknown> {
  const StepClass = STEP_REGISTRY[type as StepType];

  if (!StepClass) {
    const validTypes = Object.values(StepType);
    throw new UnknownStepTypeError(type, validTypes);
  }

  return new StepClass();
}

export async function executeStep<TIn, TOut>(
  step: BaseStep<TIn, TOut>,
  input: TIn,
  logger: ILogger
): Promise<StepResult<TOut>> {
  return step.execute(input, { logger, metadata: {} });
}
