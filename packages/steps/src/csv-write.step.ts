import { z } from 'zod';
import { BaseStep, IStepContext, StepResult } from '@repo/core';
import { CsvUtils, FileUtils } from '@repo/utils';

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
      return await this.executeCsvWrite(input);
    } catch (error) {
      return this.createErrorFromException(error);
    }
  }

  private async executeCsvWrite(input: CsvWriteInput): Promise<StepResult<CsvWriteOutput>> {
    const { path, data, baseDir } = input;

    if (data.length === 0) {
      return this.createErrorResult('No data to write');
    }

    const finalContent = await this.prepareCsvContent(input);
    await FileUtils.writeFileSafe(path, finalContent, baseDir);

    return {
      success: true,
      data: {
        path,
        rowsWritten: data.length,
      },
    };
  }

  private createErrorFromException(error: unknown): StepResult<CsvWriteOutput> {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  private async prepareCsvContent(input: CsvWriteInput): Promise<string> {
    const { path, data, baseDir, header, delimiter, append } = input;
    const csvContent = CsvUtils.toCSV(data, { header, delimiter });

    if (!append) {
      return csvContent;
    }

    return this.appendToCsv(path, csvContent, baseDir);
  }

  private async appendToCsv(
    path: string,
    csvContent: string,
    baseDir?: string
  ): Promise<string> {
    const dir = baseDir ?? process.cwd();
    const exists = await FileUtils.existsSafe(path, dir);
    if (!exists) {
      return csvContent;
    }

    const existingContent = await FileUtils.readFileSafe(path, dir);
    return existingContent + '\n' + csvContent;
  }

  private createErrorResult(message: string): StepResult<CsvWriteOutput> {
    return {
      success: false,
      error: new Error(message),
    };
  }

  getInputSchema() {
    return CsvWriteInputSchema;
  }
}
