#!/usr/bin/env node

import { Command } from 'commander';
import { createLogger, parseInput, handleSuccess, handleError } from './utils.js';
import { createStep, executeStep } from './step-executor.js';
import { executeWorkflow, executeWorkflows } from './workflow-executor.js';

const program = new Command();

program
  .name('mastra')
  .description('Mastra Pilot - Workflow automation CLI')
  .version('0.0.0');

program
  .command('step')
  .description('Execute individual steps')
  .argument('<type>', 'Step type (file-read, csv-write, http, shell, git)')
  .option('-i, --input <json>', 'Input data as JSON string')
  .option('-f, --file <path>', 'Input data from JSON file')
  .action(async (type: string, options) => {
    const logger = createLogger();
    
    try {
      const input = parseInput(options);
      const step = createStep(type);
      const result = await executeStep(step, input, logger);
      
      if (!result.success) {
        handleError(logger, result.error, 'Step failed');
      }
      
      handleSuccess('Step completed successfully', result.data);
    } catch (error) {
      handleError(logger, error, 'Error executing step');
    }
  });

program
  .command('workflow')
  .description('Execute workflows')
  .argument('<name>', 'Workflow name (dev-auto)')
  .option('-i, --input <json>', 'Input data as JSON string')
  .option('-f, --file <path>', 'Input data from JSON file')
  .action(async (name: string, options) => {
    const logger = createLogger();
    
    try {
      const input = parseInput(options);
      const result = await executeWorkflow(name, input, logger);
      
      if (!result.success) {
        handleError(logger, result.error, 'Workflow failed');
      }
      
      const duration = result.duration || 0;
      handleSuccess(`Workflow completed successfully (${duration}ms)`, result.data);
    } catch (error) {
      handleError(logger, error, 'Error executing workflow');
    }
  });

program
  .command('run')
  .description('Run workflows using the runner')
  .option('-w, --workflows <names...>', 'Workflow names to execute')
  .option('-p, --parallel', 'Run workflows in parallel', false)
  .option('-i, --input <json>', 'Input data as JSON string')
  .action(async (options) => {
    const logger = createLogger();
    
    try {
      const input = parseInput(options);
      const names = options.workflows || ['dev-auto'];
      const results = await executeWorkflows(names, input, logger, options.parallel);
      
      if (!results.every(r => r.success)) {
        handleError(logger, new Error('Some workflows failed'), 'Workflow execution failed');
      }
      
      handleSuccess('All workflows completed successfully');
    } catch (error) {
      handleError(logger, error, 'Error running workflows');
    }
  });

program.parse();
