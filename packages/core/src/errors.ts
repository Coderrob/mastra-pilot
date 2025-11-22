/**
 * Custom error definitions for workflow automation
 * Provides context-specific errors for better debugging
 */

/**
 * Error name enum for consistent error identification
 */
export enum ErrorName {
  CONFIGURATION_ERROR = "ConfigurationError",
  INPUT_PARSE_ERROR = "InputParseError",
  STEP_EXECUTION_ERROR = "StepExecutionError",
  STEP_VALIDATION_ERROR = "StepValidationError",
  UNKNOWN_STEP_TYPE_ERROR = "UnknownStepTypeError",
  WORKFLOW_ERROR = "WorkflowError",
  WORKFLOW_EXECUTION_ERROR = "WorkflowExecutionError",
  WORKFLOW_VALIDATION_ERROR = "WorkflowValidationError",
}

/**
 * Base error for workflow automation errors
 */
export class WorkflowError extends Error {
  /**
   * Creates a new WorkflowError
   * @param message - The error message
   * @param context - Additional context for the error
   */
  constructor(
    message: string,
    readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = ErrorName.WORKFLOW_ERROR;
    
  }
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigurationError extends WorkflowError {
  /**
   * Creates a new ConfigurationError
   * @param message - The error message
   * @param configKey - The configuration key that caused the error
   */
  constructor(
    message: string,
    readonly configKey?: string
  ) {
    super(message, { configKey });
    this.name = ErrorName.CONFIGURATION_ERROR;
  }
}

/**
 * Error thrown when input parsing fails
 */
export class InputParseError extends WorkflowError {
  /**
   * Creates a new InputParseError
   * @param message - The error message
   * @param source - The source of the input that failed to parse
   * @param cause - The underlying error that caused the parsing failure
   */
  constructor(
    message: string,
    readonly source: string,
    readonly cause?: Error
  ) {
    super(message, { cause: cause?.message, source });
    this.name = ErrorName.INPUT_PARSE_ERROR;
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

/**
 * Error thrown when step execution fails
 */
export class StepExecutionError extends WorkflowError {
  /**
   * Creates a new StepExecutionError
   * @param message - The error message
   * @param stepId - The ID of the step that failed execution
   * @param cause - The underlying error that caused the failure
   */
  constructor(
    message: string,
    readonly stepId: string,
    readonly cause?: Error
  ) {
    super(message, { cause: cause?.message, stepId });
    this.name = ErrorName.STEP_EXECUTION_ERROR;
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

/**
 * Error thrown when step validation fails
 */
export class StepValidationError extends WorkflowError {
  /**
   * Creates a new StepValidationError
   * @param message - The error message
   * @param stepId - The ID of the step that failed validation
   * @param validationErrors - Details about the validation errors
   */
  constructor(
    message: string,
    readonly stepId: string,
    readonly validationErrors?: unknown
  ) {
    super(message, { stepId, validationErrors });
    this.name = ErrorName.STEP_VALIDATION_ERROR;
  }
}

/**
 * Error thrown when an unknown or invalid step type is requested
 */
export class UnknownStepTypeError extends WorkflowError {
  /**
   * Creates a new UnknownStepTypeError
   * @param stepType - The invalid step type that was requested
   * @param validTypes - Array of valid step types
   */
  constructor(
    readonly stepType: string,
    readonly validTypes: ReadonlyArray<string>
  ) {
    super(`Unknown step type: ${stepType}. Valid types: ${validTypes.join(", ")}`, {
      stepType,
      validTypes,
    });
    this.name = ErrorName.UNKNOWN_STEP_TYPE_ERROR;
  }
}

/**
 * Error thrown when workflow execution fails
 */
export class WorkflowExecutionError extends WorkflowError {
  /**
   * Creates a new WorkflowExecutionError
   * @param message - The error message
   * @param workflowId - The ID of the workflow that failed execution
   * @param cause - The underlying error that caused the failure
   */
  constructor(
    message: string,
    readonly workflowId: string,
    readonly cause?: Error
  ) {
    super(message, { cause: cause?.message, workflowId });
    this.name = ErrorName.WORKFLOW_EXECUTION_ERROR;
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

/**
 * Error thrown when workflow validation fails
 */
export class WorkflowValidationError extends WorkflowError {
  /**
   * Creates a new WorkflowValidationError
   * @param message - The error message
   * @param workflowId - The ID of the workflow that failed validation
   * @param validationErrors - Details about the validation errors
   */
  constructor(
    message: string,
    readonly workflowId: string,
    readonly validationErrors?: unknown
  ) {
    super(message, { validationErrors, workflowId });
    this.name = ErrorName.WORKFLOW_VALIDATION_ERROR;
  }
}
