import { BaseStep, IStepContext, StepResult } from '@repo/core';
import { FileUtils } from '@repo/utils';
import { z } from 'zod';

export const FileReadInputSchema = z.object({
  path: z.string().min(1, 'Path is required'),
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
    super('FileReadStep');
  }

  protected async run(
    input: FileReadInput,
    _context: IStepContext
  ): Promise<StepResult<FileReadOutput>> {
    try {
      const { path, from, to, baseDir } = input;

      // Check if file exists
      const exists = await FileUtils.existsSafe(path, baseDir);
      if (!exists) {
        return {
          success: false,
          error: new Error(`File not found: ${path}`),
        };
      }

      // Read file with line range if specified
      if (from !== 1 || to !== -1) {
        const lines = await FileUtils.readFileLines(path, from, to, baseDir);
        const content = lines.join('\n');
        
        return {
          success: true,
          data: {
            content,
            lines,
            path,
          },
        };
      }

      // Read entire file
      const content = await FileUtils.readFileSafe(path, baseDir);

      return {
        success: true,
        data: {
          content,
          path,
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
