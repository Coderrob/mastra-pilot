import { stringify } from "csv-stringify/sync";

/**
 * Configuration options for CSV operations
 */
export interface CsvOptions {
  columns?: string[];
  delimiter?: string;
  header?: boolean;
  quote?: string;
}

/**
 * CSV utilities for data transformation
 */
export class CsvUtils {
  /**
   * Parse CSV string to array of objects
   * @param csvString - The CSV string to parse
   * @param delimiter - The delimiter character used in the CSV (default: ",")
   * @returns Array of objects representing the parsed CSV data
   */
  static parseCSV(csvString: string, delimiter: string = ","): Record<string, string>[] {
    const lines = csvString.trim().split("\n");
    if (lines.length === 0) return [];

    const headers = lines[0].split(delimiter).map((h) => h.trim());
    return this.parseDataRows(lines, headers, delimiter);
  }

  /**
   * Parse data rows from CSV lines
   * @param lines - Array of CSV lines to parse
   * @param headers - Array of column headers
   * @param delimiter - The delimiter character used in the CSV
   * @returns Array of objects representing the parsed rows
   */
  private static parseDataRows(
    lines: string[],
    headers: string[],
    delimiter: string
  ): Record<string, string>[] {
    const result: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = this.parseRow(lines[i], headers, delimiter);
      result.push(row);
    }

    return result;
  }

  /**
   * Parse a single CSV row into an object
   * @param line - The CSV line to parse
   * @param headers - Array of column headers
   * @param delimiter - The delimiter character used in the CSV
   * @returns Object representing the parsed row
   */
  private static parseRow(
    line: string,
    headers: string[],
    delimiter: string
  ): Record<string, string> {
    const values = line.split(delimiter);
    return headers.reduce(
      (obj, header, index) => {
        obj[header] = values[index]?.trim() || "";
        return obj;
      },
      {} as Record<string, string>
    );
  }

  /**
   * Convert array of objects to CSV string
   * @param data - Array of objects to convert to CSV
   * @param options - CSV formatting options
   * @returns CSV formatted string
   */
  static toCSV(data: Record<string, unknown>[], options: CsvOptions = {}): string {
    const defaults = { delimiter: ",", header: true, quote: '"' };
    return stringify(data, { ...defaults, ...options });
  }

  /**
   * Validate CSV structure
   * @param data - Array of CSV data objects to validate
   * @param requiredColumns - Array of required column names
   * @returns True if all required columns exist in the data
   */
  static validateCSV(data: Record<string, unknown>[], requiredColumns: string[]): boolean {
    if (data.length === 0) return false;

    const firstRow = data[0];
    return requiredColumns.every((col) => col in firstRow);
  }
}
