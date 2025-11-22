import { describe, expect, it } from "vitest";
import { FileReadStep } from "./file-read.step.js";
import { HttpStep } from "./http.step.js";
import { ShellStep } from "./shell.step.js";
import { StepIds } from "./step-ids.js";
import { StepFactory } from "./step.factory.js";

describe("StepFactory", () => {
  it("should create file-read step", () => {
    const step = StepFactory.createStep(StepIds.FILE_READ);
    expect(step).toBeInstanceOf(FileReadStep);
    expect(step.getName()).toBe(StepIds.FILE_READ);
  });

  it("should create http step", () => {
    const step = StepFactory.createStep(StepIds.HTTP);
    expect(step).toBeInstanceOf(HttpStep);
    expect(step.getName()).toBe(StepIds.HTTP);
  });

  it("should create shell step", () => {
    const step = StepFactory.createStep(StepIds.SHELL);
    expect(step).toBeInstanceOf(ShellStep);
    expect(step.getName()).toBe(StepIds.SHELL);
  });

  it("should throw error for unknown step type", () => {
    const unknownType = "unknown";
    expect(() => StepFactory.createStep(unknownType)).toThrow(`Unknown step type: ${unknownType}`);
  });

  it("should return all registered step types", () => {
    const types = StepFactory.getStepTypes();
    expect(types).toContain(StepIds.FILE_READ);
    expect(types).toContain(StepIds.CSV_WRITE);
    expect(types).toContain(StepIds.HTTP);
    expect(types).toContain(StepIds.SHELL);
    expect(types).toContain(StepIds.GIT);
  });

  it("should check if step type is registered", () => {
    expect(StepFactory.hasStepType(StepIds.FILE_READ)).toBe(true);
    expect(StepFactory.hasStepType("unknown")).toBe(false);
  });

  describe("step creation", () => {
    it.each([
      { expectedName: StepIds.FILE_READ, type: StepIds.FILE_READ },
      { expectedName: StepIds.CSV_WRITE, type: StepIds.CSV_WRITE },
      { expectedName: StepIds.HTTP, type: StepIds.HTTP },
      { expectedName: StepIds.SHELL, type: StepIds.SHELL },
      { expectedName: StepIds.GIT, type: StepIds.GIT },
    ])("should create $type step with name $expectedName", ({ expectedName, type }) =>
      expect(StepFactory.createStep(type).getName()).toBe(expectedName)
    );
  });
});
