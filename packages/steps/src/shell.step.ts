import { execa, ExecaReturnValue } from 'execa';
import { z } from 'zod';
import { BaseStep, IStepContext, StepResult } from '@repo/core';

export const ShellInputSchema = z.object({
  command: z.string().min(1, 'Command is required'),
  args: z.array(z.string()).optional().default([]),
  cwd: z.string().optional(),
  env: z.record(z.string()).optional(),
  timeout: z.number().int().positive().optional().default(60000),
  shell: z.boolean().optional().default(false),
});

export type ShellInput = z.infer<typeof ShellInputSchema>;

export interface ShellOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  command: string;
}

/**
 * ShellStep executes shell commands with sandboxing
 * Uses execa for secure command execution
 */
export class ShellStep extends BaseStep<ShellInput, ShellOutput> {
  private readonly allowedCommands: Set<string>;

  constructor(allowedCommands?: string[]) {
    super('ShellStep');
    this.allowedCommands = new Set(
      allowedCommands ?? [
        'ls', 'cat', 'echo', 'pwd', 'mkdir', 'rm', 'cp', 'mv',
        'node', 'npm', 'pnpm', 'yarn',
        'git', 'docker', 'kubectl',
      ]
    );
  }

  protected async run(
    input: ShellInput,
    _context: IStepContext
  ): Promise<StepResult<ShellOutput>> {
    try {
      return await this.executeValidatedCommand(input, _context);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  private async executeValidatedCommand(
    input: ShellInput,
    _context: IStepContext
  ): Promise<StepResult<ShellOutput>> {
    const securityCheck = this.validateCommand(input.command);
    if (!securityCheck.valid) {
      return securityCheck.result!;
    }

    _context.logger.debug({ command: input.command, args: input.args, cwd: input.cwd }, 'Executing shell command');

    const result = await this.executeCommand(input);
    
    return {
      success: result.exitCode === 0,
      data: this.createShellOutput(result),
    };
  }

  private validateCommand(command: string): { valid: boolean; result?: StepResult<ShellOutput> } {
    if (this.allowedCommands.has(command)) {
      return { valid: true };
    }
    return {
      valid: false,
      result: {
        success: false,
        error: new Error(`Command '${command}' is not allowed`),
      },
    };
  }

  private async executeCommand(input: ShellInput): Promise<ExecaReturnValue> {
    const { command, args, cwd, env, timeout, shell } = input;
    return execa(command, args, {
      cwd,
      env,
      timeout,
      shell,
      reject: false, // Don't throw on non-zero exit
    });
  }

  private createShellOutput(result: ExecaReturnValue): ShellOutput {
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      command: result.command,
    };
  }

  /**
   * Add allowed commands
   */
  addAllowedCommand(command: string): void {
    this.allowedCommands.add(command);
  }

  /**
   * Get allowed commands
   */
  getAllowedCommands(): string[] {
    return Array.from(this.allowedCommands);
  }
}
