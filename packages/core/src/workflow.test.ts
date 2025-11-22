import pino from "pino";
import { describe, expect, it } from "vitest";
import { BaseStep, IStepContext, StepResult } from "./base-step.js";
import { Workflow } from "./workflow.js";

describe("Workflow", () => {
  /**
   * Test step that adds a fixed amount to the input value.
   */
  class AddStep extends BaseStep<{ value: number }, { value: number }> {
    /**
     * Creates an AddStep instance.
     * @param amount - The amount to add to the input value
     */
    constructor(private readonly amount: number) {
      super(`AddStep(${amount})`);
    }

    /**
     * Test step that adds the specified amount to the input value.
     * @param input - The input object containing the value to add to
     * @param input.value - The numeric value to be added to
     * @param _context - The step execution context (unused)
     * @returns A promise resolving to a successful result with the added value
     */
    protected async run(
      input: { value: number },
      _context: IStepContext
    ): Promise<StepResult<{ value: number }>> {
      await Promise.resolve();
      return {
        data: { value: input.value + this.amount },
        success: true,
      };
    }
  }

  /**
   * Test step that multiplies the input value by a fixed factor.
   */
  class MultiplyStep extends BaseStep<{ value: number }, { value: number }> {
    /**
     * Creates a MultiplyStep instance.
     * @param factor - The factor to multiply the input value by
     */
    constructor(private readonly factor: number) {
      super(`MultiplyStep(${factor})`);
    }

    /**
     * Test step that multiplies the input value.
     * @param input - The input object containing the value to multiply
     * @param input.value - The numeric value to be multiplied
     * @param _context - The step execution context (unused)
     * @returns A promise resolving to a successful result with the multiplied value
     */
    protected async run(
      input: { value: number },
      _context: IStepContext
    ): Promise<StepResult<{ value: number }>> {
      await Promise.resolve();
      return {
        data: { value: input.value * this.factor },
        success: true,
      };
    }
  }

  /**
   * Test step that always fails.
   */
  class FailingStep extends BaseStep<{ value: number }, { value: number }> {
    /**
     * Creates a FailingStep instance.
     */
    constructor() {
      super("FailingStep");
    }
    /**
     * Always returns a failure result.
     * @param _input - The input object (unused)
     * @param _input.value - The numeric value (unused)
     * @param _context - The step execution context (unused)
     * @returns A promise resolving to a failure result
     */
    protected async run(
      _input: { value: number },
      _context: IStepContext
    ): Promise<StepResult<{ value: number }>> {
      await Promise.resolve();
      return { error: new Error("Failed"), success: false };
    }
  }

  const logger = pino({ level: "silent" });

  it("should execute steps in sequence", async () => {
    const workflow = new Workflow({ logger, name: "TestWorkflow" });
    workflow.addStep(new AddStep(5));
    workflow.addStep(new MultiplyStep(2));

    const result = await workflow.execute({ value: 10 });

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(2);
    // (10 + 5) * 2 = 30
    expect(result.results[1].data?.value).toBe(30);
  });

  it("should stop on error when continueOnError is false", async () => {
    const workflow = new Workflow({ continueOnError: false, logger, name: "TestWorkflow" });
    workflow.addStep(new AddStep(5));
    workflow.addStep(new FailingStep());
    workflow.addStep(new MultiplyStep(2));

    const result = await workflow.execute({ value: 10 });

    expect(result.success).toBe(false);
    expect(result.results).toHaveLength(2);
    expect(result.error).toBeDefined();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe("Failed");
  });

  it("should continue on error when continueOnError is true", async () => {
    const workflow = new Workflow({ continueOnError: true, logger, name: "TestWorkflow" });
    workflow.addStep(new AddStep(5));
    workflow.addStep(new FailingStep());
    workflow.addStep(new MultiplyStep(2));

    const result = await workflow.execute({ value: 10 });

    expect(result.success).toBe(false);
    expect(result.results).toHaveLength(3);
  });

  it("should return workflow name", () => {
    const workflow = new Workflow({ logger, name: "TestWorkflow" });
    expect(workflow.getName()).toBe("TestWorkflow");
  });

  describe("workflow calculations", () => {
    it.each([
      { add: 5, expected: 10, initial: 0, multiply: 2 },
      { add: 5, expected: 30, initial: 10, multiply: 2 },
      { add: 10, expected: 15, initial: -5, multiply: 3 },
    ])(
      "should calculate ($initial + $add) * $multiply = $expected",
      async ({ add, expected, initial, multiply }) => {
        const workflow = new Workflow({ logger, name: "TestWorkflow" });
        workflow.addStep(new AddStep(add));
        workflow.addStep(new MultiplyStep(multiply));

        const result = await workflow.execute({ value: initial });

        expect(result.success).toBe(true);
        expect((result.results[1].data as undefined | { value: number })?.value).toBe(expected);
      }
    );
  });
});
