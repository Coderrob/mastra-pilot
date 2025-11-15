import { BaseStep, IStepContext, StepResult } from '@repo/core';
import { FileUtils, CsvUtils } from '@repo/utils';
import { z } from 'zod';

export const CsvWriteInputSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  data: z.array(z.record(z.any())),
  baseDir: z.string().optional().default(process.cwd()),
  header: z.boolean().optional().default(true),
  delimiter: z.string().optional().default(','),
  append: z.boolean().optional().default(false),
});

export type CsvWriteInput = z.infer<typeof CsvWriteInputSchema>;

export interface CsvWriteOutput {
  path: string;
  rowsWritten: number;
}

/**
 * CsvWriteStep writes data to CSV file
 * Implements secure file writing with path validation
 */
export class CsvWriteStep extends BaseStep<CsvWriteInput, CsvWriteOutput> {
  constructor() {
    super('CsvWriteStep');
  }

  protected async run(
    input: CsvWriteInput,
    _context: IStepContext
  ): Promise<StepResult<CsvWriteOutput>> {
    try {
      const { path, data, baseDir, header, delimiter, append } = input;

      if (data.length === 0) {
        return {
          success: false,
          error: new Error('No data to write'),
        };
      }

      // Convert data to CSV
      const csvContent = CsvUtils.toCSV(data, { header, delimiter });

      // Handle append mode
      let finalContent = csvContent;
      if (append) {
        const exists = await FileUtils.existsSafe(path, baseDir);
        if (exists) {
          const existingContent = await FileUtils.readFileSafe(path, baseDir);
          finalContent = existingContent + '\n' + csvContent;
        }
      }

      // Write to file
      await FileUtils.writeFileSafe(path, finalContent, baseDir);

      return {
        success: true,
        data: {
          path,
          rowsWritten: data.length,
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
