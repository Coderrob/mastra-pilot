import { z } from "zod";
import { BaseStep, IStepContext, StepResult } from "@repo/core";
import { CsvUtils, FileUtils } from "@repo/utils";
import { StepIds } from "./step-ids";

/**
 * Input schema for CSV write operations
 * Validates file path, data array, and formatting options
 */
export const CsvWriteInputSchema = z.object({
  append: z.boolean().optional().default(false),
  baseDir: z.string().optional().default(process.cwd()),
  data: z.array(z.record(z.any())),
  delimiter: z.string().optional().default(","),
  header: z.boolean().optional().default(true),
  path: z.string().min(1, "Path is required"),
});

/**
 * Type definition for CSV write step input
 */
export type CsvWriteInput = z.infer<typeof CsvWriteInputSchema>;

/**
 * Output structure for successful CSV write operations
 * Contains the file path and number of rows written
 */
export interface CsvWriteOutput {
  path: string;
  rowsWritten: number;
}

/**
 * Utility class for CSV content preparation and file operations
 * Handles CSV formatting, appending, and content merging
 */
export class CsvContentBuilder {
  /**
   * Prepares CSV content for writing, handling both new and append operations
   * @param input - The CSV write configuration
   * @returns The final CSV content string ready for writing
   */
  async buildCsvContent(input: CsvWriteInput): Promise<string> {
    const { data, delimiter, header } = input;
    const newCsvContent = CsvUtils.toCSV(data, { delimiter, header });

    if (!input.append) {
      return newCsvContent;
    }

    return this.mergeWithExistingContent(input.path, newCsvContent, input.baseDir);
  }

  /**
   * Merges new CSV content with existing file content if the file exists
   * @param filePath - Path to the CSV file
   * @param newContent - New CSV content to append
   * @param baseDirectory - Base directory for file operations
   * @returns Merged CSV content with existing content (if any)
   */
  /**
   * Concatenates existing and new content with proper line separation
   * @param existingContent - Content already in the file
   * @param newContent - New content to append
   * @returns Properly formatted concatenated content
   */
  concatenateContent(existingContent: string, newContent: string): string {
    return `${existingContent}\n${newContent}`;
  }

  /**
   * Merges new CSV content with existing file content if the file exists
   * @param filePath - Path to the CSV file
   * @param newContent - New CSV content to append
   * @param baseDirectory - Base directory for file operations
   * @returns Merged CSV content with existing content (if any)
   */
  async mergeWithExistingContent(
    filePath: string,
    newContent: string,
    baseDirectory?: string
  ): Promise<string> {
    const directory = baseDirectory ?? process.cwd();
    const fileExists = await FileUtils.existsSafe(filePath, directory);

    if (!fileExists) {
      return newContent;
    }

    const existingContent = await FileUtils.readFileSafe(filePath, directory);
    return this.concatenateContent(existingContent, newContent);
  }
}

/**
 * Step for writing data to CSV files with comprehensive formatting options
 * Supports appending to existing files, custom delimiters, and header management
 *
 * @example
 * ```typescript
 * const step = new CsvWriteStep();
 * const result = await step.execute({
 *   path: 'output.csv',
 *   data: [{ name: 'John', age: 30 }],
 *   header: true,
 *   append: false
 * });
 * ```
 */
export class CsvWriteStep extends BaseStep<CsvWriteInput, CsvWriteOutput> {
  /**
   * Creates a new CSV write step instance
   * @param contentBuilder - Builder for preparing CSV content
   * @param validator - Validator for CSV write operations
   */
  constructor(
    readonly contentBuilder: CsvContentBuilder = new CsvContentBuilder(),
    readonly validator: CsvWriteValidator = new CsvWriteValidator()
  ) {
    super(StepIds.CSV_WRITE);
  }

  /**
   * Returns the input validation schema
   * @returns Zod schema for validating input
   */
  getInputSchema() {
    return CsvWriteInputSchema;
  }

  /**
   * Executes the CSV write operation
   * @param input - CSV write configuration including path, data, and options
   * @param _context - Step execution context with logger
   * @returns Result containing file path and number of rows written, or error
   */
  protected async run(
    input: CsvWriteInput,
    _context: IStepContext
  ): Promise<StepResult<CsvWriteOutput>> {
    try {
      return await this.writeCsvFile(input);
    } catch (error) {
      return this.convertErrorToResult(error);
    }
  }

  /**
   * Converts an exception into a step result error
   * @param error - The caught exception
   * @returns Error result with properly formatted error
   */
  private convertErrorToResult(error: unknown): StepResult<CsvWriteOutput> {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
      success: false,
    };
  }

  /**
   * Creates a successful result object
   * @param filePath - Path where the CSV was written
   * @param rowCount - Number of rows written
   * @returns Success result with output data
   */
  private createSuccessResult(filePath: string, rowCount: number): StepResult<CsvWriteOutput> {
    return {
      data: {
        path: filePath,
        rowsWritten: rowCount,
      },
      success: true,
    };
  }

  /**
   * Performs the complete CSV write operation with validation
   * @param input - CSV write configuration
   * @returns Successful result with file details
   */
  private async writeCsvFile(input: CsvWriteInput): Promise<StepResult<CsvWriteOutput>> {
    this.validator.validateDataNotEmpty(input.data);

    const csvContent = await this.contentBuilder.buildCsvContent(input);
    await FileUtils.writeFileSafe(input.path, csvContent, input.baseDir);

    return this.createSuccessResult(input.path, input.data.length);
  }
}

/**
 * Validator for CSV write operations
 * Ensures data integrity before processing
 */
export class CsvWriteValidator {
  /**
   * Validates that the data array contains records to write
   * @param data - Array of records to validate
   * @throws Error if data array is empty
   */
  validateDataNotEmpty(data: unknown[]): void {
    if (data.length === 0) {
      throw new Error("No data to write - data array cannot be empty");
    }
  }
}
