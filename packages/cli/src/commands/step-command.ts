import { createStep, executeStep } from "../executors/step-executor.js";
import { handleError, handleSuccess } from "../handlers/result-handlers.js";
import { parseInput } from "../input/parse-input.js";
import { createLogger } from "../logger/create-logger.js";
import { createOutputWriter } from "../output/console-writer.js";

/**
 * Configuration options for running a single step
 */
interface StepOptions {
  file?: string;
  input?: string;
}

/**
 * Executes a single step with the provided type and options
 * @param type - The step type identifier
 * @param options - Step configuration including input data
 */
export async function runStep(type: string, options: StepOptions): Promise<void> {
  const logger = createLogger();
  const writer = createOutputWriter();

  try {
    const input = parseInput(options);
    const step = createStep(type);
    const result = await executeStep(step, input, logger);

    if (!result.success) {
      handleError(writer, logger, result.error, "Step failed");
    }

    handleSuccess(writer, "Step completed successfully", result.data);
  } catch (error) {
    handleError(writer, logger, error, "Error executing step");
  }
}
