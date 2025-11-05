import chalk from 'chalk';
import { ExitCode } from '@repo/core';

/**
 * Output message level
 */
export enum OutputLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Table row data
 */
export interface TableRow {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Output writer interface for consistent CLI output
 */
export interface IOutputWriter {
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
  fatal(message: string, data?: unknown): never;
  table(rows: TableRow[]): void;
}

/**
 * Console output writer with chalk formatting
 * Provides consistent, professional CLI output
 */
export class ConsoleOutputWriter implements IOutputWriter {
  private readonly iconMap = {
    [OutputLevel.INFO]: chalk.green('✓'),
    [OutputLevel.WARN]: chalk.yellow('⚠'),
    [OutputLevel.ERROR]: chalk.red('✗'),
    [OutputLevel.FATAL]: chalk.red('✗✗'),
  };

  /**
   * Format message with level-specific styling
   */
  private formatMessage(level: OutputLevel, message: string): string {
    const icon = this.iconMap[level];
    const timestamp = chalk.gray(new Date().toISOString());
    
    switch (level) {
      case OutputLevel.INFO:
        return `${icon} ${chalk.bold(message)} ${timestamp}`;
      case OutputLevel.WARN:
        return `${icon} ${chalk.yellow.bold(message)} ${timestamp}`;
      case OutputLevel.ERROR:
      case OutputLevel.FATAL:
        return `${icon} ${chalk.red.bold(message)} ${timestamp}`;
    }
  }

  /**
   * Format data for output
   */
  private formatData(data: unknown): string {
    if (data === undefined || data === null) {
      return '';
    }

    if (typeof data === 'string') {
      return chalk.cyan(data);
    }

    if (typeof data === 'number' || typeof data === 'boolean') {
      return chalk.yellow(String(data));
    }

    try {
      return chalk.dim(JSON.stringify(data, null, 2));
    } catch {
      return chalk.dim(String(data));
    }
  }

  /**
   * Output info message
   */
  info(message: string, data?: unknown): void {
    const formattedMessage = this.formatMessage(OutputLevel.INFO, message);
    console.log(formattedMessage);
    
    if (data !== undefined) {
      console.log(this.formatData(data));
    }
  }

  /**
   * Output warning message
   */
  warn(message: string, data?: unknown): void {
    const formattedMessage = this.formatMessage(OutputLevel.WARN, message);
    console.warn(formattedMessage);
    
    if (data !== undefined) {
      console.warn(this.formatData(data));
    }
  }

  /**
   * Output error message
   */
  error(message: string, data?: unknown): void {
    const formattedMessage = this.formatMessage(OutputLevel.ERROR, message);
    console.error(formattedMessage);
    
    if (data !== undefined) {
      console.error(this.formatData(data));
    }
  }

  /**
   * Output fatal error message and exit
   */
  fatal(message: string, data?: unknown): never {
    const formattedMessage = this.formatMessage(OutputLevel.FATAL, message);
    console.error(formattedMessage);
    
    if (data !== undefined) {
      console.error(this.formatData(data));
    }
    
    process.exit(ExitCode.GENERAL_ERROR);
  }

  /**
   * Output data as a formatted table
   */
  table(rows: TableRow[]): void {
    if (rows.length === 0) {
      return;
    }

    // Get all unique keys from all rows
    const keys = Array.from(
      new Set(rows.flatMap(row => Object.keys(row)))
    );

    // Calculate column widths
    const widths = keys.map(key => {
      const headerWidth = key.length;
      const maxValueWidth = Math.max(
        ...rows.map(row => String(row[key] ?? '').length)
      );
      return Math.max(headerWidth, maxValueWidth);
    });

    // Format header
    const header = keys
      .map((key, i) => chalk.bold.cyan(key.padEnd(widths[i])))
      .join(' │ ');
    
    const separator = keys
      .map((_, i) => '─'.repeat(widths[i]))
      .join('─┼─');

    console.log(header);
    console.log(chalk.gray(separator));

    // Format rows
    rows.forEach(row => {
      const line = keys
        .map((key, i) => {
          const value = row[key];
          const strValue = String(value ?? '').padEnd(widths[i]);
          
          // Color based on type
          if (value === null || value === undefined) {
            return chalk.gray(strValue);
          }
          if (typeof value === 'boolean') {
            return value ? chalk.green(strValue) : chalk.red(strValue);
          }
          if (typeof value === 'number') {
            return chalk.yellow(strValue);
          }
          return strValue;
        })
        .join(' │ ');
      
      console.log(line);
    });
  }
}
