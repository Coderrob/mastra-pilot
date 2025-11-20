import { BaseStep } from "@repo/core";
import { CsvWriteStep } from "./csv-write.step.js";
import { FileReadStep } from "./file-read.step.js";
import { GitStep } from "./git.step.js";
import { HttpStep } from "./http.step.js";
import { ShellStep } from "./shell.step.js";

/**
 * StepFactory implements the Factory pattern for creating step instances
 */
export class StepFactory {
  private static readonly stepRegistry = new Map<
    string,
    () => BaseStep<unknown, unknown>
  >([
    ["file-read", () => new FileReadStep()],
    ["csv-write", () => new CsvWriteStep()],
    ["http", () => new HttpStep()],
    ["shell", () => new ShellStep()],
    ["git", () => new GitStep()],
  ]);

  /**
   * Create a step by type name
   */
  static createStep(type: string): BaseStep<unknown, unknown> {
    const factory = this.stepRegistry.get(type);
    if (!factory) {
      throw new Error(`Unknown step type: ${type}`);
    }
    return factory();
  }

  /**
   * Register a custom step type
   */
  static registerStep(type: string, factory: () => BaseStep<unknown, unknown>): void {
    this.stepRegistry.set(type, factory);
  }

  /**
   * Get all registered step types
   */
  static getStepTypes(): string[] {
    return Array.from(this.stepRegistry.keys());
  }

  /**
   * Check if a step type is registered
   */
  static hasStepType(type: string): boolean {
    return this.stepRegistry.has(type);
  }
}
