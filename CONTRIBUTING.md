# Contributing to Mastra Pilot

Thank you for your interest in contributing to Mastra Pilot! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Setup

1. Clone the repository:

```bash
git clone https://github.com/Coderrob/mastra-pilot.git
cd mastra-pilot
```

1. Install dependencies:

```bash
pnpm install
```

1. Build all packages:

```bash
pnpm build
```

1. Run tests:

```bash
pnpm test
```

## Project Structure

```text
mastra-pilot/
├── packages/
│   ├── core/           # Core abstractions
│   ├── steps/          # Step implementations
│   ├── utils/          # Shared utilities
│   ├── workflows/      # Pre-built workflows
│   └── cli/            # Command-line interface
├── docs/               # Documentation
└── .github/            # CI/CD configuration
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Follow TypeScript best practices
- Write tests for new functionality
- Update documentation as needed
- Follow existing code style

### 3. Run Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @repo/core test

# Run tests in watch mode
pnpm --filter @repo/core test:watch
```

### 4. Build

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @repo/core build
```

### 5. Lint

```bash
pnpm lint
```

### 6. Create a Changeset

If your changes affect the public API:

```bash
pnpm changeset
```

Follow the prompts to describe your changes.

### 7. Commit Changes

```bash
git add .
git commit -m "feat: your feature description"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build or tooling changes

### 8. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Create a Pull Request on GitHub.

## Adding New Steps

### 1. Create Step Class

```typescript
import { BaseStep, StepContext, StepResult } from "@repo/core";
import { z } from "zod";

export const MyStepInputSchema = z.object({
  // Define input schema
});

export type MyStepInput = z.infer<typeof MyStepInputSchema>;

export interface MyStepOutput {
  // Define output interface
}

export class MyStep extends BaseStep<MyStepInput, MyStepOutput> {
  constructor() {
    super("MyStep");
  }

  protected async run(
    input: MyStepInput,
    _context: StepContext
  ): Promise<StepResult<MyStepOutput>> {
    try {
      // Implement step logic
      return {
        success: true,
        data: {
          /* output */
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}
```

### 2. Add Tests

```typescript
import { describe, it, expect } from "vitest";
import { MyStep } from "./my-step.js";
import pino from "pino";

describe("MyStep", () => {
  const logger = pino({ level: "silent" });
  const context = { logger, metadata: {} };

  it("should execute successfully", async () => {
    const step = new MyStep();
    const result = await step.execute(
      {
        /* input */
      },
      context
    );

    expect(result.success).toBe(true);
  });

  describe.each([
    {
      input: {
        /* case 1 */
      },
      expected: {
        /* expected 1 */
      },
    },
    {
      input: {
        /* case 2 */
      },
      expected: {
        /* expected 2 */
      },
    },
  ])("parameterized tests", ({ input, expected }) => {
    it(`handles ${JSON.stringify(input)}`, async () => {
      const step = new MyStep();
      const result = await step.execute(input, context);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expected);
    });
  });
});
```

### 3. Register with Factory

```typescript
// In step-factory.ts
import { MyStep } from "./my-step.js";

export class StepFactory {
  private static readonly stepRegistry = new Map([
    // ...existing steps
    ["my-step", () => new MyStep()],
  ]);
}
```

### 4. Export from Package

```typescript
// In index.ts
export { MyStep, MyStepInput, MyStepOutput } from "./my-step.js";
```

## Adding New Workflows

### 1. Create Workflow Function

```typescript
import { Workflow, WorkflowOptions } from "@repo/core";
import { MyStep } from "@repo/steps";
import pino from "pino";

export function createMyWorkflow(options?: Partial<WorkflowOptions>): Workflow {
  const logger = options?.logger ?? pino({ level: "info" });

  const workflow = new Workflow({
    name: "MyWorkflow",
    logger,
    continueOnError: false,
    ...options,
  });

  workflow.addStep(new MyStep(), "step-1");
  // Add more steps

  return workflow;
}
```

### 2. Add Tests

```typescript
import { describe, it, expect } from "vitest";
import { createMyWorkflow } from "./my-workflow.js";
import pino from "pino";

describe("MyWorkflow", () => {
  const logger = pino({ level: "silent" });

  it("should create workflow with correct steps", () => {
    const workflow = createMyWorkflow({ logger });
    const steps = workflow.getSteps();

    expect(steps).toHaveLength(/* expected count */);
  });
});
```

## Testing Guidelines

### Unit Tests

- Test individual components in isolation
- Mock external dependencies
- Use descriptive test names
- Test both success and error cases

### Parameterized Tests

Use `it.each` for testing multiple scenarios:

```typescript
describe.each([
  { scenario: "case1", input: {}, expected: {} },
  { scenario: "case2", input: {}, expected: {} },
])("$scenario", ({ input, expected }) => {
  it("should handle the scenario", () => {
    // Test implementation
  });
});
```

### Integration Tests

- Test workflows end-to-end
- Verify step composition
- Test error handling and recovery

## Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Prefer composition over inheritance

## Documentation

- Update README.md if adding new features
- Add examples to docs/examples.md
- Update architecture docs if changing design
- Include JSDoc comments in code
- Write clear commit messages

## Security

- Validate all inputs
- Prevent path traversal attacks
- Use allowlists for shell commands
- Never commit secrets
- Report security issues privately

## Questions?

- Open an issue on GitHub
- Check existing documentation
- Review code examples in docs/

Thank you for contributing to Mastra Pilot!
