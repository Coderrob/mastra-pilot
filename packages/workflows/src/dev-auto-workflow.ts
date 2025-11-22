import pino from "pino";
import { Workflow, WorkflowOptions } from "@repo/core";
import { GitStep, ShellStep } from "@repo/steps";

/**
 * Configuration options for the DevAuto workflow execution
 */
interface DevAutoConfig {
  commitMessage: string;
  packageManager: PackageManager;
  repoPath: string;
}

/**
 * Supported package managers for dependency installation
 */
type PackageManager = "npm" | "pnpm" | "yarn";

/**
 * DevAuto workflow: dependencies → test → commit → push
 * Automates the development workflow
 * @param options - Workflow configuration options
 * @returns The configured DevAuto workflow instance
 */
export function createDevAutoWorkflow(options?: Partial<WorkflowOptions>): Workflow {
  const logger =
    options?.logger ??
    pino({
      level: "info",
      transport: {
        options: {
          colorize: true,
        },
        target: "pino-pretty",
      },
    });

  const workflow = new Workflow({
    continueOnError: false,
    logger,
    name: "DevAutoWorkflow",
    ...options,
  });

  // Step 1: Install dependencies
  const depsStep = ShellStep.withAllowedCommands(["pnpm", "npm", "yarn", "node"]);
  workflow.addStep(depsStep, "install-dependencies");

  // Step 2: Run tests
  const testStep = ShellStep.withAllowedCommands(["pnpm", "npm", "yarn", "node"]);
  workflow.addStep(testStep, "run-tests");

  // Step 3: Git add
  const gitAddStep = new GitStep();
  workflow.addStep(gitAddStep, "git-add");

  // Step 4: Git commit
  const gitCommitStep = new GitStep();
  workflow.addStep(gitCommitStep, "git-commit");

  // Step 5: Git push
  const gitPushStep = new GitStep();
  workflow.addStep(gitPushStep, "git-push");

  return workflow;
}

const DEFAULT_CONFIG: DevAutoConfig = {
  commitMessage: "Automated commit",
  packageManager: "pnpm",
  repoPath: process.cwd(),
};

/**
 * Execute the DevAuto workflow with default configuration
 * @param repoPath - The repository path to execute the workflow in
 * @param commitMessage - The commit message to use
 * @param packageManager - The package manager to use for installing dependencies
 * @returns A promise that resolves when the workflow execution completes
 */
export async function executeDevAuto(
  repoPath?: string,
  commitMessage?: string,
  packageManager?: PackageManager
) {
  const config = mergeWithDefaults({ commitMessage, packageManager, repoPath });
  return await executeWithConfig(config);
}

/**
 * Executes the DevAuto workflow with the provided configuration
 * @param config - The complete configuration for workflow execution
 * @returns A promise that resolves with the workflow execution result
 */
async function executeWithConfig(config: DevAutoConfig) {
  const workflow = createDevAutoWorkflow();
  const input = { args: ["install"], command: config.packageManager, cwd: config.repoPath };
  const context = { ...config } as Record<string, unknown>;
  return await workflow.execute(input, context);
}

/**
 * Merges partial configuration with default values
 * @param partial - Partial configuration to merge with defaults
 * @returns The complete configuration with defaults applied
 */
function mergeWithDefaults(partial: Partial<DevAutoConfig>): DevAutoConfig {
  return { ...DEFAULT_CONFIG, ...partial };
}
