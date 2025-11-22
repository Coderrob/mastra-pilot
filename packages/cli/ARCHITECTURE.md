# CLI Package Architecture

## Executive Summary

The Mastra Pilot CLI provides a command-line interface for executing workflow automation steps and workflows. This document describes the architecture, design patterns, and implementation details of the CLI package.

**Version:** 0.0.0  
**Package:** `@repo/cli`  
**Entry Point:** `dist/index.js`  
**Binary Name:** `mastra`

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [Component Descriptions](#component-descriptions)
4. [Design Patterns](#design-patterns)
5. [Data Flow](#data-flow)
6. [Extension Points](#extension-points)
7. [Dependencies](#dependencies)
8. [Quality Standards](#quality-standards)
9. [Future Considerations](#future-considerations)

## Architecture Overview

### Design Principles

The CLI architecture adheres to the following core principles:

- **Single Responsibility Principle (SRP)**: Each module has one well-defined purpose
- **Interface Segregation**: Components depend on abstractions, not concrete implementations
- **Low Cyclomatic Complexity**: All functions maintain complexity ≤ 3
- **Separation of Concerns**: Clear boundaries between command parsing, execution, and output
- **Modularity**: Small, focused files that are easy to test and maintain

### Architectural Style

The CLI follows a **layered architecture** with clear separation between:

1. **Presentation Layer**: Command-line interface and argument parsing (`index.ts`, `commands/`)
2. **Business Logic Layer**: Execution orchestration (`executors/`)
3. **Infrastructure Layer**: I/O operations, logging, output formatting (`input/`, `logger/`, `output/`, `handlers/`)
4. **Integration Layer**: Mastra framework integration (`mastra/`)

## Directory Structure

```text
packages/cli/src/
├── commands/              # Command handlers (presentation layer)
│   ├── run-command.ts     # Multiple workflow execution handler
│   ├── step-command.ts    # Individual step execution handler
│   └── workflow-command.ts # Single workflow execution handler
├── executors/             # Business logic layer
│   ├── step-executor.ts   # Step instantiation and execution
│   └── workflow-executor.ts # Workflow orchestration
├── handlers/              # Cross-cutting concerns
│   └── result-handlers.ts # Success/error handling with exit codes
├── input/                 # Input processing utilities
│   └── parse-input.ts     # JSON input parsing from CLI or file
├── logger/                # Logging infrastructure
│   └── create-logger.ts   # Pino logger factory
├── mastra/                # Framework integration
│   └── index.ts           # Mastra instance configuration
├── output/                # Output formatting infrastructure
│   ├── console-writer.ts  # Console output implementation
│   └── types.ts           # Output interfaces and types
└── index.ts               # CLI entry point and command registration
```

## Component Descriptions

### Entry Point (`index.ts`)

**Purpose:** CLI program initialization and command registration

**Responsibilities:**

- Configure Commander.js program metadata (name, description, version)
- Define available commands (`step`, `workflow`, `run`)
- Declare command options and arguments
- Route commands to appropriate handlers
- Parse command-line arguments

**Key Characteristics:**

- Minimal complexity (pure routing and configuration)
- No business logic
- Acts as the coordination point for the CLI

**Example Usage:**

```bash
mastra step file-read -i '{"path": "data.txt"}'
mastra workflow dev-auto -f input.json
mastra run -w workflow1 workflow2 --parallel
```

### Commands Layer (`commands/`)

Command handlers process user input and coordinate execution flow.

#### `step-command.ts`

**Purpose:** Execute individual workflow steps

**Capabilities:**

- Supports step types: `file-read`, `csv-write`, `http`, `shell`, `git`
- Accepts input via JSON string (`-i`) or file (`-f`)
- Creates step instances via `step-executor`
- Executes steps with provided input
- Reports results through output writer

**Flow:** Parse arguments → Parse input → Create step → Execute → Handle result

#### `workflow-command.ts`

**Purpose:** Execute single named workflows

**Capabilities:**

- Executes workflows by name (e.g., `dev-auto`)
- Accepts input via JSON string or file
- Uses workflow executor for instantiation
- Integrates with Mastra framework
- Provides execution status and results

**Flow:** Parse arguments → Parse input → Get workflow → Execute → Handle result

#### `run-command.ts`

**Purpose:** Execute multiple workflows with execution strategies

**Capabilities:**

- Run multiple workflows by name
- Support parallel (`--parallel`) or sequential execution
- Batch workflow execution through runner
- Aggregate and report results
- Handle partial failures

**Flow:** Parse arguments → Parse input → Execute workflows → Report results

### Business Logic Layer (`executors/`)

Executors contain the core business logic for instantiation and execution.

#### `step-executor.ts`

**Purpose:** Step registry and execution management

**Key Function:** `createStep(type: string): BaseStep<unknown, unknown>`

**Capabilities:**

- Maintains registry of available step types
- Factory pattern for step instantiation
- Type validation and error handling
- Returns configured step instances

**Registry Pattern:**

```typescript
const STEP_REGISTRY: Record<StepType, StepConstructor> = {
  [StepType.FILE_READ]: FileReadStep,
  [StepType.CSV_WRITE]: CsvWriteStep,
  [StepType.HTTP]: HttpStep,
  [StepType.SHELL]: ShellStep,
  [StepType.GIT]: GitStep,
};
```

#### `workflow-executor.ts`

**Purpose:** Workflow orchestration and execution

**Capabilities:**

- Workflow registry management
- Single workflow execution
- Multiple workflow execution (parallel/sequential)
- Integration with RunnerAdapter
- Result aggregation and error handling

**Execution Modes:**

- **Sequential:** Execute workflows one after another
- **Parallel:** Execute all workflows concurrently

### Infrastructure Layer

#### Input Processing (`input/parse-input.ts`)

**Purpose:** Parse and validate input data from various sources

**Function:** `parseInput(options: { input?: string; file?: string }): unknown`

**Capabilities:**

- Parse inline JSON strings (`-i`)
- Read and parse JSON files (`-f`)
- Validate JSON syntax
- Provide contextual error messages
- Handle missing or invalid input

**Error Handling:**

- Descriptive messages for parse errors
- File not found errors
- Invalid JSON format errors

#### Logging (`logger/create-logger.ts`)

**Purpose:** Create configured logger instances

**Function:** `createLogger(level: string = "info"): ILogger`

**Features:**

- Pino-based structured logging
- Configurable log levels (debug, info, warn, error)
- Returns interface for type safety
- Consistent logging format across CLI

**Log Levels:**

- `debug`: Detailed debugging information
- `info`: General informational messages (default)
- `warn`: Warning messages
- `error`: Error conditions

#### Output (`output/`)

**Purpose:** Format and display output to users

**Files:**

- `types.ts`: Interface definitions (`IOutputWriter`, `OutputLevel`, `TableRow`)
- `console-writer.ts`: Console output implementation

**ConsoleOutputWriter Capabilities:**

- Colored output using Chalk
- Multiple output levels (info, warn, error, fatal)
- Table rendering with column alignment
- Formatted data display
- ANSI color support detection

**Factory Function:** `createOutputWriter(): IOutputWriter`

#### Result Handlers (`handlers/result-handlers.ts`)

**Purpose:** Standardized success and error handling with process exit

**Functions:**

`handleSuccess(writer: IOutputWriter, message: string, data?: unknown): never`

- Logs success message
- Displays optional result data
- Exits process with code 0

`handleError(writer: IOutputWriter, message: string, error?: unknown, context?: string): never`

- Logs error with context
- Displays user-friendly error message
- Exits process with code 1
- Includes error details when available

### Integration Layer (`mastra/`)

**Purpose:** Mastra framework configuration and integration

**File:** `index.ts`

**Exports:** Configured Mastra instance

**Responsibilities:**

- Initialize Mastra framework
- Configure available steps
- Configure available workflows
- Provide framework access to executors

**Configuration:**

- Registers all CLI-accessible steps
- Registers all CLI-accessible workflows
- Sets up execution environment

## Design Patterns

### Registry Pattern

**Usage:** Step and workflow type management

**Implementation:** Maps string identifiers to constructor functions

```typescript
const STEP_REGISTRY: Record<StepType, StepConstructor> = {
  [StepType.FILE_READ]: FileReadStep,
  [StepType.CSV_WRITE]: CsvWriteStep,
  [StepType.HTTP]: HttpStep,
  [StepType.SHELL]: ShellStep,
  [StepType.GIT]: GitStep,
};
```

**Benefits:**

- Easy to add new types without modifying existing code
- Centralized type management
- Type-safe lookups with clear error messages

### Factory Pattern

**Usage:** Creating logger and output writer instances

**Implementation:**

```typescript
export function createLogger(level: string = "info"): ILogger;
export function createOutputWriter(): IOutputWriter;
```

**Benefits:**

- Encapsulates object creation logic
- Allows easy swapping of implementations
- Provides sensible defaults
- Returns interface types for loose coupling

### Adapter Pattern

**Usage:** RunnerAdapter for workflow execution abstraction

**Purpose:** Provides a consistent interface for different workflow execution strategies

**Benefits:**

- Abstracts Mastra framework details
- Enables testing without full framework
- Supports multiple execution modes (sequential/parallel)

### Command Pattern

**Usage:** Command handler structure

**Pattern Implementation:**

Each command handler follows a consistent four-phase pattern:

1. **Parse Input:** Extract and validate command-line arguments
2. **Create Dependencies:** Instantiate required services (logger, output writer)
3. **Execute Logic:** Run the core business logic
4. **Handle Results:** Process success/error and exit appropriately

**Benefits:**

- Predictable code structure
- Easy to understand and maintain
- Consistent error handling
- Clear separation of concerns

## Data Flow

### Step Execution Flow

```text
User Command
    ↓
index.ts (Commander.js)
    ↓
step-command.ts
    ↓
    ├─→ parse-input.ts (Parse input data)
    ├─→ create-logger.ts (Initialize logging)
    ├─→ console-writer.ts (Initialize output)
    ↓
step-executor.ts
    ↓
    ├─→ STEP_REGISTRY (Look up step type)
    ├─→ Step Constructor (Create instance)
    ↓
Step.execute() (from @repo/steps)
    ↓
result-handlers.ts (Success/Error)
    ↓
Process Exit (0 or 1)
```

### Workflow Execution Flow

```text
User Command
    ↓
index.ts (Commander.js)
    ↓
workflow-command.ts
    ↓
    ├─→ parse-input.ts (Parse input data)
    ├─→ create-logger.ts (Initialize logging)
    ├─→ console-writer.ts (Initialize output)
    ↓
workflow-executor.ts
    ↓
    ├─→ WORKFLOW_REGISTRY (Look up workflow)
    ├─→ Workflow Instance (Get instance)
    ↓
Workflow.execute() (from @repo/workflows)
    ↓
result-handlers.ts (Success/Error)
    ↓
Process Exit (0 or 1)
```

### Multiple Workflow Execution Flow

```text
User Command
    ↓
index.ts (Commander.js)
    ↓
run-command.ts
    ↓
    ├─→ parse-input.ts (Parse input data)
    ├─→ create-logger.ts (Initialize logging)
    ├─→ console-writer.ts (Initialize output)
    ↓
workflow-executor.ts
    ↓
    ├─→ WORKFLOW_REGISTRY (Look up workflows)
    ├─→ RunnerAdapter (Execution strategy)
    ↓
Runner.executeWorkflows() (from @repo/core)
    ↓
    ├─→ Parallel (Promise.all)
    └─→ Sequential (for...of)
    ↓
Aggregate Results
    ↓
result-handlers.ts (Success/Error)
    ↓
Process Exit (0 or 1)
```

## Complexity Management

### Cyclomatic Complexity Control

All functions maintain cyclomatic complexity ≤ 3 through:

**Techniques:**

- **Method Extraction:** Break complex functions into smaller, single-purpose functions
- **Early Returns:** Use guard clauses to reduce nesting
- **Delegation:** Move specialized logic to helper functions
- **Single Responsibility:** Each function does one thing well

**Example from `console-writer.ts`:**

```typescript
// Main method delegates to specialized formatters
formatCell(value: unknown): string {
  return this.formatCellValue(value);
}

// Dispatcher to type-specific formatters
formatCellValue(value: unknown): string {
  if (typeof value === 'string') return this.formatString(value);
  if (typeof value === 'number') return this.formatNumber(value);
  if (typeof value === 'boolean') return this.formatBoolean(value);
  return this.formatObject(value);
}

// Each formatter is simple and focused
formatString(value: string): string {
  return value.length > 50 ? value.slice(0, 47) + '...' : value;
}
```

### Maintainability Metrics

**File Size:** Each file is < 250 lines of code

**Function Length:** Each function is < 20 lines

**Cognitive Complexity:** Minimized through clear naming and simple control flow

## Testing Strategy

### Unit Testing Approach

**Current Status:** Test infrastructure in place (`vitest`)

**Testability Features:**

- Pure functions with clear inputs/outputs
- Interface-based dependencies (easy mocking)
- No global state
- Predictable behavior

**Test Coverage Goals:**

- Core executors: 100%
- Command handlers: ≥80%
- Utilities: 100%

### Integration Testing

**Scope:** End-to-end command execution

**Test Scenarios:**

- Valid command execution with various inputs
- Error handling for invalid inputs
- File input parsing
- Exit code verification
- Output format validation

### Mocking Strategy

**Mockable Components:**

- `ILogger`: Mock logging without console output
- `IOutputWriter`: Mock output for testing
- `BaseStep`: Mock step execution
- File system operations

## Extension Points

### Adding a New Command

**Steps:**

1. **Create Command Handler:**
   - Create `commands/new-command.ts`
   - Export handler function matching Commander.js signature
   - Follow existing command pattern (parse → create → execute → handle)

2. **Register Command:**
   - Add command definition in `index.ts`
   - Define arguments and options
   - Wire up action to handler function

3. **Update Documentation:**
   - Add command description to README
   - Document usage examples

**Example:**

```typescript
// commands/validate-command.ts
export async function validateConfig(
  configPath: string,
  options: { strict?: boolean }
): Promise<void> {
  const writer = createOutputWriter();
  const logger = createLogger();

  try {
    // Validation logic
    handleSuccess(writer, "Configuration valid");
  } catch (error) {
    handleError(writer, "Validation failed", error);
  }
}
```

### Adding a New Step Type

**Steps:**

1. **Implement Step Class:**
   - Create step class in `@repo/steps`
   - Extend `BaseStep<TInput, TOutput>`
   - Implement `execute()` method
   - Add comprehensive JSDoc

2. **Register Step:**
   - Add to `STEP_REGISTRY` in `step-executor.ts`
   - Define step type enum value

3. **Update Tests:**
   - Add unit tests for step logic
   - Add integration test in CLI

**Registry Update:**

```typescript
const STEP_REGISTRY: Record<StepType, StepConstructor> = {
  // ...existing steps
  [StepType.NEW_TYPE]: NewTypeStep,
};
```

### Adding a New Workflow

**Steps:**

1. **Implement Workflow:**
   - Create workflow class in `@repo/workflows`
   - Define workflow structure and steps
   - Configure step dependencies

2. **Register Workflow:**
   - Add to `WORKFLOW_REGISTRY` in `workflow-executor.ts`
   - Register in Mastra instance (`mastra/index.ts`)

3. **Documentation:**
   - Document workflow purpose and inputs
   - Add usage examples

### Adding a New Output Format

**Steps:**

1. **Implement Interface:**
   - Create new class implementing `IOutputWriter`
   - Implement all required methods (info, warn, error, fatal, table, section, data)

2. **Create Factory:**
   - Add factory function similar to `createOutputWriter()`
   - Support configuration options

3. **Update Commands:**
   - Replace output writer instantiation
   - Or make it configurable via CLI option

**Example:**

```typescript
export class JsonOutputWriter implements IOutputWriter {
  info(message: string): void {
    console.log(JSON.stringify({ level: "info", message }));
  }
  // ... implement other methods
}
```

## Dependencies

### Production Dependencies

| Dependency        | Version      | Purpose                            |
| ----------------- | ------------ | ---------------------------------- |
| `@mastra/core`    | ^0.24.1      | Mastra framework integration       |
| `@repo/core`      | workspace:\* | Core abstractions and interfaces   |
| `@repo/steps`     | workspace:\* | Step implementations               |
| `@repo/workflows` | workspace:\* | Workflow implementations           |
| `@repo/utils`     | workspace:\* | Shared utility functions           |
| `chalk`           | ^5.3.0       | Terminal styling and colors        |
| `commander`       | ^12.0.0      | CLI framework and argument parsing |
| `pino`            | ^8.19.0      | Structured logging                 |
| `zod`             | ^3.25.0      | Runtime type validation            |

### Development Dependencies

| Dependency    | Version   | Purpose                  |
| ------------- | --------- | ------------------------ |
| `@types/node` | ^20.11.19 | Node.js type definitions |
| `typescript`  | ^5.3.3    | TypeScript compiler      |
| `vitest`      | ^1.3.1    | Testing framework        |
| `mastra`      | ^0.18.1   | Mastra development tools |

### Dependency Relationships

```text
@repo/cli
    ├─→ @repo/core (abstractions)
    │       ├─→ BaseStep
    │       ├─→ ILogger
    │       ├─→ Runner
    │       └─→ RunnerAdapter
    ├─→ @repo/steps (implementations)
    │       ├─→ FileReadStep
    │       ├─→ CsvWriteStep
    │       ├─→ HttpStep
    │       ├─→ ShellStep
    │       └─→ GitStep
    ├─→ @repo/workflows (orchestration)
    │       └─→ DevAutoWorkflow
    └─→ @repo/utils (shared utilities)
```

## Quality Standards

### Code Quality Enforcement

| Standard              | Tool                 | Threshold    | Status      |
| --------------------- | -------------------- | ------------ | ----------- |
| Cyclomatic Complexity | ESLint               | ≤ 3          | ✅ Enforced |
| Code Duplication      | JSCPD                | < 2%         | ✅ Enforced |
| JSDoc Coverage        | eslint-plugin-jsdoc  | 100%         | ✅ Enforced |
| Import Sorting        | eslint-plugin-import | Alphabetical | ✅ Enforced |
| Type Safety           | TypeScript           | Strict mode  | ✅ Enforced |
| Test Coverage         | Vitest               | ≥ 80%        | 🎯 Target   |

### Linting Rules

**Complexity:**

- `complexity: ["error", { max: 3 }]`
- Enforces low cyclomatic complexity

**Documentation:**

- `jsdoc/require-jsdoc`: All functions must have JSDoc
- `jsdoc/require-description`: Descriptions required
- `jsdoc/require-param`: Parameters must be documented
- `jsdoc/require-returns`: Return values must be documented

**Code Style:**

- Prettier integration for consistent formatting
- 2-space indentation
- 100 character line width
- Unix line endings (LF)

### Build Process

**Compilation:**

```bash
pnpm build  # TypeScript compilation to dist/
```

**Output:**

- Compiled JavaScript in `dist/`
- Type declarations (`.d.ts`) for IDE support
- Source maps for debugging

**Entry Points:**

- Binary: `dist/index.js` (executable via `mastra` command)
- Main: `dist/index.js` (for programmatic use)
- Types: `dist/index.d.ts`

### Continuous Integration

**Pre-commit Checks:**

- Linting (ESLint)
- Type checking (TypeScript)
- Formatting (Prettier)

**CI Pipeline:**

- Build verification
- Test execution
- Coverage reporting
- Complexity analysis
- Duplication detection

## Future Considerations

### Planned Enhancements

**Configuration File Support:**

- Support for `.mastrarc` configuration files
- Project-level settings
- Default input values
- Custom step/workflow paths

**Interactive Mode:**

- Prompts for missing arguments
- Step-by-step workflow configuration
- Validation with feedback

**Plugin System:**

- Third-party step registration
- Custom command plugins
- Output format plugins

**Enhanced Reporting:**

- Execution metrics (duration, resource usage)
- Detailed error stack traces
- Workflow visualization
- JSON/XML output formats

**Performance Optimizations:**

- Lazy loading of step implementations
- Parallel step execution within workflows
- Caching of workflow definitions

### Scalability Considerations

**Large Workflow Support:**

- Streaming execution for large datasets
- Progress indicators for long-running workflows
- Checkpoint/resume capabilities

**Multi-tenant Usage:**

- Workspace isolation
- User-specific configurations
- Concurrent execution safety

**Cloud Integration:**

- Remote workflow execution
- Distributed step execution
- Cloud storage integration

### Maintainability Roadmap

**Documentation:**

- Auto-generate CLI reference from code
- Interactive examples and tutorials
- Troubleshooting guide

**Developer Experience:**

- Hot reload during development
- Better error messages with suggestions
- Debug mode with detailed logging

**Monitoring:**

- Telemetry for usage patterns
- Error tracking and reporting
- Performance metrics collection

---

## Appendix

### Glossary

**Step:** A single unit of work in a workflow (e.g., read file, make HTTP request)

**Workflow:** A sequence of steps with defined inputs and outputs

**Runner:** Orchestrates workflow execution with support for different strategies

**Adapter:** Abstraction layer between CLI and execution framework

**Registry:** Map of identifiers to implementations (steps, workflows)

### Related Documentation

- [Repository Root Architecture](../../docs/architecture.md)
- [Core Package Documentation](../core/README.md)
- [Coding Conventions](../../docs/coding-conventions.md)
- [Style Enforcement](../../docs/style-enforcement.md)

### Version History

| Version | Date       | Changes                            |
| ------- | ---------- | ---------------------------------- |
| 0.0.0   | 2025-11-22 | Initial architecture documentation |

---

**Document Status:** ✅ Complete and Current

**Last Updated:** November 22, 2025

**Maintained By:** Robert Lindley ([@Coderrob](https://github.com/Coderrob))
