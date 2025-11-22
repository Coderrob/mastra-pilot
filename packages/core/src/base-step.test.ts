import pino from "pino";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { BaseStep, IStepContext, StepResult } from "./base-step.js";

/**
 * Test step that always throws an error.
 * Used for testing error handling behavior.
 */
class FailingStep extends BaseStep<{ value: number }, { result: number }> {
  /**
   * Creates a FailingStep without schema validation.
   */
  constructor() {
    super("FailingStep");
  }

  /**
   * Always throws an error to test error handling.
   * @param _input - The input object (unused)
   * @param _input.value - The numeric value (unused)
   * @param _context - The step execution context (unused)
   * @returns Never returns successfully; always throws
   */
  protected async run(
    _input: { value: number },
    _context: IStepContext
  ): Promise<StepResult<{ result: number }>> {
    await Promise.resolve();
    throw new Error("Step failed");
  }
}

// Test implementation of BaseStep
/**
 * Test step that doubles the input value.
 * Used for testing successful step execution with schema validation.
 */
class TestStep extends BaseStep<{ value: number }, { doubled: number }> {
  /**
   * Creates a TestStep with input and output schemas.
   */
  constructor() {
    const inputSchema = z.object({ value: z.number() });
    const outputSchema = z.object({ doubled: z.number() });
    super("TestStep", inputSchema, outputSchema);
  }

  /**
   * Doubles the input value.
   * @param input - The input object
   * @param input.value - The numeric value to double
   * @param _context - The step execution context (unused)
   * @returns A promise resolving to the doubled value
   */
  protected async run(
    input: { value: number },
    _context: IStepContext
  ): Promise<StepResult<{ doubled: number }>> {
    await Promise.resolve();
    return {
      data: { doubled: input.value * 2 },
      success: true,
    };
  }
}

describe("BaseStep", () => {
  const logger = pino({ level: "silent" });
  const context: IStepContext = { logger, metadata: {} };

  it("should execute successfully with valid input", async () => {
    const step = new TestStep();
    const result = await step.execute({ value: 5 }, context);

    expect(result.success).toBe(true);
    expect(result.data?.doubled).toBe(10);
    expect(result.error).toBeUndefined();
  });

  it("should validate input schema", async () => {
    const step = new TestStep();
    const result = await step.execute({ value: "invalid" } as { value: number }, context);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toContain("Expected number");
  });

  it("should handle step execution errors", async () => {
    const step = new FailingStep();
    const result = await step.execute({ value: 5 }, context);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe("Step failed");
  });

  it("should return step name", () => {
    const step = new TestStep();
    expect(step.getName()).toBe("TestStep");
  });

  describe("value doubling", () => {
    it.each([
      { expected: 2, input: { value: 1 } },
      { expected: 20, input: { value: 10 } },
      { expected: -10, input: { value: -5 } },
      { expected: 0, input: { value: 0 } },
    ])("should double $input.value to $expected", async ({ expected, input }) => {
      const step = new TestStep();
      const result = await step.execute(input, context);

      expect(result.success).toBe(true);
      expect(result.data?.doubled).toBe(expected);
    });
  });
});
