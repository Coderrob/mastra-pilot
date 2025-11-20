import { BaseStep, IStepContext, StepResult } from './base-step.js';
import { ILogger } from './logger.js';

export type StepDefinition = {
  step: BaseStep<unknown, unknown>;
  name: string;
};

export interface WorkflowOptions {
  name: string;
  logger: ILogger;
  continueOnError?: boolean;
}

/**
 * Workflow implements the Composite pattern for orchestrating multiple steps
 */
export class Workflow {
  private readonly name: string;
  private readonly steps: StepDefinition[] = [];
  private readonly logger: ILogger;
  private readonly continueOnError: boolean;

  constructor(options: WorkflowOptions) {
    this.name = options.name;
    this.logger = options.logger;
    this.continueOnError = options.continueOnError ?? false;
  }

  addStep(step: BaseStep<unknown, unknown>, name?: string): this {
    this.steps.push({
      step,
      name: name ?? step.getName(),
    });
    return this;
  }

  async execute(
    initialInput: unknown = {},
    metadata: Record<string, unknown> = {}
  ): Promise<WorkflowResult> {
    const startTime = Date.now();
    this.logger.info({ workflow: this.name }, 'Workflow execution started');

    const context: IStepContext = {
      logger: this.logger.child({ workflow: this.name }),
      metadata,
    };

    const results = await this.executeSteps(initialInput, context, startTime);
    return this.createResult(results, startTime);
  }

  private async executeSteps(
    initialInput: unknown,
    context: IStepContext,
    startTime: number
  ): Promise<StepResult<unknown>[]> {
    const results: StepResult<unknown>[] = [];
    let currentInput = initialInput;

    for (const stepDef of this.steps) {
      const result = await this.executeStep(stepDef, currentInput, context);
      results.push(result);

      if (this.shouldStopExecution(result)) {
        this.logFailure(startTime, stepDef.name);
        return results;
      }

      currentInput = result.data;
    }

    return results;
  }

  private async executeStep(
    stepDef: StepDefinition,
    input: unknown,
    context: IStepContext
  ): Promise<StepResult<unknown>> {
    return stepDef.step.execute(input, context);
  }

  private shouldStopExecution(result: StepResult<unknown>): boolean {
    return !result.success && !this.continueOnError;
  }

  private logFailure(startTime: number, stepName: string): void {
    const duration = Date.now() - startTime;
    this.logger.error(
      { workflow: this.name, duration, failedStep: stepName },
      'Workflow execution failed'
    );
  }

  private createResult(
    results: StepResult<unknown>[],
    startTime: number
  ): WorkflowResult {
    const duration = Date.now() - startTime;
    const success = results.every((r) => r.success);
    const error = results.find((r) => !r.success)?.error;

    this.logger.info(
      { workflow: this.name, duration, success },
      'Workflow execution completed'
    );

    return {
      success,
      results,
      error,
      duration,
    };
  }

  getName(): string {
    return this.name;
  }

  getSteps(): StepDefinition[] {
    return [...this.steps];
  }
}

export interface WorkflowResult {
  success: boolean;
  results: StepResult<unknown>[];
  error?: Error;
  duration: number;
}
