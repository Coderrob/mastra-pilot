# Mastra Pilot Architecture

## Overview

Mastra Pilot is a TypeScript monorepo built with pnpm workspaces that provides a flexible, extensible framework for workflow automation. The architecture follows several design patterns and best practices for maintainability, testability, and security.

## Design Patterns

### 1. Command Pattern (BaseStep)

The `BaseStep` abstract class implements the Command pattern, encapsulating operations as objects.

**Benefits:**

- Encapsulation of business logic
- Uniform interface for all operations
- Easy to add new steps without modifying existing code
- Built-in validation and error handling

**Example:**

```typescript
export abstract class BaseStep<TIn, TOut> {
  async execute(input: TIn, context: StepContext): Promise<StepResult<TOut>> {
    // Validation, execution, and error handling
  }

  protected abstract run(input: TIn, context: StepContext): Promise<StepResult<TOut>>;
}
```

### 2. Factory Pattern (StepFactory)

The `StepFactory` class implements the Factory pattern for creating step instances.

**Benefits:**

- Centralized step creation
- Dynamic step registration
- Decouples step creation from usage
- Enables plugin architecture

**Example:**

```typescript
export class StepFactory {
  static createStep(type: string): BaseStep<any, any> {
    const factory = this.stepRegistry.get(type);
    return factory();
  }
}
```

### 3. Strategy Pattern (Runner)

The `Runner` class implements the Strategy pattern for different execution strategies.

**Benefits:**

- Multiple execution strategies (sequential, parallel)
- Runtime strategy selection
- Consistent interface regardless of strategy
- Easy to add new execution strategies

**Example:**

```typescript
export class Runner {
  async runWorkflowsSequential(workflows): Promise<WorkflowResult[]>;
  async runWorkflowsParallel(workflows): Promise<WorkflowResult[]>;
}
```

### 4. Composite Pattern (Workflow)

The `Workflow` class implements the Composite pattern for composing multiple steps.

**Benefits:**

- Hierarchical composition
- Steps and workflows share common interface
- Simplifies complex orchestration
- Enables workflow reuse

**Example:**

```typescript
export class Workflow {
  addStep(step: BaseStep<any, any>): this {
    this.steps.push(step);
    return this;
  }

  async execute(input): Promise<WorkflowResult> {
    // Execute all steps in sequence
  }
}
```

## Package Structure

```
mastra-pilot/
├── packages/
│   ├── core/           # Core abstractions and orchestration
│   │   ├── base-step.ts      # Command pattern implementation
│   │   ├── workflow.ts       # Composite pattern implementation
│   │   └── runner.ts         # Strategy pattern implementation
│   │
│   ├── steps/          # Concrete step implementations
│   │   ├── file-read-step.ts
│   │   ├── csv-write-step.ts
│   │   ├── http-step.ts
│   │   ├── shell-step.ts
│   │   ├── git-step.ts
│   │   └── step-factory.ts   # Factory pattern implementation
│   │
│   ├── utils/          # Shared utilities
│   │   ├── file-utils.ts     # Secure file operations
│   │   └── csv-utils.ts      # CSV transformation
│   │
│   ├── workflows/      # Pre-built workflows
│   │   └── dev-auto-workflow.ts
│   │
│   └── cli/            # Command-line interface
│       └── index.ts
│
├── docs/               # Documentation
├── .github/
│   └── workflows/
│       └── ci.yml      # CI/CD configuration
│
└── Configuration files (package.json, turbo.json, etc.)
```

## Data Flow

```
┌─────────────┐
│   CLI/User  │
└──────┬──────┘
       │
       v
┌─────────────┐
│   Runner    │ ◄─── Strategy Pattern
└──────┬──────┘
       │
       v
┌─────────────┐
│  Workflow   │ ◄─── Composite Pattern
└──────┬──────┘
       │
       v
┌─────────────┐
│  BaseStep   │ ◄─── Command Pattern
└──────┬──────┘
       │
       v
┌─────────────┐
│ Concrete    │
│ Step Impl   │
└─────────────┘
```

## Security Features

### 1. Secure File I/O

**Path Traversal Prevention:**

