/**
 * Log level enum for consistent logging configuration
 */
export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Step type enum for factory pattern
 */
export enum StepType {
  FILE_READ = 'file-read',
  CSV_WRITE = 'csv-write',
  HTTP = 'http',
  SHELL = 'shell',
  GIT = 'git',
}
