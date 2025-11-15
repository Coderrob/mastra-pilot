import { stringify } from 'csv-stringify/sync';

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
  static toCSV(data: Record<string, any>[], options: CsvOptions = {}): string {
    const {
      header = true,
      delimiter = ',',
      quote = '"',
      columns,
    } = options;

    return stringify(data, {
      header,
      delimiter,
      quote,
      columns,
    });
  }

  /**
   * Parse CSV string to array of objects
   */
  static parseCSV(csvString: string, delimiter: string = ','): Record<string, string>[] {
    const lines = csvString.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split(delimiter).map(h => h.trim());
    const result: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter);
      const obj: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        obj[header] = values[index]?.trim() || '';
      });
      
      result.push(obj);
    }

    return result;
  }

  /**
   * Validate CSV structure
   */
  static validateCSV(data: Record<string, any>[], requiredColumns: string[]): boolean {
    if (data.length === 0) return false;

    const firstRow = data[0];
    return requiredColumns.every(col => col in firstRow);
  }
}
