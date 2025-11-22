import { z } from "zod";
import { BaseStep, IStepContext, StepResult } from "@repo/core";
import { FileUtils } from "@repo/utils";
import { StepIds } from "./step-ids";

/**
 * Input schema for file read operations
 * Validates file path and optional line range parameters
 */
export const FileReadInputSchema = z.object({
  baseDir: z.string().optional().default(process.cwd()),
  from: z.number().int().min(1).optional().default(1),
  path: z.string().min(1, "Path is required"),
  to: z.number().int().optional().default(-1),
});

/**
 * Type definition for file read step input
 */
export type FileReadInput = z.infer<typeof FileReadInputSchema>;

/**
 * Output structure for successful file read operations
 * Contains content, optional line array, and file path
 */
export interface FileReadOutput {
  content: string;
  lines?: string[];
  path: string;
}

/**
 * Step for reading file content with optional line range support
 * Provides secure file I/O with path validation and flexible reading strategies
 *
 * @example
 * ```typescript
 * // Read entire file
 * const step = new FileReadStep();
 * const result = await step.execute({
 *   path: 'data.txt',
 *   baseDir: '/home/user'
 * });
 *
 * // Read specific lines
 * const rangeResult = await step.execute({
 *   path: 'data.txt',
 *   from: 10,
 *   to: 20
 * });
 * ```
 */
export class FileReadStep extends BaseStep<FileReadInput, FileReadOutput> {
  /**
   * Creates a new file read step instance
   * @param validator - Validator for file read operations
   * @param strategy - Strategy for reading file content
   */
  constructor(
    readonly validator: FileReadValidator = new FileReadValidator(),
    readonly strategy: FileReadStrategy = new FileReadStrategy()
  ) {
    super(StepIds.FILE_READ);
  }

  /**
   * Returns the input validation schema
   * @returns Zod schema for validating input
   */
  getInputSchema() {
    return FileReadInputSchema;
  }

  /**
   * Executes the file read operation
   * @param input - File read configuration including path and optional range
   * @param _context - Step execution context with logger
   * @returns Result containing file content, or error if file not found
   */
  protected async run(
    input: FileReadInput,
    _context: IStepContext
  ): Promise<StepResult<FileReadOutput>> {
    try {
      return await this.readFile(input);
    } catch (error) {
      return this.convertErrorToResult(error);
    }
  }

  /**
   * Converts an exception into a step result error
   * @param error - The caught exception
   * @returns Error result with properly formatted error
   */
  private convertErrorToResult(error: unknown): StepResult<FileReadOutput> {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
      success: false,
    };
  }

  /**
   * Creates a successful result object
   * @param output - File content output
   * @returns Success result with file data
   */
  private createSuccessResult(output: FileReadOutput): StepResult<FileReadOutput> {
    return {
      data: output,
      success: true,
    };
  }

  /**
   * Executes the appropriate read strategy based on input parameters
   * @param input - File read configuration
   * @returns File content output based on range or full file strategy
   */
  private async executeReadStrategy(input: FileReadInput): Promise<FileReadOutput> {
    const { baseDir, from, path, to } = input;
    const isRangeRead = this.strategy.isRangeRead(from, to);

    if (isRangeRead) {
      return this.strategy.readLineRange(path, from, to, baseDir);
    }

    return this.strategy.readCompleteFile(path, baseDir);
  }

  /**
   * Performs the complete file read operation with validation
   * @param input - File read configuration
   * @returns Successful result with file content
   */
  private async readFile(input: FileReadInput): Promise<StepResult<FileReadOutput>> {
    await this.validator.validateFileExists(input.path, input.baseDir);

    const output = await this.executeReadStrategy(input);

    return this.createSuccessResult(output);
  }
}

/**
 * Strategy for reading file content
 * Determines whether to read full file or specific line range
 */
export class FileReadStrategy {
  /**
   * Determines if a line range read is requested
   * @param fromLine - Starting line number
   * @param toLine - Ending line number
   * @returns True if reading a specific range, false for full file
   */
  isRangeRead(fromLine: number, toLine: number): boolean {
    return fromLine !== 1 || toLine !== -1;
  }

  /**
   * Joins array of lines into a single string
   * @param lines - Array of file lines
   * @returns Joined content with newline separators
   */
  joinLines(lines: string[]): string {
    return lines.join("\n");
  }

  /**
   * Reads entire file content
   * @param filePath - Path to the file
   * @param baseDirectory - Base directory for path resolution
   * @returns File read output with complete content
   */
  async readCompleteFile(
    filePath: string,
    baseDirectory: string = process.cwd()
  ): Promise<FileReadOutput> {
    const content = await FileUtils.readFileSafe(filePath, baseDirectory);

    return {
      content,
      path: filePath,
    };
  }

  /**
   * Reads specific line range from a file
   * @param filePath - Path to the file
   * @param fromLine - Starting line number (1-indexed)
   * @param toLine - Ending line number (-1 for end of file)
   * @param baseDirectory - Base directory for path resolution
   * @returns File read output with specified lines
   */
  async readLineRange(
    filePath: string,
    fromLine: number,
    toLine: number,
    baseDirectory: string = process.cwd()
  ): Promise<FileReadOutput> {
    const lines = await FileUtils.readFileLines(filePath, fromLine, toLine, baseDirectory);
    const content = this.joinLines(lines);

    return {
      content,
      lines,
      path: filePath,
    };
  }
}

/**
 * Validator for file read operations
 * Ensures file existence and accessibility before reading
 */
export class FileReadValidator {
  /**
   * Validates that a file exists at the specified path
   * @param filePath - Path to the file
   * @param baseDirectory - Base directory for path resolution
   * @throws Error if file does not exist
   */
  async validateFileExists(filePath: string, baseDirectory: string = process.cwd()): Promise<void> {
    const exists = await FileUtils.existsSafe(filePath, baseDirectory);
    if (!exists) {
      throw new Error(`File not found: ${filePath}`);
    }
  }
}
