import { Mastra } from "@mastra/core";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

/**
 * Example workflow step: Say hello
 */
const helloStep = createStep({
  id: "hello",
  description: "Say hello",
  inputSchema: z.object({
    name: z.string().describe("Name to greet"),
  }),
  outputSchema: z.object({
    message: z.string().describe("Greeting message"),
  }),
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
  id: "hello-world",
  description: "Simple hello world workflow",
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
