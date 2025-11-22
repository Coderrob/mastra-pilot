import chalk from "chalk";
import { isBoolean, isNullOrUndefined, isNumber } from "@repo/utils";
import { IOutputWriter, OutputLevel, TableRow } from "./types.js";

/**
 * Console output writer that formats messages with colors and icons
 */
export class ConsoleOutputWriter implements IOutputWriter {
  private readonly iconMap = {
    [OutputLevel.ERROR]: chalk.red("✗"),
    [OutputLevel.FATAL]: chalk.red("✗✗"),
    [OutputLevel.INFO]: chalk.green("✓"),
    [OutputLevel.WARN]: chalk.yellow("⚠"),
  };

  /**
   * Writes an error message to console
   * @param message The error message to display
   * @param data Optional data to display
   */
  error(message: string, data?: unknown): void {
    this.writeOutput(OutputLevel.ERROR, message, data);
  }

  /**
   * Writes a fatal error message and exits the process
   * @param message The fatal error message to display
   * @param data Optional data to display
   */
  fatal(message: string, data?: unknown): never {
    this.writeOutput(OutputLevel.FATAL, message, data);
    process.exit(1);
  }

  /**
   * Writes an info-level message to console
   * @param message The info message to display
   * @param data Optional data to display
   */
  info(message: string, data?: unknown): void {
    this.writeOutput(OutputLevel.INFO, message, data);
  }

  /**
   * Displays data as a formatted table in the console
   * @param rows Array of table rows to display
   */
  table(rows: TableRow[]): void {
    if (rows.length === 0) {
      this.warn("No data to display");
      return;
    }

    const headers = Object.keys(rows[0]);
    const colWidths = this.calculateColumnWidths(headers, rows);

    this.printTableHeader(headers, colWidths);
    this.printTableSeparator(colWidths);
    this.printTableRows(rows, headers, colWidths);
  }

  /**
   * Writes a warning message to console
   * @param message The warning message to display
   * @param data Optional data to display
   */
  warn(message: string, data?: unknown): void {
    this.writeOutput(OutputLevel.WARN, message, data);
  }

  /**
   * Calculates optimal column widths based on headers and content
   * @param headers Array of header names
   * @param rows Array of table rows
   * @returns Array of column widths
   */
  private calculateColumnWidths(headers: string[], rows: TableRow[]): number[] {
    return headers.map((header) => {
      const headerWidth = header.length;
      const maxContentWidth = Math.max(...rows.map((row) => String(row[header] ?? "").length));
      return Math.max(headerWidth, maxContentWidth);
    });
  }

  /**
   * Formats boolean values with color (green for true, red for false)
   * @param value The boolean value to format
   * @param width The target width for padding
   * @returns The formatted boolean string
   */
  private formatBoolean(value: boolean, width: number): string {
    return (value ? chalk.green("true") : chalk.red("false")).padEnd(width + 9);
  }

  /**
   * Formats a cell value with appropriate type-specific formatting
   * @param value The cell value to format
   * @param width The target width for padding
   * @returns The formatted cell value string
   */
  private formatCellValue(value: unknown, width: number): string {
    if (isNullOrUndefined(value)) {
      return this.formatNull(width);
    }

    return this.formatKnownValue(value, width);
  }

  /**
   * Formats data object as JSON string
   * @param data - Data to format
   * @returns JSON formatted string or empty string if no data
   */
  private formatData(data: unknown): string {
    if (!data) return "";
    return chalk.dim(JSON.stringify(data, null, 2));
  }

  /**
   * Formats non-null values based on their type (boolean, number, or string)
   * @param value The value to format
   * @param width The target width for padding
   * @returns The formatted value string
   */
  private formatKnownValue(value: unknown, width: number): string {
    if (isBoolean(value)) {
      return this.formatBoolean(value, width);
    }
    if (isNumber(value)) {
      return this.formatNumber(value, width);
    }
    return this.formatString(value, width);
  }

  /**
   * Formats a message with icon and timestamp based on output level
   * @param level - The severity level of the message
   * @param message - The message text to format
   * @returns Formatted message string with icon and timestamp
   */
  private formatMessage(level: OutputLevel, message: string): string {
    const icon = this.iconMap[level];
    const timestamp = chalk.gray(new Date().toISOString());
    return `${icon} ${timestamp} ${message}`;
  }

  /**
   * Formats null or undefined values with dimmed styling
   * @param width The target width for padding
   * @returns The formatted null string
   */
  private formatNull(width: number): string {
    return chalk.dim("null".padEnd(width));
  }

  /**
   * Formats numeric values with cyan color and padding
   * @param value The number value to format
   * @param width The target width for padding
   * @returns The formatted number string
   */
  private formatNumber(value: number, width: number): string {
    return chalk.cyan(String(value).padEnd(width));
  }

  /**
   * Formats a value as a string with padding to specified width
   * @param value The value to format (objects are JSON stringified)
   * @param width The target width for padding
   * @returns The formatted and padded string
   */
  private formatString(value: unknown, width: number): string {
    const str = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
    return str.padEnd(width);
  }

  /**
   * Prints the table header row with formatting
   * @param headers Array of header names
   * @param colWidths Array of column widths for padding
   */
  private printTableHeader(headers: string[], colWidths: number[]): void {
    const headerRow = headers.map((h, i) => chalk.bold(h.padEnd(colWidths[i]))).join(" │ ");
    console.log(`│ ${headerRow} │`);
  }

  /**
   * Prints all data rows in the table
   * @param rows Array of table rows to print
   * @param headers Array of header names for column ordering
   * @param colWidths Array of column widths for padding
   */
  private printTableRows(rows: TableRow[], headers: string[], colWidths: number[]): void {
    for (const row of rows) {
      const rowData = headers.map((h, i) => this.formatCellValue(row[h], colWidths[i])).join(" │ ");
      console.log(`│ ${rowData} │`);
    }
  }

  /**
   * Prints a separator line between header and table rows
   * @param colWidths Array of column widths for separator sizing
   */
  private printTableSeparator(colWidths: number[]): void {
    const separator = colWidths.map((w) => "─".repeat(w)).join("─┼─");
    console.log(`├─${separator}─┤`);
  }

  /**
   * Writes formatted output to console with optional data
   * @param level The severity level of the message
   * @param message The message text to display
   * @param data Optional data to display as JSON
   */
  private writeOutput(level: OutputLevel, message: string, data?: unknown): void {
    const formatted = this.formatMessage(level, message);
    console.log(formatted);

    if (data) {
      console.log(this.formatData(data));
    }
  }
}

/**
 * Factory function to create a console output writer instance
 * @returns A new ConsoleOutputWriter instance
 */
export function createOutputWriter(): IOutputWriter {
  return new ConsoleOutputWriter();
}
