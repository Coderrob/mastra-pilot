import { BaseStep } from "@repo/core";
import { CsvWriteStep } from "./csv-write.step.js";
import { FileReadStep } from "./file-read.step.js";
import { GitStep } from "./git.step.js";
import { HttpStep } from "./http.step.js";
import { ShellStep } from "./shell.step.js";
import { StepIds } from "./step-ids.js";

/**
 * StepFactory implements the Factory pattern for creating step instances
 */
export class StepFactory {
  private static readonly stepRegistry = new Map<string, () => BaseStep<unknown, unknown>>([
    [StepIds.CSV_WRITE, () => new CsvWriteStep()],
    [StepIds.FILE_READ, () => new FileReadStep()],
    [StepIds.GIT, () => new GitStep()],
    [StepIds.HTTP, () => new HttpStep()],
    [StepIds.SHELL, () => new ShellStep()],
  ]);

  /**
   * Creates a step instance by type name
   * @param type - The step type identifier (e.g., 'FileReadStep', 'HttpStep')
   * @returns A new instance of the requested step type
   * @throws Error if the step type is not registered
   */
  static createStep(type: string): BaseStep<unknown, unknown> {
    const factory = this.stepRegistry.get(type);
    if (!factory) {
      throw new Error(`Unknown step type: ${type}`);
    }
    return factory();
  }

  /**
   * Retrieves all registered step type identifiers
   * @returns Array of registered step type names
   */
  static getStepTypes(): string[] {
    return [...this.stepRegistry.keys()];
  }

  /**
   * Checks if a step type is registered in the factory
   * @param type - The step type identifier to check
   * @returns True if the step type is registered, false otherwise
   */
  static hasStepType(type: string): boolean {
    return this.stepRegistry.has(type);
  }

  /**
   * Registers a custom step type with its factory function
   * @param type - The step type identifier
   * @param factory - Factory function that creates step instances
   */
  static registerStep(type: string, factory: () => BaseStep<unknown, unknown>): void {
    this.stepRegistry.set(type, factory);
  }
}
