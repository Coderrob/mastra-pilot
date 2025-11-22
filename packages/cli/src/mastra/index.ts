import { Mastra } from "@mastra/core";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

/**
 * Example workflow step: Say hello
 */
const helloStep = createStep({
  description: "Say hello",
  id: "hello",
  inputSchema: z.object({
    name: z.string().describe("Name to greet"),
  }),
  outputSchema: z.object({
    message: z.string().describe("Greeting message"),
  }),
  /**
   * Executes the hello step by generating a greeting message
   * @param root0 Step execution parameters
   * @param root0.inputData Input data containing the name to greet
   * @returns Promise resolving to greeting message
   */
  execute: ({ inputData }) => {
    const { name } = inputData;
    return Promise.resolve({
      message: `Hello, ${name}!`,
    });
  },
});

/**
 * Hello world workflow
 */
const helloWorkflow = createWorkflow({
  description: "Simple hello world workflow",
  id: "hello-world",
  inputSchema: z.object({
    name: z.string().describe("Name to greet"),
  }),
  outputSchema: z.object({
    message: z.string().describe("Greeting message"),
  }),
  steps: [helloStep],
}).then(helloStep);

/**
 * Mastra instance - exported for mastra dev command
 */
export const mastra = new Mastra({
  workflows: {
    "hello-world": helloWorkflow,
  },
});
