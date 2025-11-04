/**
 * Example of using Mastra-native workflows with the adapter pattern
 */
import { WorkflowFacade, MastraAdapter } from '@repo/core';
import { fileReadStepConfig, httpStepConfig } from '@repo/steps';
import { z } from 'zod';
import pino from 'pino';

/**
 * Create a workflow using the Mastra adapter
 */
export function createMastraWorkflowExample() {
  const facade = new WorkflowFacade(new MastraAdapter());
  const logger = pino({ level: 'info' });

  // Create steps with dependency injection
  const fileReadStep = facade.createStep(fileReadStepConfig);
  const httpStep = facade.createStep(httpStepConfig);

  // Create workflow
  const workflow = facade.createWorkflow({
    id: 'example-workflow',
    name: 'Example Workflow',
    description: 'Reads a file and makes an HTTP request',
    inputSchema: z.object({
      filePath: z.string(),
      apiUrl: z.string().url(),
    }),
    outputSchema: z.object({
      fileContent: z.string(),
      apiResponse: z.any(),
    }),
    steps: [fileReadStep, httpStep],
  });

  return { facade, workflow, logger };
}

/**
 * Execute the example workflow
 */
export async function executeExampleWorkflow(filePath: string, apiUrl: string) {
  const { facade, workflow, logger } = createMastraWorkflowExample();

  const result = await facade.execute(
    workflow,
    { filePath, apiUrl },
    { logger, metadata: { source: 'example' } }
  );

  return result;
}

/**
 * Example: Create a provider-agnostic workflow that can work with Mastra or LangGraph
 */
export function createProviderAgnosticWorkflow(providerType: 'mastra' | 'langgraph' = 'mastra') {
  // In the future, we can add a LangGraphAdapter here
  const adapter = providerType === 'mastra' ? new MastraAdapter() : new MastraAdapter(); // TODO: Add LangGraphAdapter
  const facade = new WorkflowFacade(adapter);

  return facade;
}
