# Mastra Pilot Examples

## Basic Step Usage

### File Read Step

```typescript
import { FileReadStep } from '@repo/steps';
import pino from 'pino';

const step = new FileReadStep();
const logger = pino({ level: 'info' });

const result = await step.execute(
  {
    path: './README.md',
    from: 1,
    to: 10,
    baseDir: process.cwd(),
  },
  { logger, metadata: {} }
);

if (result.success) {
  console.log(result.data?.content);
}
```

### CSV Write Step

```typescript
import { CsvWriteStep } from '@repo/steps';
import pino from 'pino';

const step = new CsvWriteStep();
const logger = pino({ level: 'info' });

const data = [
  { name: 'John', age: 30 },
  { name: 'Jane', age: 25 },
];

const result = await step.execute(
  {
    path: './output.csv',
    data,
    baseDir: process.cwd(),
  },
  { logger, metadata: {} }
);
```

### HTTP Step

```typescript
import { HttpStep } from '@repo/steps';
import pino from 'pino';

const step = new HttpStep();
const logger = pino({ level: 'info' });

const result = await step.execute(
  {
    url: 'https://api.github.com/repos/microsoft/typescript',
    method: 'GET',
  },
  { logger, metadata: {} }
);

if (result.success) {
  console.log(result.data?.data);
}
```

### Shell Step

```typescript
import { ShellStep } from '@repo/steps';
import pino from 'pino';

const step = new ShellStep(['ls', 'cat', 'echo']);
const logger = pino({ level: 'info' });

const result = await step.execute(
  {
    command: 'ls',
    args: ['-la'],
    cwd: process.cwd(),
  },
  { logger, metadata: {} }
);

if (result.success) {
  console.log(result.data?.stdout);
}
```

### Git Step

```typescript
import { GitStep } from '@repo/steps';
import pino from 'pino';

const step = new GitStep();
const logger = pino({ level: 'info' });

// Get status
const statusResult = await step.execute(
  {
    action: 'status',
    repoPath: process.cwd(),
  },
  { logger, metadata: {} }
);

// Commit changes
const commitResult = await step.execute(
  {
    action: 'commit',
    message: 'Update files',
    repoPath: process.cwd(),
  },
  { logger, metadata: {} }
);
```

## Workflow Usage

### Creating a Custom Workflow

```typescript
import { Workflow } from '@repo/core';
import { FileReadStep, CsvWriteStep } from '@repo/steps';
import pino from 'pino';

const logger = pino({ level: 'info' });

const workflow = new Workflow({
  name: 'DataProcessing',
  logger,
  continueOnError: false,
});

// Add steps
workflow.addStep(new FileReadStep(), 'read-input');
workflow.addStep(new CsvWriteStep(), 'write-output');

// Execute workflow
const result = await workflow.execute({
  path: './input.json',
  baseDir: process.cwd(),
});

console.log(`Workflow completed: ${result.success}`);
```

### Using the DevAuto Workflow

```typescript
import { createDevAutoWorkflow } from '@repo/workflows';

const workflow = createDevAutoWorkflow();

const result = await workflow.execute({
  command: 'pnpm',
  args: ['install'],
  cwd: process.cwd(),
});

if (result.success) {
  console.log('DevAuto workflow completed successfully!');
}
```

## Runner Usage

### Sequential Execution

```typescript
import { Runner } from '@repo/core';
import { createDevAutoWorkflow } from '@repo/workflows';

const runner = new Runner({ logLevel: 'info' });

const workflow1 = createDevAutoWorkflow();
runner.registerWorkflow(workflow1);

const results = await runner.runWorkflowsSequential([
  { name: 'DevAutoWorkflow', input: { command: 'pnpm', args: ['install'] } },
]);
```

### Parallel Execution

```typescript
import { Runner } from '@repo/core';
import { createDevAutoWorkflow } from '@repo/workflows';

const runner = new Runner({ logLevel: 'info' });

const workflow1 = createDevAutoWorkflow();
runner.registerWorkflow(workflow1);

const results = await runner.runWorkflowsParallel([
  { name: 'DevAutoWorkflow', input: { command: 'pnpm', args: ['test'] } },
  { name: 'DevAutoWorkflow', input: { command: 'pnpm', args: ['build'] } },
]);
```

## Step Factory Pattern

```typescript
import { StepFactory } from '@repo/steps';
import pino from 'pino';

const logger = pino({ level: 'info' });

// Create a step dynamically
const step = StepFactory.createStep('file-read');

const result = await step.execute(
  {
    path: './README.md',
    baseDir: process.cwd(),
  },
  { logger, metadata: {} }
);

// Register custom step
StepFactory.registerStep('custom', () => new MyCustomStep());

// Check available steps
const availableSteps = StepFactory.getStepTypes();
console.log('Available steps:', availableSteps);
```

## CLI Usage

### Execute a Step

```bash
# Read a file
mastra step file-read -i '{"path":"README.md","baseDir":"."}'

# Make HTTP request
mastra step http -i '{"url":"https://api.github.com","method":"GET"}'

# Run shell command
mastra step shell -i '{"command":"ls","args":["-la"]}'
```

### Execute a Workflow

```bash
# Run DevAuto workflow
mastra workflow dev-auto

# Run with input from file
mastra workflow dev-auto -f ./input.json
```

### Run Multiple Workflows

```bash
# Sequential execution
mastra run -w dev-auto

# Parallel execution
mastra run -w dev-auto -p
```

## Testing with Vitest

### Parameterized Tests with it.each

```typescript
import { describe, it, expect } from 'vitest';
import { FileReadStep } from '@repo/steps';
import pino from 'pino';

describe.each([
  { path: 'file1.txt', expected: 'content1' },
  { path: 'file2.txt', expected: 'content2' },
  { path: 'file3.txt', expected: 'content3' },
])('FileReadStep tests', ({ path, expected }) => {
  it(`reads ${path} successfully`, async () => {
    const step = new FileReadStep();
    const logger = pino({ level: 'silent' });
    
    const result = await step.execute(
      { path, baseDir: '.' },
      { logger, metadata: {} }
    );
    
    expect(result.success).toBe(true);
  });
});
```

## Security Best Practices

### Secure File Operations

```typescript
import { FileUtils } from '@repo/utils';

// Path validation is automatic
try {
  // This will throw if path traversal is detected
  await FileUtils.readFileSafe('../../../etc/passwd', process.cwd());
} catch (error) {
  console.error('Path traversal detected!');
}
```

### Sandboxed Shell Commands

```typescript
import { ShellStep } from '@repo/steps';

// Only allowed commands can be executed
const step = new ShellStep(['ls', 'cat', 'echo']);

// This will fail - 'rm' is not in the allowed list
const result = await step.execute(
  { command: 'rm', args: ['-rf', '/'] },
  { logger, metadata: {} }
);

// result.success will be false
// result.error will contain "Command 'rm' is not allowed"
```

## Observability with Pino

```typescript
import { Runner } from '@repo/core';
import pino from 'pino';

const logger = pino({
  level: 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    },
  },
});

const runner = new Runner({ logger });

// All steps and workflows will use this logger
// Logs are structured and include metadata
```
