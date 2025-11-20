export enum OutputLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface TableRow {
  [key: string]: string | number | boolean | null | undefined;
}

export interface IOutputWriter {
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
  fatal(message: string, data?: unknown): never;
  table(rows: TableRow[]): void;
}
