/**
 * Mastra-native step implementations
 * These use the WorkflowFacade and adapter pattern
 */
import { createStepWithLogger } from '@repo/core';
import { z } from 'zod';
import { FileUtils } from '@repo/utils';

/**
 * File read step using Mastra's step system
 */
export const fileReadStepConfig = createStepWithLogger({
  id: 'file-read',
  description: 'Read file content with optional line range',
  inputSchema: z.object({
    path: z.string().min(1),
    from: z.number().int().min(1).optional().default(1),
    to: z.number().int().optional().default(-1),
    baseDir: z.string().optional().default(process.cwd()),
  }),
  outputSchema: z.object({
    content: z.string(),
    lines: z.array(z.string()).optional(),
    path: z.string(),
  }),
  execute: async (input, context) => {
    const { logger } = context;
    const { path, from = 1, to = -1, baseDir = process.cwd() } = input;

    logger.info({ path, from, to }, 'Reading file');

    const exists = await FileUtils.existsSafe(path, baseDir);
    if (!exists) {
      throw new Error(`File not found: ${path}`);
    }

    if (from !== 1 || to !== -1) {
      const lines = await FileUtils.readFileLines(path, from, to, baseDir);
      const content = lines.join('\n');
      return { content, lines, path };
    }

    const content = await FileUtils.readFileSafe(path, baseDir);
    return { content, path };
  },
});

/**
 * HTTP request step using Mastra's step system
 */
export const httpStepConfig = createStepWithLogger({
  id: 'http-request',
  description: 'Make HTTP request',
  inputSchema: z.object({
    url: z.string().url(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
    headers: z.record(z.string()).optional(),
    data: z.any().optional(),
  }),
  outputSchema: z.object({
    status: z.number(),
    statusText: z.string(),
    data: z.any(),
    headers: z.record(z.string()),
  }),
  execute: async (input, context) => {
    const { logger } = context;
    const axios = (await import('axios')).default;

    logger.info({ url: input.url, method: input.method }, 'Making HTTP request');

    const response = await axios({
      url: input.url,
      method: input.method,
      headers: input.headers,
      data: input.data,
      validateStatus: () => true,
    });

    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers as Record<string, string>,
    };
  },
});

/**
 * Shell command step using Mastra's step system
 */
export const shellStepConfig = (allowedCommands: string[] = ['ls', 'cat', 'echo', 'pwd']) =>
  createStepWithLogger({
    id: 'shell-command',
    description: 'Execute shell command',
    inputSchema: z.object({
      command: z.string().min(1),
      args: z.array(z.string()).default([]),
      cwd: z.string().optional(),
    }),
    outputSchema: z.object({
      stdout: z.string(),
      stderr: z.string(),
      exitCode: z.number(),
    }),
    execute: async (input, context) => {
      const { logger } = context;
      const { execa } = await import('execa');

      if (!allowedCommands.includes(input.command)) {
        throw new Error(`Command '${input.command}' is not allowed`);
      }

      logger.info({ command: input.command, args: input.args }, 'Executing shell command');

      const result = await execa(input.command, input.args, {
        cwd: input.cwd,
        reject: false,
      });

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
      };
    },
  });
