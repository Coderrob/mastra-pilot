import { describe, it, expect } from 'vitest';
import { Workflow } from './workflow.js';
import { BaseStep, StepContext, StepResult } from './base-step.js';
import pino from 'pino';

class AddStep extends BaseStep<{ value: number }, { value: number }> {
  constructor(private amount: number) {
    super(`AddStep(${amount})`);
  }

  protected async run(
    input: { value: number },
    context: StepContext
  ): Promise<StepResult<{ value: number }>> {
    return {
      success: true,
      data: { value: input.value + this.amount },
    };
  }
}

class MultiplyStep extends BaseStep<{ value: number }, { value: number }> {
  constructor(private factor: number) {
    super(`MultiplyStep(${factor})`);
  }

  protected async run(
    input: { value: number },
    context: StepContext
  ): Promise<StepResult<{ value: number }>> {
    return {
      success: true,
      data: { value: input.value * this.factor },
    };
  }
}

describe('Workflow', () => {
  const logger = pino({ level: 'silent' });

  it('should execute steps in sequence', async () => {
    const workflow = new Workflow({ name: 'TestWorkflow', logger });
    workflow.addStep(new AddStep(5));
    workflow.addStep(new MultiplyStep(2));

    const result = await workflow.execute({ value: 10 });

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(2);
    // (10 + 5) * 2 = 30
    expect(result.results[1].data?.value).toBe(30);
  });

  it('should stop on error when continueOnError is false', async () => {
    class FailingStep extends BaseStep<any, any> {
      constructor() {
        super('FailingStep');
      }
      protected async run(): Promise<StepResult<any>> {
        return { success: false, error: new Error('Failed') };
      }
    }

    const workflow = new Workflow({ name: 'TestWorkflow', logger, continueOnError: false });
    workflow.addStep(new AddStep(5));
    workflow.addStep(new FailingStep());
    workflow.addStep(new MultiplyStep(2));

    const result = await workflow.execute({ value: 10 });

    expect(result.success).toBe(false);
    expect(result.results).toHaveLength(2);
    expect(result.error).toBeDefined();
  });

  it('should continue on error when continueOnError is true', async () => {
    class FailingStep extends BaseStep<any, any> {
      constructor() {
        super('FailingStep');
      }
      protected async run(): Promise<StepResult<any>> {
        return { success: false, error: new Error('Failed') };
      }
    }

    const workflow = new Workflow({ name: 'TestWorkflow', logger, continueOnError: true });
    workflow.addStep(new AddStep(5));
    workflow.addStep(new FailingStep());
    workflow.addStep(new MultiplyStep(2));

    const result = await workflow.execute({ value: 10 });

    expect(result.success).toBe(false);
    expect(result.results).toHaveLength(3);
  });

  it('should return workflow name', () => {
    const workflow = new Workflow({ name: 'TestWorkflow', logger });
    expect(workflow.getName()).toBe('TestWorkflow');
  });

  describe.each([
    { initial: 0, add: 5, multiply: 2, expected: 10 },
    { initial: 10, add: 5, multiply: 2, expected: 30 },
    { initial: -5, add: 10, multiply: 3, expected: 15 },
  ])('workflow calculations', ({ initial, add, multiply, expected }) => {
    it(`(${initial} + ${add}) * ${multiply} = ${expected}`, async () => {
      const workflow = new Workflow({ name: 'TestWorkflow', logger });
      workflow.addStep(new AddStep(add));
      workflow.addStep(new MultiplyStep(multiply));

      const result = await workflow.execute({ value: initial });

      expect(result.success).toBe(true);
      expect(result.results[1].data?.value).toBe(expected);
    });
  });
});
