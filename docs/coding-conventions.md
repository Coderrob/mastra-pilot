# Coding Conventions

This document outlines the coding standards and conventions enforced in this project through ESLint, Prettier, and other tooling.

## Core Principles

1. **Self-Describing Code**: Write code that is immediately understandable without extensive comments
2. **No Private Methods**: Private methods are considered a code smell - extract them into utility classes
3. **Comprehensive Documentation**: Every function, class, interface, and type must have JSDoc
4. **Low Complexity**: Maximum cyclomatic complexity of 3 per function
5. **Composition Over Inheritance**: Use utility classes and composition patterns

## Clean Code Standards

### No Private Methods

Private methods indicate that a class is doing too much. Instead:

```typescript
// ❌ BAD: Private methods hidden in class
export class BadStep {
  async execute(input: Input): Promise<Output> {
    const validated = this.validateInput(input); // private
    const processed = this.processData(validated); // private
    return this.formatOutput(processed); // private
  }

  private validateInput(input: Input): ValidatedInput {
    /* ... */
  }
  private processData(data: ValidatedInput): ProcessedData {
    /* ... */
  }
  private formatOutput(data: ProcessedData): Output {
    /* ... */
  }
}

// ✅ GOOD: Extract to utility classes
export class InputValidator {
  validateInput(input: Input): ValidatedInput {
    /* ... */
  }
}

export class DataProcessor {
  processData(data: ValidatedInput): ProcessedData {
    /* ... */
  }
}

export class OutputFormatter {
  formatOutput(data: ProcessedData): Output {
    /* ... */
  }
}

export class GoodStep {
  constructor(
    readonly validator: InputValidator = new InputValidator(),
    readonly processor: DataProcessor = new DataProcessor(),
    readonly formatter: OutputFormatter = new OutputFormatter()
  ) {}

  async execute(input: Input): Promise<Output> {
    const validated = this.validator.validateInput(input);
    const processed = this.processor.processData(validated);
    return this.formatter.formatOutput(processed);
  }
}
```

### JSDoc Requirements

Every function, method, class, interface, enum, and type must have comprehensive JSDoc:

```typescript
/**
 * Validates file existence before reading
 * Ensures the file is accessible and readable
 */
export class FileReadValidator {
  /**
   * Validates that a file exists at the specified path
   * @param filePath - Path to the file
   * @param baseDirectory - Base directory for path resolution
   * @throws Error if file does not exist
   */
  async validateFileExists(filePath: string, baseDirectory: string): Promise<void> {
    // Implementation
  }
}

/**
 * Input schema for file read operations
 * Validates file path and optional line range parameters
 */
export const FileReadInputSchema = z.object({
  path: z.string().min(1, "Path is required"),
  from: z.number().int().min(1).optional().default(1),
  to: z.number().int().optional().default(-1),
});

/**
 * Output structure for successful file read operations
 * Contains content, optional line array, and file path
 */
export interface FileReadOutput {
  content: string;
  lines?: string[];
  path: string;
}
```

### Intuitive Function Naming

Function names should clearly describe what they do:

```typescript
// ❌ BAD: Unclear names
export class Processor {
  handle(data: Data): Result {
    /* ... */
  }
  doIt(input: Input): Output {
    /* ... */
  }
  process(x: unknown): unknown {
    /* ... */
  }
}

// ✅ GOOD: Self-describing names
export class HttpResponseMapper {
  isSuccessStatus(statusCode: number): boolean {
    /* ... */
  }
  mapResponseToOutput(response: AxiosResponse): HttpOutput {
    /* ... */
  }
  convertErrorToResult(error: unknown): StepResult<HttpOutput> {
    /* ... */
  }
}
```

### Small, Focused Functions

Keep complexity ≤3 by breaking functions into smaller pieces:

```typescript
// ❌ BAD: High complexity (>3)
function processRequest(request: Request): Response {
  if (!request.valid) {
    if (request.retry) {
      if (request.count < 3) {
        return retry(request);
      } else {
        return fail(request);
      }
    } else {
      return error(request);
    }
  }
  return success(request);
}

// ✅ GOOD: Low complexity (≤3)
export class RequestProcessor {
  processRequest(request: Request): Response {
    if (!request.valid) {
      return this.handleInvalidRequest(request);
    }
    return this.handleValidRequest(request);
  }

  handleInvalidRequest(request: Request): Response {
    if (!request.retry) {
      return this.createErrorResponse(request);
    }
    return this.handleRetryRequest(request);
  }

  handleRetryRequest(request: Request): Response {
    if (request.count < 3) {
      return this.retryRequest(request);
    }
    return this.failRequest(request);
  }
}
```

## Architecture Patterns

### Utility Class Pattern

Extract related functionality into cohesive utility classes:

```typescript
// Validation utilities
export class FileReadValidator {
  async validateFileExists(path: string, baseDir: string): Promise<void> {}
}

// Strategy utilities
export class FileReadStrategy {
  isRangeRead(from: number, to: number): boolean {}
  async readLineRange(path: string, from: number, to: number): Promise<Output> {}
  async readCompleteFile(path: string): Promise<Output> {}
}

// Main class using composition
export class FileReadStep extends BaseStep {
  constructor(
    readonly validator: FileReadValidator = new FileReadValidator(),
    readonly strategy: FileReadStrategy = new FileReadStrategy()
  ) {
    super("FileReadStep");
  }
}
```

### Dependency Injection

Use constructor injection for better testability:

```typescript
export class ShellStep extends BaseStep {
  constructor(
    readonly allowlist: ShellCommandAllowlist = new ShellCommandAllowlist(),
    readonly executor: ShellCommandExecutor = new ShellCommandExecutor()
  ) {
    super(StepIds.SHELL);
  }
}

// Easy to test with mocks
const mockAllowlist = new MockAllowlist();
const mockExecutor = new MockExecutor();
const step = new ShellStep(mockAllowlist, mockExecutor);
```

## Enforced Rules

### ESLint Rules

The following ESLint rules enforce these conventions:

```javascript
// Complexity
complexity: ["error", { max: 3 }]

// JSDoc Requirements
"jsdoc/require-jsdoc": "error"
"jsdoc/require-description": "error"
"jsdoc/require-param": "error"
"jsdoc/require-param-description": "error"
"jsdoc/require-returns": "error"
"jsdoc/require-returns-description": "error"

// No private methods enforcement
"@typescript-eslint/explicit-member-accessibility": "error"
```

### Quality Checks

Run these commands to verify compliance:

```bash
# Check complexity (max 3)
pnpm quality:complexity

# Check code duplication (<2%)
pnpm quality:duplication

# Run all quality checks
pnpm quality
```

## Examples

See the following files for reference implementations:

- `packages/steps/src/csv-write.step.ts` - CsvContentBuilder, CsvWriteValidator utilities
- `packages/steps/src/file-read.step.ts` - FileReadValidator, FileReadStrategy utilities
- `packages/steps/src/http.step.ts` - HttpRequestConfigBuilder, HttpResponseMapper utilities
- `packages/steps/src/shell.step.ts` - ShellCommandAllowlist, ShellCommandExecutor utilities
- `packages/steps/src/git.step.ts` - GitInstanceFactory, GitActionExecutor, GitActionRegistry utilities

Each demonstrates:

- Zero private methods
- Comprehensive JSDoc on every function
- Utility classes with single responsibilities
- Low complexity (≤3)
- Composition over inheritance
- Self-describing code
