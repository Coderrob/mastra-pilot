import { execa, ExecaReturnValue } from "execa";
import { z } from "zod";
import { BaseStep, IStepContext, StepResult } from "@repo/core";
import { StepIds } from "./step-ids";

/**
 * Input schema for shell command execution
 * Validates command, arguments, and execution options
 */
export const ShellInputSchema = z.object({
  args: z.array(z.string()).optional().default([]),
  command: z.string().min(1, "Command is required"),
  cwd: z.string().optional(),
  env: z.record(z.string()).optional(),
  shell: z.boolean().optional().default(false),
  timeout: z.number().int().positive().optional().default(60_000),
});

/**
 * Type definition for shell step input
 */
export type ShellInput = z.infer<typeof ShellInputSchema>;

/**
 * Output structure for shell command execution
 * Contains stdout, stderr, exit code, and executed command
 */
export interface ShellOutput {
  command: string;
  exitCode: number;
  stderr: string;
  stdout: string;
}

/**
 * Registry and validator for allowed shell commands
 * Implements security allowlist pattern to restrict command execution
 */
export class ShellCommandAllowlist {
  readonly commands: Set<string>;

  /**
   * Creates a new command allowlist
   * @param allowedCommands - Optional array of initially allowed commands
   */
  constructor(allowedCommands?: string[]) {
    this.commands = new Set(
      allowedCommands ?? [
        "ls",
        "cat",
        "echo",
        "pwd",
        "mkdir",
        "rm",
        "cp",
        "mv",
        "node",
        "npm",
        "pnpm",
        "yarn",
        "git",
        "docker",
        "kubectl",
      ]
    );
  }

  /**
   * Adds a command to the allowlist
   * @param commandName - Command to allow
   */
  addCommand(commandName: string): void {
    this.commands.add(commandName);
  }

  /**
   * Creates an error result for disallowed commands
   * @param commandName - The disallowed command
   * @returns Error result indicating command is not allowed
   */
  createDisallowedCommandError(commandName: string): StepResult<ShellOutput> {
    return {
      error: new Error(`Command '${commandName}' is not allowed`),
      success: false,
    };
  }

  /**
   * Retrieves all allowed commands
   * @returns Array of allowed command names
   */
  getAllCommands(): string[] {
    return [...this.commands];
  }

  /**
   * Checks if a command is in the allowlist
   * @param commandName - The command to check
   * @returns True if the command is allowed, false otherwise
   */
  isCommandAllowed(commandName: string): boolean {
    return this.commands.has(commandName);
  }
}

/**
 * Executor for shell commands using execa
 * Handles command execution and output transformation
 */
export class ShellCommandExecutor {
  /**
   * Converts an exception into a step result error
   * @param error - The caught exception
   * @returns Error result with properly formatted error
   */
  convertErrorToResult(error: unknown): StepResult<ShellOutput> {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
      success: false,
    };
  }

  /**
   * Executes a shell command with specified parameters
   * @param input - Shell command input with command, args, and options
   * @returns Execa result containing stdout, stderr, and exit code
   */
  async executeCommand(input: ShellInput): Promise<ExecaReturnValue> {
    const { args, command, cwd, env, shell, timeout } = input;
    return execa(command, args, {
      cwd,
      env,
      reject: false, // Don't throw on non-zero exit
      shell,
      timeout,
    });
  }

  /**
   * Determines if command execution was successful
   * @param exitCode - Exit code from command execution
   * @returns True if exit code is 0, false otherwise
   */
  isSuccessfulExecution(exitCode: number): boolean {
    return exitCode === 0;
  }

  /**
   * Transforms execa result into shell output format
   * @param execaResult - Result from execa command execution
   * @returns Structured shell output
   */
  transformExecutionResult(execaResult: ExecaReturnValue): ShellOutput {
    return {
      command: execaResult.command,
      exitCode: execaResult.exitCode,
      stderr: execaResult.stderr,
      stdout: execaResult.stdout,
    };
  }
}

/**
 * Step for executing shell commands with security constraints
 * Provides sandboxed command execution using allowlist pattern
 *
 * @example
 * ```typescript
 * // Execute git status
 * const step = new ShellStep();
 * const result = await step.execute({
 *   command: 'git',
 *   args: ['status'],
 *   cwd: '/path/to/repo'
 * });
 *
 * // Add custom allowed command
 * step.addAllowedCommand('terraform');
 * ```
 */
export class ShellStep extends BaseStep<ShellInput, ShellOutput> {
  /**
   * Creates a new shell step instance
   * @param allowlist Command allowlist for security validation
   * @param executor Command executor for running shell commands
   */
  constructor(
    readonly allowlist: ShellCommandAllowlist = new ShellCommandAllowlist(),
    readonly executor: ShellCommandExecutor = new ShellCommandExecutor()
  ) {
    super(StepIds.SHELL);
  }

  /**
   * Alternative constructor accepting allowed commands array
   * @param allowedCommands - Array of allowed command names
   * @returns New ShellStep instance with custom allowlist
   */
  static withAllowedCommands(allowedCommands: string[]): ShellStep {
    return new ShellStep(new ShellCommandAllowlist(allowedCommands));
  }

  /**
   * Adds a command to the execution allowlist
   * @param commandName - Command to allow
   */
  addAllowedCommand(commandName: string): void {
    this.allowlist.addCommand(commandName);
  }

  /**
   * Validates and executes a shell command
   * @param input - Shell command input
   * @param context - Step execution context with logger
   * @returns Successful result with command output or validation error
   */
  async executeWithValidation(
    input: ShellInput,
    context: IStepContext
  ): Promise<StepResult<ShellOutput>> {
    if (!this.allowlist.isCommandAllowed(input.command)) {
      return this.allowlist.createDisallowedCommandError(input.command);
    }

    context.logger.debug(
      { args: input.args, command: input.command, cwd: input.cwd },
      "Executing shell command"
    );

    const execaResult = await this.executor.executeCommand(input);
    const output = this.executor.transformExecutionResult(execaResult);
    const success = this.executor.isSuccessfulExecution(execaResult.exitCode);

    return {
      data: output,
      success,
    };
  }

  /**
   * Retrieves all allowed commands
   * @returns Array of allowed command names
   */
  getAllowedCommands(): string[] {
    return this.allowlist.getAllCommands();
  }

  /**
   * Returns the input validation schema
   * @returns Zod schema for validating input
   */
  getInputSchema() {
    return ShellInputSchema;
  }

  /**
   * Executes the shell command operation
   * @param input - Shell command configuration
   * @param _context - Step execution context with logger
   * @returns Result containing stdout, stderr, and exit code
   */
  protected async run(input: ShellInput, _context: IStepContext): Promise<StepResult<ShellOutput>> {
    try {
      return await this.executeWithValidation(input, _context);
    } catch (error) {
      return this.executor.convertErrorToResult(error);
    }
  }
}
