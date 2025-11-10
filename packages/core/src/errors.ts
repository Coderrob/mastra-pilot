/**
 * Custom error definitions for workflow automation
 * Provides context-specific errors for better debugging
 */

/**
 * Base error for workflow automation errors
 */
export class WorkflowError extends Error {
  constructor(message: string, public readonly context?: Record<string, unknown>) {
    super(message);
    this.name = 'WorkflowError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when an unknown or invalid step type is requested
 */
export class UnknownStepTypeError extends WorkflowError {
  constructor(
    public readonly stepType: string,
    public readonly validTypes: ReadonlyArray<string>
  ) {
    super(`Unknown step type: ${stepType}. Valid types: ${validTypes.join(', ')}`, {
      stepType,
      validTypes,
    });
    this.name = 'UnknownStepTypeError';
  }
}

/**
 * Error thrown when step validation fails
 */
export class StepValidationError extends WorkflowError {
  constructor(
    message: string,
    public readonly stepId: string,
    public readonly validationErrors?: unknown
  ) {
    super(message, { stepId, validationErrors });
    this.name = 'StepValidationError';
  }
}

/**
 * Error thrown when workflow validation fails
 */
export class WorkflowValidationError extends WorkflowError {
  constructor(
    message: string,
    public readonly workflowId: string,
    public readonly validationErrors?: unknown
  ) {
    super(message, { workflowId, validationErrors });
    this.name = 'WorkflowValidationError';
  }
}

/**
 * Error thrown when workflow execution fails
 */
export class WorkflowExecutionError extends WorkflowError {
  constructor(
    message: string,
    public readonly workflowId: string,
    public readonly cause?: Error
  ) {
    super(message, { workflowId, cause: cause?.message });
    this.name = 'WorkflowExecutionError';
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

/**
 * Error thrown when step execution fails
 */
export class StepExecutionError extends WorkflowError {
  constructor(
    message: string,
    public readonly stepId: string,
    public readonly cause?: Error
  ) {
    super(message, { stepId, cause: cause?.message });
    this.name = 'StepExecutionError';
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigurationError extends WorkflowError {
  constructor(
    message: string,
    public readonly configKey?: string
  ) {
    super(message, { configKey });
    this.name = 'ConfigurationError';
  }
}

/**
 * Error thrown when input parsing fails
 */
export class InputParseError extends WorkflowError {
  constructor(
    message: string,
    public readonly source: string,
    public readonly cause?: Error
  ) {
    super(message, { source, cause: cause?.message });
    this.name = 'InputParseError';
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}
