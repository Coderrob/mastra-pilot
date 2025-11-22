/**
 * Output severity levels for console messages
 */
export enum OutputLevel {
  ERROR = "error",
  FATAL = "fatal",
  INFO = "info",
  WARN = "warn",
}

/**
 * Interface for writing formatted output to console or other destinations
 */
export interface IOutputWriter {
  error(message: string, data?: unknown): void;
  fatal(message: string, data?: unknown): never;
  info(message: string, data?: unknown): void;
  table(rows: TableRow[]): void;
  warn(message: string, data?: unknown): void;
}

/**
 * Represents a single row in a table output with key-value pairs
 */
export interface TableRow {
  [key: string]: boolean | null | number | string | undefined;
}
