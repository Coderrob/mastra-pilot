// Legacy exports (kept for backward compatibility)
export { BaseStep, StepContext, StepResult } from './base-step.js';
export { Workflow, WorkflowOptions, WorkflowResult, StepDefinition } from './workflow.js';
export { Runner, RunnerOptions } from './runner.js';
export { LogLevel, StepType, ExitCode } from './enums.js';

// Logger interface
export { ILogger, isLogger } from './logger.js';

// Custom errors
export {
  WorkflowError,
  UnknownStepTypeError,
  StepValidationError,
  WorkflowValidationError,
  WorkflowExecutionError,
  StepExecutionError,
  ConfigurationError,
  InputParseError,
} from './errors.js';

// New provider-agnostic workflow system (with I prefix for interfaces)
export { 
  IWorkflowProvider, 
  IStepConfig, 
  IWorkflowConfig, 
  IWorkflowExecutionContext,
  IStepInstance,
  IWorkflowInstance,
  IStepExecutionContext,
  IWorkflowExecutionResult
} from './workflow-provider.js';
export { WorkflowFacade, IWorkflowExecutionResult as WorkflowExecutionResult, createStepWithLogger } from './workflow-facade.js';
export { MastraAdapter } from './adapters/mastra-adapter.js';
export { RunnerAdapter, IRunnerAdapterOptions, RunnerAdapterOptions, WorkflowInstance as RunnerWorkflowInstance } from './runner-adapter.js';

// Note: Direct Mastra integration pending API stabilization
// The MastraAdapter provides a bridge to future Mastra integration