```typescript
static validatePath(filePath: string, baseDir: string): void {
  const resolvedPath = path.resolve(filePath);
  const resolvedBase = path.resolve(baseDir);

  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error('Path traversal detected');
  }
}
```

### 2. Sandboxed Shell Execution

**Command Allowlist:**

```typescript
export class ShellStep extends BaseStep<ShellInput, ShellOutput> {
  private readonly allowedCommands: Set<string>;

  protected async run(input: ShellInput): Promise<StepResult<ShellOutput>> {
    if (!this.allowedCommands.has(input.command)) {
      return { success: false, error: new Error("Command not allowed") };
    }
    // Execute command
  }
}
```

### 3. Input Validation

**Zod Schema Validation:**

```typescript
export const FileReadInputSchema = z.object({
  path: z.string().min(1, "Path is required"),
  from: z.number().int().min(1).optional().default(1),
  to: z.number().int().optional().default(-1),
  baseDir: z.string().optional().default(process.cwd()),
});
```

## Observability

### Structured Logging with Pino

**Context-Aware Logging:**

```typescript
export interface StepContext {
  logger: Logger;
  metadata: Record<string, unknown>;
}

async execute(input: TIn, context: StepContext): Promise<StepResult<TOut>> {
  const startTime = Date.now();
  context.logger.info({ step: this.name, input }, 'Step execution started');

  // Execute step

  const duration = Date.now() - startTime;
  context.logger.info({ step: this.name, duration }, 'Step execution completed');
}
```

**Log Levels:**

- `trace`: Detailed diagnostic information
- `debug`: Debug information for development
- `info`: General informational messages
- `warn`: Warning messages for potential issues
- `error`: Error messages for failures
- `fatal`: Fatal error messages

## Build System

### Turbo

Turbo orchestrates the build process across all packages with:

- Incremental builds
- Parallel execution
- Dependency-aware task scheduling
- Caching for faster builds

**Configuration:**

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

### pnpm Workspaces

pnpm provides:

- Efficient disk space usage via hard links
- Strict dependency isolation
- Fast installation
- Workspace protocol for internal dependencies

## Testing Strategy

### Unit Tests

- Test individual components in isolation
- Mock external dependencies
- Use Vitest for fast test execution

### Parameterized Tests

Use `it.each` for testing multiple scenarios:

```typescript
describe.each([
  { input: { value: 1 }, expected: 2 },
  { input: { value: 10 }, expected: 20 },
])("test scenarios", ({ input, expected }) => {
  it(`processes ${input.value} correctly`, async () => {
    // Test implementation
  });
});
```

### Integration Tests

- Test workflows end-to-end
- Verify step composition
- Test error handling and recovery

## Versioning with Changesets

Changesets provides:

- Semantic versioning
- Automated changelog generation
- Coordinated releases across packages
- Support for pre-releases

**Workflow:**

1. Create changeset: `pnpm changeset`
2. Version packages: `pnpm version-packages`
3. Publish: `pnpm release`

## Extensibility

### Adding New Steps

1. Extend `BaseStep<TIn, TOut>`
2. Implement `run()` method
3. Define input/output schemas with Zod
4. Register with `StepFactory`
5. Add tests

### Creating Custom Workflows

1. Create `Workflow` instance
2. Add steps with `workflow.addStep()`
3. Configure error handling
4. Register with `Runner`

### Plugin Architecture

The Factory pattern enables a plugin architecture:

```typescript
// Plugin registration
StepFactory.registerStep("custom-plugin", () => new CustomPluginStep());

// Usage
const step = StepFactory.createStep("custom-plugin");
```

## Performance Considerations

1. **Lazy Loading**: Steps are instantiated only when needed
2. **Parallel Execution**: Runner supports parallel workflow execution
3. **Streaming**: File operations support streaming for large files
4. **Caching**: Turbo caches build artifacts

## Future Enhancements

1. **Distributed Execution**: Support for distributed workflow execution
2. **Retry Logic**: Built-in retry mechanism for failed steps
3. **State Management**: Persistent state for long-running workflows
4. **WebSocket Support**: Real-time workflow monitoring
5. **GraphQL API**: Query and control workflows via GraphQL
