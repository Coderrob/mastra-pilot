import { BaseStep, StepContext, StepResult } from './base-step.js';
import { Logger } from 'pino';

export type StepDefinition = {
  step: BaseStep<any, any>;
  name: string;
};

export interface WorkflowOptions {
  name: string;
  logger: Logger;
  continueOnError?: boolean;
}

/**
 * Workflow implements the Composite pattern for orchestrating multiple steps
 */
export class Workflow {
  private readonly name: string;
  private readonly steps: StepDefinition[] = [];
  private readonly logger: Logger;
  private readonly continueOnError: boolean;

  constructor(options: WorkflowOptions) {
    this.name = options.name;
    this.logger = options.logger;
    this.continueOnError = options.continueOnError ?? false;
  }

  addStep(step: BaseStep<any, any>, name?: string): this {
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

    const results: StepResult<any>[] = [];
    let currentInput = initialInput;

    const context: StepContext = {
      logger: this.logger.child({ workflow: this.name }),
      metadata,
    };

    for (const stepDef of this.steps) {
      const result = await stepDef.step.execute(currentInput, context);
      results.push(result);

      if (!result.success && !this.continueOnError) {
        const duration = Date.now() - startTime;
        this.logger.error(
          { workflow: this.name, duration, failedStep: stepDef.name },
          'Workflow execution failed'
        );

        return {
          success: false,
          results,
          error: result.error,
          duration,
        };
      }

      currentInput = result.data;
    }

    const duration = Date.now() - startTime;
    const success = results.every((r) => r.success);

    this.logger.info(
      { workflow: this.name, duration, success },
      'Workflow execution completed'
    );

    return {
      success,
      results,
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
  results: StepResult<any>[];
  error?: Error;
  duration: number;
}
