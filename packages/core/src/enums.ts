/**
 * Process exit code enum for consistent process termination
 */
export enum ExitCode {
  CONFIGURATION_ERROR = 4,
  GENERAL_ERROR = 1,
  INVALID_INPUT = 3,
  MISUSE = 2,
  RUNTIME_ERROR = 5,
  SUCCESS = 0,
}

/**
 * Log level enum for consistent logging configuration
 */
export enum LogLevel {
  DEBUG = "debug",
  ERROR = "error",
  FATAL = "fatal",
  INFO = "info",
  TRACE = "trace",
  WARN = "warn",
}

/**
 * Step type enum for factory pattern
 */
export enum StepType {
  CSV_WRITE = "csv-write",
  FILE_READ = "file-read",
  GIT = "git",
  HTTP = "http",
  SHELL = "shell",
}

/**
 * Workflow identifier enum for known workflows
 */
export enum WorkflowId {
  DEV_AUTO = "dev-auto",
}
