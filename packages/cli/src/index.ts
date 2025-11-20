#!/usr/bin/env node

import { Command } from 'commander';
import { runWorkflows } from './commands/run-command.js';
import { runStep } from './commands/step-command.js';
import { runWorkflow } from './commands/workflow-command.js';

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
  .action(runStep);

program
  .command('workflow')
  .description('Execute workflows')
  .argument('<name>', 'Workflow name (dev-auto)')
  .option('-i, --input <json>', 'Input data as JSON string')
  .option('-f, --file <path>', 'Input data from JSON file')
  .action(runWorkflow);

program
  .command('run')
  .description('Run workflows using the runner')
  .option('-w, --workflows <names...>', 'Workflow names to execute')
  .option('-p, --parallel', 'Run workflows in parallel', false)
  .option('-i, --input <json>', 'Input data as JSON string')
  .action(runWorkflows);

program.parse();
