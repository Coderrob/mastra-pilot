import chalk from "chalk";
import { isBoolean, isNullOrUndefined, isNumber } from "@repo/utils";
import { IOutputWriter, OutputLevel, TableRow } from "./types.js";

export class ConsoleOutputWriter implements IOutputWriter {
  private readonly iconMap = {
    [OutputLevel.INFO]: chalk.green("✓"),
    [OutputLevel.WARN]: chalk.yellow("⚠"),
    [OutputLevel.ERROR]: chalk.red("✗"),
    [OutputLevel.FATAL]: chalk.red("✗✗"),
  };

  private formatMessage(level: OutputLevel, message: string): string {
    const icon = this.iconMap[level];
    const timestamp = chalk.gray(new Date().toISOString());
    return `${icon} ${timestamp} ${message}`;
  }

  private formatData(data: unknown): string {
    if (!data) return "";
    return chalk.dim(JSON.stringify(data, null, 2));
  }

  private writeOutput(level: OutputLevel, message: string, data?: unknown): void {
    const formatted = this.formatMessage(level, message);
    console.log(formatted);

    if (data) {
      console.log(this.formatData(data));
    }
  }

  info(message: string, data?: unknown): void {
    this.writeOutput(OutputLevel.INFO, message, data);
  }

  warn(message: string, data?: unknown): void {
    this.writeOutput(OutputLevel.WARN, message, data);
  }

  error(message: string, data?: unknown): void {
    this.writeOutput(OutputLevel.ERROR, message, data);
  }

  fatal(message: string, data?: unknown): never {
    this.writeOutput(OutputLevel.FATAL, message, data);
    process.exit(1);
  }

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

  private calculateColumnWidths(headers: string[], rows: TableRow[]): number[] {
    return headers.map((header) => {
      const headerWidth = header.length;
      const maxContentWidth = Math.max(...rows.map((row) => String(row[header] ?? "").length));
      return Math.max(headerWidth, maxContentWidth);
    });
  }

  private printTableHeader(headers: string[], colWidths: number[]): void {
    const headerRow = headers.map((h, i) => chalk.bold(h.padEnd(colWidths[i]))).join(" │ ");
    console.log(`│ ${headerRow} │`);
  }

  private printTableSeparator(colWidths: number[]): void {
    const separator = colWidths.map((w) => "─".repeat(w)).join("─┼─");
    console.log(`├─${separator}─┤`);
  }

  private printTableRows(rows: TableRow[], headers: string[], colWidths: number[]): void {
    for (const row of rows) {
      const rowData = headers.map((h, i) => this.formatCell(row[h], colWidths[i])).join(" │ ");
      console.log(`│ ${rowData} │`);
    }
  }

  private formatCell(value: unknown, width: number): string {
    return this.formatCellValue(value, width);
  }

  private formatCellValue(value: unknown, width: number): string {
    if (isNullOrUndefined(value)) {
      return this.formatNull(width);
    }

    return this.formatKnownValue(value, width);
  }

  private formatNull(width: number): string {
    return chalk.dim("null".padEnd(width));
  }

  private formatKnownValue(value: unknown, width: number): string {
    if (isBoolean(value)) {
      return this.formatBoolean(value, width);
    }
    if (isNumber(value)) {
      return this.formatNumber(value, width);
    }
    return this.formatString(value, width);
  }

  private formatBoolean(value: boolean, width: number): string {
    return (value ? chalk.green("true") : chalk.red("false")).padEnd(width + 9);
  }

  private formatNumber(value: number, width: number): string {
    return chalk.cyan(String(value).padEnd(width));
  }

  private formatString(value: unknown, width: number): string {
    const str = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
    return str.padEnd(width);
  }
}

export function createOutputWriter(): IOutputWriter {
  return new ConsoleOutputWriter();
}
