# CLI Architecture Documentation

## Overview

The CLI has been reorganized into a clean, modular architecture following the principles of:

- **Single Responsibility**: Each file/function does one thing well
- **Loose Coupling**: Components depend on interfaces, not implementations
- **Small Files**: Focused modules that are easy to understand and test
- **Low Complexity**: All functions maintain cyclomatic complexity ≤ 3

## Directory Structure

```
packages/cli/src/
├── commands/           # Command handlers (one per command)
│   ├── run-command.ts
│   ├── step-command.ts
│   └── workflow-command.ts
├── executors/          # Business logic for execution
│   ├── step-executor.ts
│   └── workflow-executor.ts
├── handlers/           # Result handling utilities
│   └── result-handlers.ts
├── input/              # Input parsing
│   └── parse-input.ts
├── logger/             # Logger factory
│   └── create-logger.ts
├── mastra/             # Mastra instance configuration
│   └── index.ts
├── output/             # Output formatting
│   ├── console-writer.ts
│   └── types.ts
└── index.ts            # Main entry point (orchestration only)
```

## Component Responsibilities

### Main Entry (`index.ts`)

- **Purpose**: CLI orchestration
- **Responsibilities**:
  - Configure Commander.js program
  - Define commands and their options
  - Route to appropriate command handlers
- **Complexity**: Minimal - pure routing

### Commands (`commands/`)

Each command file handles one CLI command:

- **`step-command.ts`**: Execute individual steps
- **`workflow-command.ts`**: Execute single workflows
- **`run-command.ts`**: Execute multiple workflows (parallel/sequential)

**Pattern**: Parse options → Create dependencies → Execute → Handle result

### Executors (`executors/`)

Contains business logic for executing steps and workflows:

- **`step-executor.ts`**:
  - Registry pattern for step types
  - Step instantiation
  - Step execution with context

- **`workflow-executor.ts`**:
  - Registry pattern for workflows
  - Workflow instantiation
  - Single/multiple workflow execution
  - RunnerAdapter integration

### Input (`input/`)

- **`parse-input.ts`**: JSON input parsing from string or file
  - Handles both CLI input (`-i`) and file input (`-f`)
  - Provides clear error messages with context

### Logger (`logger/`)

- **`create-logger.ts`**: Pino logger factory
  - Configurable log levels
  - Returns ILogger interface for type safety

### Output (`output/`)

- **`types.ts`**: Output interfaces and enums
  - `IOutputWriter` interface
  - `OutputLevel` enum
  - `TableRow` type

- **`console-writer.ts`**: Console output implementation
  - Colored, formatted output using chalk
  - Info, warn, error, fatal methods
  - Table rendering with proper column alignment
  - Complexity maintained through method extraction

### Handlers (`handlers/`)

- **`result-handlers.ts`**: Success/error handling
  - `handleSuccess`: Log success and exit with code 0
  - `handleError`: Log error, display message, exit with code 1

## Design Patterns

### Registry Pattern

Used in executors to map types/names to implementations:

```typescript
const STEP_REGISTRY: Record<StepType, StepConstructor> = {
  [StepType.FILE_READ]: FileReadStep,
  // ...
};
```

### Factory Pattern

Used for creating logger and output writer:

```typescript
export function createLogger(level?: string): ILogger
export function createOutputWriter(): IOutputWriter
```

### Adapter Pattern

RunnerAdapter provides abstraction for workflow execution

### Command Pattern

Each command handler follows the same pattern:

1. Parse input
2. Create dependencies
3. Execute logic
4. Handle results

## Complexity Management

All functions maintain cyclomatic complexity ≤ 3 through:

- Method extraction (single responsibility functions)
- Early returns
- Guard clauses
- Delegation to helper methods

Example in `console-writer.ts`:

- `formatCell` delegates to `formatCellValue`
- `formatCellValue` delegates to type-specific formatters
- Each formatter is a simple, focused function

## Testing Strategy

The modular structure enables easy testing:

- **Unit Tests**: Test each function independently
- **Integration Tests**: Test command handlers end-to-end
- **Mocking**: Interface-based design allows easy mocking

## Extension Points

Adding new functionality:

### New Command

1. Create `commands/new-command.ts`
2. Export command handler function
3. Register in `index.ts`

### New Step Type

1. Add step class to `@repo/steps`
2. Register in `STEP_REGISTRY` (step-executor.ts)

### New Workflow

1. Add workflow to `@repo/workflows`
2. Register in `WORKFLOW_REGISTRY` (workflow-executor.ts)

### New Output Format

1. Implement `IOutputWriter` interface
2. Create factory function
3. Swap implementation in command handlers

## Dependencies

- **Commander.js**: CLI framework
- **Chalk**: Terminal colors and styling
- **Pino**: Structured logging
- **@repo/core**: Core abstractions (BaseStep, ILogger, etc.)
- **@repo/steps**: Step implementations
- **@repo/workflows**: Workflow implementations
- **@repo/utils**: Shared utilities

## Quality Enforcement

- **Cyclomatic Complexity**: ≤ 3 (ESLint)
- **Code Duplication**: < 2% (JSCPD)
- **Test Coverage**: ≥ 80% (Vitest)
- **Import Sorting**: Enforced (eslint-plugin-import)
- **Type Safety**: Strict TypeScript mode

## Benefits of This Architecture

1. **Maintainability**: Small, focused files are easy to understand
2. **Testability**: Pure functions with clear inputs/outputs
3. **Extensibility**: New features don't require changing existing code
4. **Readability**: Clear separation of concerns
5. **Quality**: Automated checks ensure code quality standards
6. **Collaboration**: Team members can work on different modules without conflicts
