export { MastraAdapter } from "./adapters/mastra-adapter.js";
// Core exports
export { BaseStep, IStepContext, StepResult } from "./base-step.js";
export { ExitCode, LogLevel, StepType, WorkflowId } from "./enums.js";
// Custom errors with ErrorName enum
export {
  ConfigurationError,
  ErrorName,
  InputParseError,
  StepExecutionError,
  StepValidationError,
  UnknownStepTypeError,
  WorkflowError,
  WorkflowExecutionError,
  WorkflowValidationError,
} from "./errors.js";

// Logger interface
export { ILogger, isLogger } from "./logger.js";

export {
  IRunnerAdapterOptions,
  RunnerAdapter,
  WorkflowInstance as RunnerWorkflowInstance,
} from "./runner-adapter.js";

export { IRunner, IRunnerOptions, Runner } from "./runner.js";
export {
  createStepWithLogger,
  IWorkflowExecutionResult as WorkflowExecutionResult,
  WorkflowFacade,
} from "./workflow-facade.js";
// New provider-agnostic workflow system (with I prefix for interfaces)
export {
  IStepConfig,
  IStepExecutionContext,
  IStepInstance,
  IWorkflowConfig,
  IWorkflowExecutionContext,
  IWorkflowExecutionResult,
  IWorkflowInstance,
  IWorkflowProvider,
} from "./workflow-provider.js";
export { StepDefinition, Workflow, WorkflowOptions, WorkflowResult } from "./workflow.js";

// Note: Direct Mastra integration pending API stabilization
// The MastraAdapter provides a bridge to future Mastra integration
