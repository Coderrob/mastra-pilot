import simpleGit, { SimpleGit, SimpleGitOptions } from "simple-git";
import { z } from "zod";
import { BaseStep, IStepContext, StepResult } from "@repo/core";
import { StepIds } from "./step-ids";

/**
 * Input schema for Git operations
 * Validates action type and associated parameters
 */
export const GitInputSchema = z.object({
  action: z.enum(["clone", "pull", "commit", "push", "status", "add", "init"]),
  branch: z.string().optional(),
  files: z.array(z.string()).optional(),
  message: z.string().optional(),
  remote: z.string().optional().default("origin"),
  repoPath: z.string().optional(),
  url: z.string().optional(),
});

/**
 * Type definition for Git step input
 */
export type GitInput = z.infer<typeof GitInputSchema>;

/**
 * Output structure for Git operations
 * Contains action name, result data, and optional message
 */
export interface GitOutput {
  action: string;
  message?: string;
  result: unknown;
}

/**
 * Executor for individual Git actions
 * Handles validation and execution of specific Git commands
 */
export class GitActionExecutor {
  /**
   * Executes Git add command with validation
   * @param git - SimpleGit instance
   * @param filePaths - Array of file paths to add
   * @returns Promise resolving to add result
   * @throws Error if files array is empty or missing
   */
  async executeAdd(git: SimpleGit, filePaths?: string[]): Promise<unknown> {
    if (!filePaths || filePaths.length === 0) {
      throw new Error("Files are required for add action");
    }
    return git.add(filePaths);
  }

  /**
   * Executes Git clone command with validation
   * @param git - SimpleGit instance
   * @param repositoryUrl - URL of repository to clone
   * @param targetPath - Optional target path for cloned repository
   * @returns Promise resolving to clone result
   * @throws Error if URL is missing
   */
  async executeClone(
    git: SimpleGit,
    repositoryUrl?: string,
    targetPath?: string
  ): Promise<unknown> {
    if (!repositoryUrl) {
      throw new Error("URL is required for clone action");
    }
    return targetPath ? git.clone(repositoryUrl, targetPath) : git.clone(repositoryUrl);
  }

  /**
   * Executes Git commit command with validation
   * @param git - SimpleGit instance
   * @param commitMessage - Commit message
   * @returns Promise resolving to commit result
   * @throws Error if message is missing
   */
  async executeCommit(git: SimpleGit, commitMessage?: string): Promise<unknown> {
    if (!commitMessage) {
      throw new Error("Message is required for commit action");
    }
    return git.commit(commitMessage);
  }

  /**
   * Executes Git init command
   * @param git - SimpleGit instance
   * @returns Promise resolving to init result
   */
  async executeInit(git: SimpleGit): Promise<unknown> {
    return git.init();
  }

  /**
   * Executes Git pull command
   * @param git - SimpleGit instance
   * @param remoteName - Name of remote to pull from
   * @param branchName - Optional branch name to pull
   * @returns Promise resolving to pull result
   */
  async executePull(git: SimpleGit, remoteName: string, branchName?: string): Promise<unknown> {
    return git.pull(remoteName, branchName);
  }

  /**
   * Executes Git push command
   * @param git - SimpleGit instance
   * @param remoteName - Name of remote to push to
   * @param branchName - Optional branch name to push
   * @returns Promise resolving to push result
   */
  async executePush(git: SimpleGit, remoteName: string, branchName?: string): Promise<unknown> {
    return git.push(remoteName, branchName);
  }

  /**
   * Executes Git status command
   * @param git - SimpleGit instance
   * @returns Promise resolving to status result
   */
  async executeStatus(git: SimpleGit): Promise<unknown> {
    return git.status();
  }
}

/**
 * Registry and dispatcher for Git action handlers
 * Maps action names to their corresponding executor methods
 */
export class GitActionRegistry {
  /**
   * Creates and returns a map of action handlers
   * @param git - SimpleGit instance for executing commands
   * @param input - Git input containing action parameters
   * @param executor - Git action executor instance
   * @returns Record mapping action names to handler functions
   */
  buildActionHandlers(
    git: SimpleGit,
    input: GitInput,
    executor: GitActionExecutor
  ): Record<string, () => Promise<unknown>> {
    const { branch, files, message, remote, repoPath, url } = input;
    return {
      /**
       * Handler for git init action
       * @returns Promise resolving to init result
       */
      init: () => executor.executeInit(git),
      /**
       * Handler for git clone action
       * @returns Promise resolving to clone result
       */
      clone: () => executor.executeClone(git, url, repoPath),
      /**
       * Handler for git pull action
       * @returns Promise resolving to pull result
       */
      pull: () => executor.executePull(git, remote, branch),
      /**
       * Handler for git add action
       * @returns Promise resolving to add result
       */
      add: () => executor.executeAdd(git, files),
      /**
       * Handler for git commit action
       * @returns Promise resolving to commit result
       */
      commit: () => executor.executeCommit(git, message),
      /**
       * Handler for git push action
       * @returns Promise resolving to push result
       */
      push: () => executor.executePush(git, remote, branch),
      /**
       * Handler for git status action
       * @returns Promise resolving to status result
       */
      status: () => executor.executeStatus(git),
    };
  }

