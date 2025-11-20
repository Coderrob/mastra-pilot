import { z } from "zod";
import { BaseStep, IStepContext, StepResult } from "@repo/core";
import { FileUtils } from "@repo/utils";

export const FileReadInputSchema = z.object({
  path: z.string().min(1, "Path is required"),
  from: z.number().int().min(1).optional().default(1),
  to: z.number().int().optional().default(-1),
  baseDir: z.string().optional().default(process.cwd()),
});

export type FileReadInput = z.infer<typeof FileReadInputSchema>;

export interface FileReadOutput {
  content: string;
  lines?: string[];
  path: string;
}

/**
 * FileReadStep reads file content with optional line range
 * Implements secure I/O with path validation
 */
export class FileReadStep extends BaseStep<FileReadInput, FileReadOutput> {
  constructor() {
    super("FileReadStep");
  }

  protected async run(
    input: FileReadInput,
    _context: IStepContext
  ): Promise<StepResult<FileReadOutput>> {
    try {
      return await this.executeFileRead(input);
    } catch (error) {
      return this.createErrorFromException(error);
    }
  }

  private async executeFileRead(
    input: FileReadInput
  ): Promise<StepResult<FileReadOutput>> {
    const { path, baseDir } = input;

    const exists = await FileUtils.existsSafe(path, baseDir);
    if (!exists) {
      return this.createErrorResult(`File not found: ${path}`);
    }

    return this.readFileContent(input);
  }

  private createErrorFromException(error: unknown): StepResult<FileReadOutput> {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  private async readFileContent(
    input: FileReadInput
  ): Promise<StepResult<FileReadOutput>> {
    const { from, to } = input;
    const hasRange = from !== 1 || to !== -1;

    return hasRange ? this.readFileByRange(input) : this.readFullFile(input);
  }

  private async readFileByRange(
    input: FileReadInput
  ): Promise<StepResult<FileReadOutput>> {
    const { path, from, to, baseDir } = input;
    const lines = await FileUtils.readFileLines(path, from, to, baseDir);
    const content = lines.join("\n");

    return {
      success: true,
      data: {
        content,
        lines,
        path,
      },
    };
  }

  private async readFullFile(
    input: FileReadInput
  ): Promise<StepResult<FileReadOutput>> {
    const { path, baseDir } = input;
    const content = await FileUtils.readFileSafe(path, baseDir);

    return {
      success: true,
      data: {
        content,
        path,
      },
    };
  }

  private createErrorResult(message: string): StepResult<FileReadOutput> {
    return {
      success: false,
      error: new Error(message),
    };
  }

  getInputSchema() {
    return FileReadInputSchema;
  }
}
