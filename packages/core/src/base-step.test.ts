import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { BaseStep, StepContext, StepResult } from './base-step.js';

// Test implementation of BaseStep
class TestStep extends BaseStep<{ value: number }, { doubled: number }> {
  constructor() {
    const inputSchema = z.object({ value: z.number() });
    const outputSchema = z.object({ doubled: z.number() });
    super('TestStep', inputSchema, outputSchema);
  }

  protected async run(
    input: { value: number },
    context: StepContext
  ): Promise<StepResult<{ doubled: number }>> {
    return {
      success: true,
      data: { doubled: input.value * 2 },
    };
  }
}

class FailingStep extends BaseStep<{ value: number }, { result: number }> {
  constructor() {
    super('FailingStep');
  }

  protected async run(
    input: { value: number },
    context: StepContext
  ): Promise<StepResult<{ result: number }>> {
    throw new Error('Step failed');
  }
}

describe('BaseStep', () => {
  const logger = pino({ level: 'silent' });
  const context: StepContext = { logger, metadata: {} };

  it('should execute successfully with valid input', async () => {
    const step = new TestStep();
    const result = await step.execute({ value: 5 }, context);

    expect(result.success).toBe(true);
    expect(result.data?.doubled).toBe(10);
    expect(result.error).toBeUndefined();
  });

  it('should validate input schema', async () => {
    const step = new TestStep();
    const result = await step.execute({ value: 'invalid' } as any, context);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toContain('Expected number');
  });

  it('should handle step execution errors', async () => {
    const step = new FailingStep();
    const result = await step.execute({ value: 5 }, context);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('Step failed');
  });

  it('should return step name', () => {
    const step = new TestStep();
    expect(step.getName()).toBe('TestStep');
  });

  describe('value doubling', () => {
    it.each([
      { input: { value: 1 }, expected: 2 },
      { input: { value: 10 }, expected: 20 },
      { input: { value: -5 }, expected: -10 },
      { input: { value: 0 }, expected: 0 },
    ])('should double $input.value to $expected', async ({ input, expected }) => {
      const step = new TestStep();
      const result = await step.execute(input, context);

      expect(result.success).toBe(true);
      expect(result.data?.doubled).toBe(expected);
    });
  });
});
