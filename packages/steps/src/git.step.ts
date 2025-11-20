import simpleGit, { SimpleGit, SimpleGitOptions } from "simple-git";
import { z } from "zod";
import { BaseStep, IStepContext, StepResult } from "@repo/core";

export const GitInputSchema = z.object({
  action: z.enum(["clone", "pull", "commit", "push", "status", "add", "init"]),
  repoPath: z.string().optional(),
  message: z.string().optional(),
  files: z.array(z.string()).optional(),
  remote: z.string().optional().default("origin"),
  branch: z.string().optional(),
  url: z.string().optional(),
});

export type GitInput = z.infer<typeof GitInputSchema>;

export interface GitOutput {
  action: string;
  result: any;
  message?: string;
}

/**
 * GitStep performs Git operations using simple-git
 * Implements Command pattern for git operations
 */
export class GitStep extends BaseStep<GitInput, GitOutput> {
  constructor() {
    super("GitStep");
  }

  protected async run(
    input: GitInput,
    _context: IStepContext
  ): Promise<StepResult<GitOutput>> {
    try {
      const git = this.createGitInstance(input.repoPath);
      _context.logger.debug(
        { action: input.action, repoPath: input.repoPath },
        "Executing git operation"
      );

      const result = await this.executeGitAction(git, input);

      return {
        success: true,
        data: {
          action: input.action,
          result,
          message: `Git ${input.action} completed successfully`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  private createGitInstance(repoPath?: string): SimpleGit {
    const options: Partial<SimpleGitOptions> = {
      baseDir: repoPath || process.cwd(),
      binary: "git",
      maxConcurrentProcesses: 6,
    };
    return simpleGit(options);
  }

  private async executeGitAction(
    git: SimpleGit,
    input: GitInput
  ): Promise<any> {
    const actionHandlers = this.getActionHandlers(git, input);
    const handler = actionHandlers[input.action];

    if (!handler) {
      throw new Error(`Unknown git action: ${input.action}`);
    }

    return handler();
  }

  private getActionHandlers(
    git: SimpleGit,
    input: GitInput
  ): Record<string, () => Promise<any>> {
    const { message, files, remote, branch, url, repoPath } = input;
    return {
      init: () => git.init(),
      clone: () => this.executeClone(git, url, repoPath),
      pull: () => git.pull(remote, branch),
      add: () => this.executeAdd(git, files),
      commit: () => this.executeCommit(git, message),
      push: () => git.push(remote, branch),
      status: () => git.status(),
    };
  }

  private async executeClone(
    git: SimpleGit,
    url?: string,
    repoPath?: string
  ): Promise<any> {
    if (!url) {
      throw new Error("URL is required for clone action");
    }
    return repoPath ? git.clone(url, repoPath) : git.clone(url);
  }

  private async executeAdd(git: SimpleGit, files?: string[]): Promise<any> {
    if (!files || files.length === 0) {
      throw new Error("Files are required for add action");
    }
    return git.add(files);
  }

  private async executeCommit(git: SimpleGit, message?: string): Promise<any> {
    if (!message) {
      throw new Error("Message is required for commit action");
    }
    return git.commit(message);
  }
}
