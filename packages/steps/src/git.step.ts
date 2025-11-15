import { BaseStep, IStepContext, StepResult } from '@repo/core';
import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import { z } from 'zod';

export const GitInputSchema = z.object({
  action: z.enum(['clone', 'pull', 'commit', 'push', 'status', 'add', 'init']),
  repoPath: z.string().optional(),
  message: z.string().optional(),
  files: z.array(z.string()).optional(),
  remote: z.string().optional().default('origin'),
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
    super('GitStep');
  }

  protected async run(
    input: GitInput,
    _context: IStepContext
  ): Promise<StepResult<GitOutput>> {
    try {
      const { action, repoPath, message, files, remote, branch, url } = input;

      const options: Partial<SimpleGitOptions> = {
        baseDir: repoPath || process.cwd(),
        binary: 'git',
        maxConcurrentProcesses: 6,
      };

      const git: SimpleGit = simpleGit(options);

      _context.logger.debug({ action, repoPath }, 'Executing git operation');

      let result: any;

      switch (action) {
        case 'init':
          result = await git.init();
          break;

        case 'clone':
          if (!url) {
            throw new Error('URL is required for clone action');
          }
          if (repoPath) {
            result = await git.clone(url, repoPath);
          } else {
            result = await git.clone(url);
          }
          break;

        case 'pull':
          result = await git.pull(remote, branch);
          break;

        case 'add':
          if (!files || files.length === 0) {
            throw new Error('Files are required for add action');
          }
          result = await git.add(files);
          break;

        case 'commit':
          if (!message) {
            throw new Error('Message is required for commit action');
          }
          result = await git.commit(message);
          break;

        case 'push':
          result = await git.push(remote, branch);
          break;

        case 'status':
          result = await git.status();
          break;

        default:
          throw new Error(`Unknown git action: ${action}`);
      }

      return {
        success: true,
        data: {
          action,
          result,
          message: `Git ${action} completed successfully`,
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
