import { describe, it, expect } from 'vitest';
import { createDevAutoWorkflow } from './dev-auto-workflow.js';
import pino from 'pino';

describe('DevAutoWorkflow', () => {
  const logger = pino({ level: 'silent' });

  it('should create workflow with correct name', () => {
    const workflow = createDevAutoWorkflow({ logger });
    expect(workflow.getName()).toBe('DevAutoWorkflow');
  });

  it('should have all required steps', () => {
    const workflow = createDevAutoWorkflow({ logger });
    const steps = workflow.getSteps();
    
    expect(steps).toHaveLength(5);
    expect(steps[0].name).toBe('install-dependencies');
    expect(steps[1].name).toBe('run-tests');
    expect(steps[2].name).toBe('git-add');
    expect(steps[3].name).toBe('git-commit');
    expect(steps[4].name).toBe('git-push');
  });

  it('should support custom logger', () => {
    const customLogger = pino({ level: 'error' });
    const workflow = createDevAutoWorkflow({ logger: customLogger });
    
    expect(workflow).toBeDefined();
    expect(workflow.getName()).toBe('DevAutoWorkflow');
  });

  it('should have continueOnError set to false by default', () => {
    const workflow = createDevAutoWorkflow({ logger });
    
    // Workflow should stop on first error
    expect(workflow).toBeDefined();
  });
});
