import { describe, it, expect, beforeEach } from 'vitest';
import { Runner } from './runner.js';
import { Workflow } from './workflow.js';
import { BaseStep, StepContext, StepResult } from './base-step.js';
import pino from 'pino';

class SimpleStep extends BaseStep<{ value: number }, { value: number }> {
  constructor() {
    super('SimpleStep');
  }

  protected async run(
    input: { value: number },
    context: StepContext
  ): Promise<StepResult<{ value: number }>> {
    return {
      success: true,
      data: { value: input.value + 1 },
    };
  }
}

describe('Runner', () => {
  let runner: Runner;
  const logger = pino({ level: 'silent' });

  beforeEach(() => {
    runner = new Runner({ logger });
  });

  it('should register and run a workflow', async () => {
    const workflow = new Workflow({ name: 'TestWorkflow', logger });
    workflow.addStep(new SimpleStep());

    runner.registerWorkflow(workflow);

    const result = await runner.runWorkflow('TestWorkflow', { value: 5 });

    expect(result.success).toBe(true);
    expect(result.results[0].data?.value).toBe(6);
  });

  it('should throw error for non-existent workflow', async () => {
    await expect(
      runner.runWorkflow('NonExistent', {})
    ).rejects.toThrow("Workflow 'NonExistent' not found");
  });

  it('should run workflows in parallel', async () => {
    const workflow1 = new Workflow({ name: 'Workflow1', logger });
    workflow1.addStep(new SimpleStep());

    const workflow2 = new Workflow({ name: 'Workflow2', logger });
    workflow2.addStep(new SimpleStep());

    runner.registerWorkflow(workflow1);
    runner.registerWorkflow(workflow2);

    const results = await runner.runWorkflowsParallel([
      { name: 'Workflow1', input: { value: 1 } },
      { name: 'Workflow2', input: { value: 2 } },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
    expect(results[0].results[0].data?.value).toBe(2);
    expect(results[1].results[0].data?.value).toBe(3);
  });

  it('should run workflows sequentially', async () => {
    const workflow1 = new Workflow({ name: 'Workflow1', logger });
    workflow1.addStep(new SimpleStep());

    const workflow2 = new Workflow({ name: 'Workflow2', logger });
    workflow2.addStep(new SimpleStep());

    runner.registerWorkflow(workflow1);
    runner.registerWorkflow(workflow2);

    const results = await runner.runWorkflowsSequential([
      { name: 'Workflow1', input: { value: 1 } },
      { name: 'Workflow2' }, // Should use output from previous workflow
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
    // First workflow: 1 + 1 = 2
    expect(results[0].results[0].data?.value).toBe(2);
    // Second workflow: 2 + 1 = 3
    expect(results[1].results[0].data?.value).toBe(3);
  });

  it('should return list of registered workflows', () => {
    const workflow1 = new Workflow({ name: 'Workflow1', logger });
    const workflow2 = new Workflow({ name: 'Workflow2', logger });

    runner.registerWorkflow(workflow1);
    runner.registerWorkflow(workflow2);

    const workflows = runner.getWorkflows();

    expect(workflows).toEqual(['Workflow1', 'Workflow2']);
  });
});
