// Legacy exports (kept for backward compatibility)
export { BaseStep, StepContext, StepResult } from './base-step.js';
export { Workflow, WorkflowOptions, WorkflowResult, StepDefinition } from './workflow.js';
export { Runner, RunnerOptions } from './runner.js';
export { LogLevel, StepType } from './enums.js';

// New provider-agnostic workflow system
export { WorkflowProvider, StepConfig, WorkflowConfig, WorkflowExecutionContext } from './workflow-provider.js';
export { WorkflowFacade, WorkflowExecutionResult, createStepWithLogger } from './workflow-facade.js';
export { MastraAdapter } from './adapters/mastra-adapter.js';

// Re-export Mastra's core primitives
export { createStep, createWorkflow, Workflow as MastraWorkflow, Step as MastraStep } from '@mastra/core';
