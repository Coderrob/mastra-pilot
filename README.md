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
- 🎯 **Code Quality**: ESLint (complexity ≤3), JSCPD (duplication <2%), 80% coverage
- 📚 **Clean Code**: Zero private methods, comprehensive JSDoc, utility class extraction
- 💪 **Hardcore Rules**: 230+ additional rules from [eslint-config-hardcore](https://github.com/EvgenyOrekhov/eslint-config-hardcore)-inspired plugins (unicorn, sonarjs, security, promise, perfectionist)
- 🔄 **Auto-Sorting**: Class members, objects, interfaces, enums, imports/exports automatically sorted with `pnpm lint:fix`

See [docs/quality-checks.md](./docs/quality-checks.md) for quality enforcement and [docs/coding-conventions.md](./docs/coding-conventions.md) for detailed coding standards.

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
import { Runner } from "@repo/core";
import { createDevAutoWorkflow } from "@repo/workflows";

const runner = new Runner();
const workflow = createDevAutoWorkflow();

runner.registerWorkflow(workflow);
const result = await runner.runWorkflow("DevAutoWorkflow");
```

## Package Scripts

### Build & Development

- `pnpm build` - Build all packages
- `pnpm dev` - Run all packages in development mode
- `pnpm clean` - Clean build artifacts

### Testing

- `pnpm test` - Run all tests
- `pnpm test:coverage` - Run tests with coverage report (80% threshold)
- `pnpm test:watch` - Run tests in watch mode

### Code Quality

- `pnpm lint` - Run ESLint on all packages
- `pnpm lint:fix` - Auto-fix ESLint issues
- `pnpm quality` - Run all quality checks (lint, coverage, complexity, duplication)
- `pnpm quality:complexity` - Check cyclomatic complexity (max: 3)
- `pnpm quality:duplication` - Check code duplication (threshold: 2%)

### CLI Commands

- `pnpm cli` - Run the Mastra CLI
- `pnpm cli:step <type> [options]` - Execute individual steps
- `pnpm cli:workflow <name> [options]` - Execute workflows
- `pnpm cli:run [options]` - Run workflows using the runner

### Release Management

- `pnpm changeset` - Create a changeset
- `pnpm version-packages` - Version packages
- `pnpm release` - Build and publish packages

## Requirements

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## License

MIT
