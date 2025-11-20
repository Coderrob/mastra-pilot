/**
 * Log level enum for consistent logging configuration
 */
export enum LogLevel {
  TRACE = "trace",
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal",
}

/**
 * Step type enum for factory pattern
 */
export enum StepType {
  FILE_READ = "file-read",
  CSV_WRITE = "csv-write",
  HTTP = "http",
  SHELL = "shell",
  GIT = "git",
}

/**
 * Process exit code enum for consistent process termination
 */
export enum ExitCode {
  SUCCESS = 0,
  GENERAL_ERROR = 1,
  MISUSE = 2,
  INVALID_INPUT = 3,
  CONFIGURATION_ERROR = 4,
  RUNTIME_ERROR = 5,
}

/**
 * Workflow identifier enum for known workflows
 */
export enum WorkflowId {
  DEV_AUTO = "dev-auto",
}
