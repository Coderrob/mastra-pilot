/**
 * Custom error definitions for workflow automation
 * Provides context-specific errors for better debugging
 */

/**
 * Error name enum for consistent error identification
 */
export enum ErrorName {
  WORKFLOW_ERROR = 'WorkflowError',
  UNKNOWN_STEP_TYPE_ERROR = 'UnknownStepTypeError',
  STEP_VALIDATION_ERROR = 'StepValidationError',
  WORKFLOW_VALIDATION_ERROR = 'WorkflowValidationError',
  WORKFLOW_EXECUTION_ERROR = 'WorkflowExecutionError',
  STEP_EXECUTION_ERROR = 'StepExecutionError',
  CONFIGURATION_ERROR = 'ConfigurationError',
  INPUT_PARSE_ERROR = 'InputParseError',
}

/**
 * Base error for workflow automation errors
 */
export class WorkflowError extends Error {
  constructor(message: string, public readonly context?: Record<string, unknown>) {
    super(message);
    this.name = ErrorName.WORKFLOW_ERROR;
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
    this.name = ErrorName.UNKNOWN_STEP_TYPE_ERROR;
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
    this.name = ErrorName.STEP_VALIDATION_ERROR;
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
    this.name = ErrorName.WORKFLOW_VALIDATION_ERROR;
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
    this.name = ErrorName.WORKFLOW_EXECUTION_ERROR;
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
    this.name = ErrorName.STEP_EXECUTION_ERROR;
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
    this.name = ErrorName.CONFIGURATION_ERROR;
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
    this.name = ErrorName.INPUT_PARSE_ERROR;
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}
