import { Workflow, WorkflowOptions } from '@repo/core';
import { ShellStep, GitStep } from '@repo/steps';
import pino from 'pino';

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

/**
 * Execute the DevAuto workflow with default configuration
 */
export async function executeDevAuto(
  repoPath: string = process.cwd(),
  commitMessage: string = 'Automated commit',
  packageManager: 'pnpm' | 'npm' | 'yarn' = 'pnpm'
) {
  const workflow = createDevAutoWorkflow();

  const input = {
    // Step 1: Install dependencies
    command: packageManager,
    args: ['install'],
    cwd: repoPath,
  };

  const result = await workflow.execute(input, {
    repoPath,
    commitMessage,
    packageManager,
  });

  return result;
}