  /**
   * Dispatches execution to the appropriate action handler
   * @param actionName - Name of the Git action to execute
   * @param handlers - Map of action handlers
   * @returns Promise resolving to action result
   * @throws Error if action is unknown
   */
  async dispatchAction(
    actionName: string,
    handlers: Record<string, () => Promise<unknown>>
  ): Promise<unknown> {
    const handler = handlers[actionName];
    if (!handler) {
      throw new Error(`Unknown git action: ${actionName}`);
    }
    return handler();
  }
}

/**
 * Factory for creating SimpleGit instances
 * Configures Git client with appropriate options
 */
export class GitInstanceFactory {
  /**
   * Creates a SimpleGit instance with configured options
   * @param repositoryPath - Optional path to Git repository (defaults to cwd)
   * @returns Configured SimpleGit instance
   */
  createGitInstance(repositoryPath?: string): SimpleGit {
    const options: Partial<SimpleGitOptions> = {
      baseDir: repositoryPath || process.cwd(),
      binary: "git",
      maxConcurrentProcesses: 6,
    };
    return simpleGit(options);
  }
}

/**
 * Step for executing Git operations using simple-git library
 * Supports clone, pull, commit, push, status, add, and init operations
 */
export class GitStep extends BaseStep<GitInput, GitOutput> {
  readonly executor: GitActionExecutor;
  readonly factory: GitInstanceFactory;
  readonly registry: GitActionRegistry;

  /**
   * Creates a new Git step instance with components
   * @param components - Optional custom components container
   */
  constructor(components: GitStepComponents = new GitStepComponents()) {
    super(StepIds.GIT);
    this.executor = components.executor;
    this.factory = components.factory;
    this.registry = components.registry;
  }

  /**
   * Executes the Git operation
   * @param input - Git operation configuration
   * @param _context - Step execution context with logger
   * @returns Result containing action name, result data, and message
   */
  protected async run(input: GitInput, _context: IStepContext): Promise<StepResult<GitOutput>> {
    try {
      return await this.executeGitOperation(input, _context);
    } catch (error) {
      return this.convertErrorToResult(error);
    }
  }

  /**
   * Builds a Git output structure from action result
   * @param actionName - Name of the executed action
   * @param actionResult - Result from the Git action
   * @returns Structured Git output
   */
  private buildOutput(actionName: string, actionResult: unknown): GitOutput {
    return {
      action: actionName,
      message: `Git ${actionName} completed successfully`,
      result: actionResult,
    };
  }

  /**
   * Converts an exception into a step result error
   * @param error - The caught exception
   * @returns Error result with properly formatted error
   */
  private convertErrorToResult(error: unknown): StepResult<GitOutput> {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
      success: false,
    };
  }

  /**
   * Creates a successful step result
   * @param output - Git operation output
   * @returns Success result with output data
   */
  private createSuccessResult(output: GitOutput): StepResult<GitOutput> {
    return {
      data: output,
      success: true,
    };
  }

  /**
   * Performs the complete Git operation with logging
   * @param input - Git operation configuration
   * @param context - Step execution context with logger
   * @returns Successful result with operation output
   */
  private async executeGitOperation(
    input: GitInput,
    context: IStepContext
  ): Promise<StepResult<GitOutput>> {
    const git = this.factory.createGitInstance(input.repoPath);

    context.logger.debug(
      { action: input.action, repoPath: input.repoPath },
      "Executing git operation"
    );

    const handlers = this.registry.buildActionHandlers(git, input, this.executor);
    const actionResult = await this.registry.dispatchAction(input.action, handlers);

    const output = this.buildOutput(input.action, actionResult);

    return this.createSuccessResult(output);
  }
}

/**
 * Step for performing Git operations
 * Provides comprehensive Git functionality using simple-git library
 *
 * @example
 * ```typescript
 * // Clone repository
 * const step = new GitStep();
 * const cloneResult = await step.execute({
 *   action: 'clone',
 *   url: 'https://github.com/user/repo.git',
 *   repoPath: '/path/to/dest'
 * });
 *
 * // Commit changes
 * const commitResult = await step.execute({
 *   action: 'commit',
 *   message: 'Add new feature',
 *   repoPath: '/path/to/repo'
 * });
 * ```
 */
/**
 * Container for Git step dependencies
 * Provides default initialization of factory, executor, and registry components
 */
export class GitStepComponents {
  readonly executor: GitActionExecutor;
  readonly factory: GitInstanceFactory;
  readonly registry: GitActionRegistry;

  /**
   * Creates components with defaults
   */
  constructor() {
    this.executor = new GitActionExecutor();
    this.factory = new GitInstanceFactory();
    this.registry = new GitActionRegistry();
  }
}
