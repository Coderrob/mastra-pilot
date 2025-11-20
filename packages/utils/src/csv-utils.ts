import { stringify } from "csv-stringify/sync";

export interface CsvOptions {
  header?: boolean;
  delimiter?: string;
  quote?: string;
  columns?: string[];
}

/**
 * CSV utilities for data transformation
 */
export class CsvUtils {
  /**
   * Convert array of objects to CSV string
   */
  static toCSV(data: Record<string, unknown>[], options: CsvOptions = {}): string {
    const defaults = { header: true, delimiter: ",", quote: '"' };
    return stringify(data, { ...defaults, ...options });
  }

  /**
   * Parse CSV string to array of objects
   */
  static parseCSV(csvString: string, delimiter: string = ","): Record<string, string>[] {
    const lines = csvString.trim().split("\n");
    if (lines.length === 0) return [];

    const headers = lines[0].split(delimiter).map((h) => h.trim());
    return this.parseDataRows(lines, headers, delimiter);
  }

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
   * Validate CSV structure
   */
  static validateCSV(data: Record<string, unknown>[], requiredColumns: string[]): boolean {
    if (data.length === 0) return false;

    const firstRow = data[0];
    return requiredColumns.every((col) => col in firstRow);
  }
}
