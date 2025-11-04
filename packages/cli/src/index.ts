#!/usr/bin/env node

import { Command } from 'commander';
import { Runner } from '@repo/core';
import { 
  FileReadStep, 
  CsvWriteStep, 
  HttpStep, 
  ShellStep, 
  GitStep 
} from '@repo/steps';
import { createDevAutoWorkflow } from '@repo/workflows';
import pino from 'pino';

const program = new Command();

program
  .name('mastra')
  .description('Mastra Pilot - Workflow automation CLI')
  .version('0.0.0');

// Step commands
program
  .command('step')
  .description('Execute individual steps')
  .argument('<type>', 'Step type (file-read, csv-write, http, shell, git)')
  .option('-i, --input <json>', 'Input data as JSON string')
  .option('-f, --file <path>', 'Input data from JSON file')
  .action(async (type: string, options) => {
    const logger = pino({ level: 'info' });
    
    try {
      let input = {};
      
      if (options.input) {
        input = JSON.parse(options.input);
      } else if (options.file) {
        const { readFileSync } = await import('fs');
        input = JSON.parse(readFileSync(options.file, 'utf-8'));
      }

      let step;
      switch (type) {
        case 'file-read':
          step = new FileReadStep();
          break;
        case 'csv-write':
          step = new CsvWriteStep();
          break;
        case 'http':
          step = new HttpStep();
          break;
        case 'shell':
          step = new ShellStep();
          break;
        case 'git':
          step = new GitStep();
          break;
        default:
          throw new Error(`Unknown step type: ${type}`);
      }

      const result = await step.execute(input as any, { logger, metadata: {} });
      
      if (result.success) {
        console.log('✓ Step completed successfully');
        console.log(JSON.stringify(result.data, null, 2));
        process.exit(0);
      } else {
        console.error('✗ Step failed:', result.error?.message);
        process.exit(1);
      }
    } catch (error) {
      logger.error(error, 'Error executing step');
      process.exit(1);
    }
  });

// Workflow commands
program
  .command('workflow')
  .description('Execute workflows')
  .argument('<name>', 'Workflow name (dev-auto)')
  .option('-i, --input <json>', 'Input data as JSON string')
  .option('-f, --file <path>', 'Input data from JSON file')
  .action(async (name: string, options) => {
    const logger = pino({ level: 'info' });
    
    try {
      let input = {};
      
      if (options.input) {
        input = JSON.parse(options.input);
      } else if (options.file) {
        const { readFileSync } = await import('fs');
        input = JSON.parse(readFileSync(options.file, 'utf-8'));
      }

      const runner = new Runner({ logger });

      switch (name) {
        case 'dev-auto':
          const workflow = createDevAutoWorkflow({ logger });
          runner.registerWorkflow(workflow);
          break;
        default:
          throw new Error(`Unknown workflow: ${name}`);
      }

      const result = await runner.runWorkflow(name, input);
      
      if (result.success) {
        console.log('✓ Workflow completed successfully');
        console.log(`Duration: ${result.duration}ms`);
        process.exit(0);
      } else {
        console.error('✗ Workflow failed:', result.error?.message);
        process.exit(1);
      }
    } catch (error) {
      logger.error(error, 'Error executing workflow');
      process.exit(1);
    }
  });

// Runner commands
program
  .command('run')
  .description('Run workflows using the runner')
  .option('-w, --workflows <names...>', 'Workflow names to execute')
  .option('-p, --parallel', 'Run workflows in parallel', false)
  .option('-i, --input <json>', 'Input data as JSON string')
  .action(async (options) => {
    const logger = pino({ level: 'info' });
    
    try {
      const runner = new Runner({ logger });

      // Register workflows
      if (options.workflows?.includes('dev-auto')) {
        const workflow = createDevAutoWorkflow({ logger });
        runner.registerWorkflow(workflow);
      }

      let input = {};
      if (options.input) {
        input = JSON.parse(options.input);
      }

      const workflowConfigs = (options.workflows || ['dev-auto']).map((name: string) => ({
        name,
        input,
      }));

      const results = options.parallel
        ? await runner.runWorkflowsParallel(workflowConfigs)
        : await runner.runWorkflowsSequential(workflowConfigs);

      const allSucceeded = results.every(r => r.success);
      
      if (allSucceeded) {
        console.log('✓ All workflows completed successfully');
        process.exit(0);
      } else {
        console.error('✗ Some workflows failed');
        process.exit(1);
      }
    } catch (error) {
      logger.error(error, 'Error running workflows');
      process.exit(1);
    }
  });

program.parse();
