# Mastra Pilot

A TypeScript monorepo for workflow automation built with pnpm workspaces.

## Architecture

Mastra Pilot is organized as a monorepo with the following packages:

- **@repo/core** - Core abstractions (BaseStep, Workflow, Runner) with Zod validation and Mastra integration
- **@repo/steps** - Concrete step implementations (FileReadStep, CsvWriteStep, HttpStep, ShellStep, GitStep)
- **@repo/workflows** - Pre-built workflows (DevAuto: dependencies → test → commit → push)
- **@repo/cli** - Command-line interface using Commander
- **@repo/utils** - Shared utilities (fs-extra, csv-stringify, zod helpers)

## Design Patterns

- **Command Pattern**: BaseStep encapsulates operations as objects
- **Factory Pattern**: Step creation and configuration
- **Strategy Pattern**: Runner supports different execution strategies (parallel/sequential)
- **Composite Pattern**: Workflow composes multiple steps

## Features

- 🔒 **Secure I/O**: Path validation and sandboxed shell execution
- 📊 **Observability**: Pino logger integration with structured logging
- ✅ **Type Safety**: Full TypeScript with Zod schema validation
- 🧪 **Testing**: Vitest with it.each for parameterized tests
- 🚀 **CI/CD**: Turbo for build orchestration, Changesets for versioning

## Installation

```bash
pnpm install
```

## Build

```bash
pnpm build
```

## Test

```bash
pnpm test
```

## Usage

### CLI

```bash
# Execute a step
pnpm --filter @repo/cli run mastra step file-read -i '{"path":"README.md"}'

# Execute a workflow
pnpm --filter @repo/cli run mastra workflow dev-auto

# Run multiple workflows
pnpm --filter @repo/cli run mastra run -w dev-auto -p
```

### Programmatic

```typescript
import { Runner } from '@repo/core';
import { createDevAutoWorkflow } from '@repo/workflows';

const runner = new Runner();
const workflow = createDevAutoWorkflow();

runner.registerWorkflow(workflow);
const result = await runner.runWorkflow('DevAutoWorkflow');
```

## Package Scripts

- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm lint` - Run linters
- `pnpm clean` - Clean build artifacts
- `pnpm changeset` - Create a changeset
- `pnpm version-packages` - Version packages
- `pnpm release` - Build and publish packages

## Requirements

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## License

MIT