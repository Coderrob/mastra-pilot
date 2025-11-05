/**
 * Example of using RunnerAdapter with Mastra workflows
 */
import { RunnerAdapter, MastraAdapter, createStep } from '@repo/core';
import pino from 'pino';
import { z } from 'zod';

/**
 * Create a runner with Mastra adapter for executing workflows
 */
export function createMastraRunner() {
  const logger = pino({ level: 'info' });
  
  // Create runner with Mastra adapter
  const runner = new RunnerAdapter({
    logger,
    provider: new MastraAdapter(),
  });

  return { runner, logger };
}

/**
 * Example: Register and execute multiple workflows
 */
export async function runMultipleWorkflows() {
  const { runner, logger } = createMastraRunner();

  // Create steps using Mastra's createStep
  const fileStep = createStep({
    id: 'read-config',
    description: 'Read configuration file',
    inputSchema: z.object({
      path: z.string(),
      baseDir: z.string().optional(),
    }),
    outputSchema: z.object({
      content: z.string(),
    }),
    execute: async ({ inputData, runtimeContext }) => {
      // Access injected logger from context
      const customContext: any = runtimeContext?.get?.('customContext') || {};
      const log = customContext.logger || logger;
      
      log.info({ path: inputData.path }, 'Reading file');
      
      // Simulate file read
      return {
        content: `Config from ${inputData.path}`,
      };
    },
  });

  const processStep = createStep({
    id: 'process-config',
    description: 'Process configuration',
    inputSchema: z.object({
      content: z.string(),
    }),
    outputSchema: z.object({
      processed: z.string(),
    }),
    execute: async ({ inputData }) => {
      return {
        processed: `Processed: ${inputData.content}`,
      };
    },
  });

  // Register workflows (steps can act as simple workflows)
  runner.registerWorkflow(fileStep as never, 'file-workflow');
  runner.registerWorkflow(processStep as never, 'process-workflow');

  // Execute workflows sequentially
  const results = await runner.runWorkflowsSequential([
    { id: 'file-workflow', input: { path: './config.json' } },
    { id: 'process-workflow', input: { content: 'data' } },
  ]);

  logger.info({ results }, 'All workflows completed');
  return results;
}

/**
 * Example: Execute workflows in parallel
 */
export async function runParallelWorkflows() {
  const { runner, logger } = createMastraRunner();

  const httpStep = createStep({
    id: 'fetch-api',
    description: 'Fetch from API',
    inputSchema: z.object({
      url: z.string().url(),
    }),
    outputSchema: z.object({
      data: z.any(),
    }),
    execute: async ({ inputData, runtimeContext }) => {
      const customContext: any = runtimeContext?.get?.('customContext') || {};
      const log = customContext.logger || logger;
      
      log.info({ url: inputData.url }, 'Fetching from API');
      
      return {
        data: { status: 'success', url: inputData.url },
      };
    },
  });

  runner.registerWorkflow(httpStep as never, 'api-workflow-1');
  runner.registerWorkflow(httpStep as never, 'api-workflow-2');

  // Execute in parallel
  const results = await runner.runWorkflowsParallel([
    { id: 'api-workflow-1', input: { url: 'https://api.example.com/1' } },
    { id: 'api-workflow-2', input: { url: 'https://api.example.com/2' } },
  ]);

  logger.info({ results }, 'Parallel workflows completed');
  return results;
}

/**
 * Example: Using both legacy and Mastra workflows
 */
export async function runMixedWorkflows() {
  const { runner, logger } = createMastraRunner();

  // Legacy workflow (using the old system)
  const { createDevAutoWorkflow } = await import('./dev-auto-workflow.js');
  const legacyWorkflow = createDevAutoWorkflow({ logger });

  // Mastra workflow
  const mastraStep = createStep({
    id: 'mastra-step',
    description: 'Mastra-based step',
    inputSchema: z.any(),
    outputSchema: z.any(),
    execute: async ({ inputData }) => {
      return { result: 'Mastra execution completed', input: inputData };
    },
  });

  // Register both types
  runner.registerWorkflow(legacyWorkflow, 'legacy-workflow');
  runner.registerWorkflow(mastraStep as never, 'mastra-workflow');

  // Execute both
  const legacyResult = await runner.runWorkflow('legacy-workflow', { command: 'echo', args: ['test'] });
  const mastraResult = await runner.runWorkflow('mastra-workflow', { data: 'test' });

  return { legacyResult, mastraResult };
}
