/**
 * Mastra-native step implementations
 * These use the WorkflowFacade and adapter pattern
 */
import axios from "axios";
import { z } from "zod";
import { createStepWithLogger } from "@repo/core";
import { FileUtils } from "@repo/utils";
import { StepIds } from "./step-ids";

/**
 * File read step using Mastra's step system
 */
export const fileReadStepConfig = createStepWithLogger({
  description: "Read file content with optional line range",
  id: StepIds.FILE_READ,
  inputSchema: z.object({
    baseDir: z.string().optional().default(process.cwd()),
    from: z.number().int().min(1).optional().default(1),
    path: z.string().min(1),
    to: z.number().int().optional().default(-1),
  }),
  outputSchema: z.object({
    content: z.string(),
    lines: z.array(z.string()).optional(),
    path: z.string(),
  }),
  /**
   * Executes the file read operation with optional line range
   * @param input - File read input parameters
   * @param context - Execution context with logger
   * @returns Promise resolving to file content with optional lines array
   */
  execute: async (input, context) => {
    const { logger } = context;
    logger.info({ from: input.from, path: input.path, to: input.to }, "Reading file");
    return await executeFileRead(input);
  },
});

/**
 * HTTP request step using Mastra's step system
 */
export const httpStepConfig = createStepWithLogger({
  description: "Make HTTP request",
  id: StepIds.HTTP,
  inputSchema: z.object({
    data: z.any().optional(),
    headers: z.record(z.string()).optional(),
    method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("GET"),
    url: z.string().url(),
  }),
  outputSchema: z.object({
    data: z.any(),
    headers: z.record(z.string()),
    status: z.number(),
    statusText: z.string(),
  }),
  /**
   * Executes the HTTP request with specified method and parameters
   * @param input - HTTP request configuration
   * @param context - Execution context with logger
   * @returns Promise resolving to HTTP response with status, data, and headers
   */
  execute: async (input, context) => {
    const { logger } = context;

    logger.info({ method: input.method, url: input.url }, "Making HTTP request");

    const response = await axios({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: input.data,
      headers: input.headers,
      method: input.method,
      url: input.url,
      /**
       * Validates HTTP status - accepts all status codes
       * @returns Always true to prevent axios from throwing on non-2xx status
       */
      validateStatus: () => true,
    });

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: response.data,
      headers: response.headers as Record<string, string>,
      status: response.status,
      statusText: response.statusText,
    };
  },
});

/**
 * Shell command step using Mastra's step system
 * @param allowedCommands - Array of command names that are allowed to be executed
 * @returns Mastra step configuration for shell command execution
 */
export const shellStepConfig = (allowedCommands: string[] = ["ls", "cat", "echo", "pwd"]) =>
  createStepWithLogger({
    description: "Execute shell command",
    id: StepIds.SHELL,
    inputSchema: z.object({
      args: z.array(z.string()).default([]),
      command: z.string().min(1),
      cwd: z.string().optional(),
    }),
    outputSchema: z.object({
      exitCode: z.number(),
      stderr: z.string(),
      stdout: z.string(),
    }),
    /**
     * Executes the shell command with security validation
     * @param input - Shell command configuration with command, args, and cwd
     * @param context - Execution context with logger
     * @returns Promise resolving to command output with stdout, stderr, and exit code
     */
    execute: async (input, context) => {
      const { logger } = context;
      const { execa } = await import("execa");

      if (!allowedCommands.includes(input.command)) {
        throw new Error(`Command '${input.command}' is not allowed`);
      }

      logger.info({ args: input.args, command: input.command }, "Executing shell command");

      const result = await execa(input.command, input.args, {
        cwd: input.cwd,
        reject: false,
      });

      return {
        exitCode: result.exitCode,
        stderr: result.stderr,
        stdout: result.stdout,
      };
    },
  });

/**
 * Execute file read with validation and defaults
 * @param input - File read configuration object
 * @param input.path - Path to the file to read
 * @param input.from - Starting line number (1-indexed)
 * @param input.to - Ending line number (-1 for end of file)
 * @param input.baseDir - Base directory for path resolution
 * @returns Promise resolving to file content with optional lines array and path
 */
async function executeFileRead(input: {
  baseDir?: string;
  from?: number;
  path: string;
  to?: number;
}) {
  const baseDir = getBaseDir(input.baseDir);
  const from = getFrom(input.from);
  const to = getTo(input.to);

  await validateFileExists(input.path, baseDir);
  return await readFileWithRange(input.path, from, to, baseDir);
}

/**
 * Gets the base directory with fallback to current working directory
 * @param baseDir - Optional base directory path
 * @returns Base directory path or process.cwd() if undefined
 */
function getBaseDir(baseDir: string | undefined): string {
  return baseDir ?? process.cwd();
}

/**
 * Gets the starting line number with default of 1
 * @param from - Optional starting line number
 * @returns Starting line number or 1 if undefined
 */
function getFrom(from: number | undefined): number {
  return from ?? 1;
}

/**
 * Gets the ending line number with default of -1 (end of file)
 * @param to - Optional ending line number
 * @returns Ending line number or -1 if undefined
 */
function getTo(to: number | undefined): number {
  return to ?? -1;
}

/**
 * Helper function to read file content with optional line range
 * @param path - Path to the file to read
 * @param from - Starting line number (1-indexed)
 * @param to - Ending line number (-1 for end of file)
 * @param baseDir - Base directory for path resolution
 * @returns Promise resolving to object with content, optional lines array, and path
 */
async function readFileWithRange(
  path: string,
  from: number,
  to: number,
  baseDir: string
): Promise<{ content: string; lines?: string[]; path: string }> {
  if (from !== 1 || to !== -1) {
    const lines = await FileUtils.readFileLines(path, from, to, baseDir);
    const content = lines.join("\n");
    return { content, lines, path };
  }

  const content = await FileUtils.readFileSafe(path, baseDir);
  return { content, path };
}

/**
 * Validate that file exists or throw error
 * @param path - Path to the file to validate
 * @param baseDir - Base directory for path resolution
 * @returns Promise that resolves if file exists, rejects if not found
 */
async function validateFileExists(path: string, baseDir: string): Promise<void> {
  const exists = await FileUtils.existsSafe(path, baseDir);
  if (!exists) {
    throw new Error(`File not found: ${path}`);
  }
}
