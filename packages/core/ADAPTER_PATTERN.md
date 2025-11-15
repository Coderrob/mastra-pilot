# Workflow Adapter Pattern

## Overview

The workflow system now uses an **Adapter Pattern** to support multiple workflow engines (Mastra, LangGraph, etc.) while maintaining a consistent API. This makes the system provider-agnostic and allows switching between workflow engines without changing application code.

## Architecture

```
┌─────────────────┐
│  Application    │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ WorkflowFacade  │ ◄─── Unified API
└────────┬────────┘
         │
         v
┌─────────────────┐
│WorkflowProvider │ ◄─── Interface
└────────┬────────┘
         │
    ┌────┴────┐
    v         v
┌─────────┐ ┌──────────────┐
│ Mastra  │ │  LangGraph   │ ◄─── Adapters
│ Adapter │ │  Adapter     │
└─────────┘ └──────────────┘
```

## Key Components

### 1. WorkflowProvider Interface

Defines the contract that all workflow adapters must implement:

```typescript
interface WorkflowProvider {
  createStep<TIn, TOut>(config: StepConfig<TIn, TOut>): any;
  createWorkflow<TIn, TOut>(config: WorkflowConfig<TIn, TOut>): any;
  execute(workflow: any, input: any, context?: any): Promise<any>;
}
```

### 2. MastraAdapter

Wraps Mastra's workflow system with our provider interface:

```typescript
const adapter = new MastraAdapter();
const facade = new WorkflowFacade(adapter);
```

### 3. WorkflowFacade

Provides a clean, provider-agnostic API:

```typescript
const facade = new WorkflowFacade();

// Create steps
const step = facade.createStep({
  id: 'my-step',
  execute: async (input, context) => {
    // context includes logger, metadata, and custom dependencies
    return processedData;
  },
});

// Create workflow
const workflow = facade.createWorkflow({
  id: 'my-workflow',
  steps: [step],
});

// Execute with context
const result = await facade.execute(workflow, input, {
  logger: pino(),
  metadata: { source: 'api' },
});
```

## Dependency Injection

The adapter pattern supports dependency injection through the execution context:

```typescript
await facade.execute(workflow, input, {
  logger: customLogger,
  database: dbConnection,
  cache: cacheClient,
  // Any custom dependencies
});
```

Inside steps, access dependencies:

```typescript
createStep({
  id: 'step-with-deps',
  execute: async (input, context) => {
    const { logger, database, cache } = context;
    // Use injected dependencies
  },
});
```

## Usage Examples

### Basic Usage

```typescript
import { WorkflowFacade, MastraAdapter } from '@repo/core';

const facade = new WorkflowFacade(new MastraAdapter());

const step = facade.createStep({
  id: 'process',
  execute: async (input, context) => {
    context.logger.info('Processing...');
    return { result: 'processed' };
  },
});

const workflow = facade.createWorkflow({
  id: 'simple-workflow',
  steps: [step],
});

const result = await facade.execute(workflow, { data: 'test' });
```

### With Dependency Injection

```typescript
const result = await facade.execute(
  workflow,
  { data: 'test' },
  {
    logger: pino({ level: 'debug' }),
    database: db,
    apiClient: client,
  }
);
```

### Provider-Agnostic

```typescript
function createWorkflow(providerType: 'mastra' | 'langgraph') {
  const adapter = providerType === 'mastra' 
    ? new MastraAdapter() 
    : new LangGraphAdapter();
  
  return new WorkflowFacade(adapter);
}
```

## Migration from Legacy System

The legacy system (BaseStep, Workflow, Runner) is still available for backward compatibility:

```typescript
// Legacy (still works)
import { BaseStep, Workflow, Runner } from '@repo/core';

// New adapter-based (recommended)
import { WorkflowFacade, MastraAdapter } from '@repo/core';
```

## Benefits

1. **Provider Agnostic**: Switch between Mastra, LangGraph, or custom engines
2. **Dependency Injection**: Pass logger, database, or any dependencies through context
3. **Type Safety**: Full TypeScript support with generics
4. **Testability**: Easy to mock adapters for testing
5. **Backward Compatible**: Legacy system still works
6. **Clean API**: Consistent interface regardless of underlying engine

## RunnerAdapter

The `RunnerAdapter` provides execution orchestration for workflows using the adapter pattern:

```typescript
import { RunnerAdapter, MastraAdapter } from '@repo/core';

const runner = new RunnerAdapter({
  logger: pino(),
  provider: new MastraAdapter(), // Or any WorkflowProvider
});

// Register workflows
runner.registerWorkflow(workflow1, 'workflow-1');
runner.registerWorkflow(workflow2, 'workflow-2');

// Execute single workflow
const result = await runner.runWorkflow('workflow-1', input, context);

// Execute multiple workflows sequentially
const results = await runner.runWorkflowsSequential([
  { id: 'workflow-1', input: data1 },
  { id: 'workflow-2', input: data2 },
]);

// Execute multiple workflows in parallel
const results = await runner.runWorkflowsParallel([
  { id: 'workflow-1', input: data1 },
  { id: 'workflow-2', input: data2 },
]);
```

### Benefits of RunnerAdapter

1. **Provider Abstraction**: Works with any WorkflowProvider
2. **Strategy Pattern**: Sequential or parallel execution
3. **Backward Compatible**: Works with legacy workflows
4. **Context Injection**: Pass custom dependencies through execution context
5. **Unified API**: Same interface for all workflow types

### Migration to RunnerAdapter

```typescript
// Before (legacy Runner)
import { Runner } from '@repo/core';
const runner = new Runner({ logger });
runner.registerWorkflow(workflow);
await runner.runWorkflow('workflow-name', input);

// After (RunnerAdapter with Mastra)
import { RunnerAdapter, MastraAdapter } from '@repo/core';
const runner = new RunnerAdapter({ logger, provider: new MastraAdapter() });
runner.registerWorkflow(workflow, 'workflow-name');
await runner.runWorkflow('workflow-name', input);
```

## Future Enhancements

- Add LangGraphAdapter for LangChain workflows
- Add CustomAdapter for proprietary workflow engines
- Add adapters for AWS Step Functions, Temporal, etc.
- Support for hybrid workflows (mixing providers)
- Workflow composition and chaining
- Distributed execution support
