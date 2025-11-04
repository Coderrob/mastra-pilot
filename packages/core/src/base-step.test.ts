import { describe, it, expect, vi } from 'vitest';
import { BaseStep, StepContext, StepResult } from './base-step.js';
import { z } from 'zod';
import pino from 'pino';

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
  });

  it('should handle step execution errors', async () => {
    const step = new FailingStep();
    const result = await step.execute({ value: 5 }, context);

    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Step failed');
  });

  it('should return step name', () => {
    const step = new TestStep();
    expect(step.getName()).toBe('TestStep');
  });

  describe.each([
    { input: { value: 1 }, expected: 2 },
    { input: { value: 10 }, expected: 20 },
    { input: { value: -5 }, expected: -10 },
    { input: { value: 0 }, expected: 0 },
  ])('should double values correctly', ({ input, expected }) => {
    it(`doubles ${input.value} to ${expected}`, async () => {
      const step = new TestStep();
      const result = await step.execute(input, context);

      expect(result.success).toBe(true);
      expect(result.data?.doubled).toBe(expected);
    });
  });
});
