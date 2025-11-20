import pino from 'pino';
import { Workflow, WorkflowOptions } from '@repo/core';
import { GitStep, ShellStep } from '@repo/steps';

/**
 * DevAuto workflow: dependencies → test → commit → push
 * Automates the development workflow
 */
export function createDevAutoWorkflow(options?: Partial<WorkflowOptions>): Workflow {
  const logger = options?.logger ?? pino({
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  });

  const workflow = new Workflow({
    name: 'DevAutoWorkflow',
    logger,
    continueOnError: false,
    ...options,
  });

  // Step 1: Install dependencies
  const depsStep = new ShellStep(['pnpm', 'npm', 'yarn', 'node']);
  workflow.addStep(depsStep, 'install-dependencies');

  // Step 2: Run tests
  const testStep = new ShellStep(['pnpm', 'npm', 'yarn', 'node']);
  workflow.addStep(testStep, 'run-tests');

  // Step 3: Git add
  const gitAddStep = new GitStep();
  workflow.addStep(gitAddStep, 'git-add');

  // Step 4: Git commit
  const gitCommitStep = new GitStep();
  workflow.addStep(gitCommitStep, 'git-commit');

  // Step 5: Git push
  const gitPushStep = new GitStep();
  workflow.addStep(gitPushStep, 'git-push');

  return workflow;
}

type PackageManager = 'pnpm' | 'npm' | 'yarn';

interface DevAutoConfig {
  repoPath: string;
  commitMessage: string;
  packageManager: PackageManager;
}

const DEFAULT_CONFIG: DevAutoConfig = {
  repoPath: process.cwd(),
  commitMessage: 'Automated commit',
  packageManager: 'pnpm',
};

/**
 * Execute the DevAuto workflow with default configuration
 */
export async function executeDevAuto(
  repoPath?: string,
  commitMessage?: string,
  packageManager?: PackageManager
) {
  const config = mergeWithDefaults({ repoPath, commitMessage, packageManager });
  return await executeWithConfig(config);
}

function mergeWithDefaults(partial: Partial<DevAutoConfig>): DevAutoConfig {
  return { ...DEFAULT_CONFIG, ...partial };
}

async function executeWithConfig(config: DevAutoConfig) {
  const workflow = createDevAutoWorkflow();
  const input = { command: config.packageManager, args: ['install'], cwd: config.repoPath };
  const context = { ...config } as Record<string, unknown>;
  return await workflow.execute(input, context);
}
