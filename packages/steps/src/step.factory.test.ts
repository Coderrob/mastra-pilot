import { describe, expect, it } from "vitest";
import { FileReadStep } from "./file-read.step.js";
import { HttpStep } from "./http.step.js";
import { ShellStep } from "./shell.step.js";
import { StepFactory } from "./step.factory.js";

describe("StepFactory", () => {
  it("should create file-read step", () => {
    const step = StepFactory.createStep("file-read");
    expect(step).toBeInstanceOf(FileReadStep);
    expect(step.getName()).toBe("FileReadStep");
  });

  it("should create http step", () => {
    const step = StepFactory.createStep("http");
    expect(step).toBeInstanceOf(HttpStep);
    expect(step.getName()).toBe("HttpStep");
  });

  it("should create shell step", () => {
    const step = StepFactory.createStep("shell");
    expect(step).toBeInstanceOf(ShellStep);
    expect(step.getName()).toBe("ShellStep");
  });

  it("should throw error for unknown step type", () => {
    const unknownType = "unknown";
    expect(() => StepFactory.createStep(unknownType)).toThrow(
      `Unknown step type: ${unknownType}`
    );
  });

  it("should return all registered step types", () => {
    const types = StepFactory.getStepTypes();
    expect(types).toContain("file-read");
    expect(types).toContain("csv-write");
    expect(types).toContain("http");
    expect(types).toContain("shell");
    expect(types).toContain("git");
  });

  it("should check if step type is registered", () => {
    expect(StepFactory.hasStepType("file-read")).toBe(true);
    expect(StepFactory.hasStepType("unknown")).toBe(false);
  });

  describe("step creation", () => {
    it.each([
      { type: "file-read", expectedName: "FileReadStep" },
      { type: "csv-write", expectedName: "CsvWriteStep" },
      { type: "http", expectedName: "HttpStep" },
      { type: "shell", expectedName: "ShellStep" },
      { type: "git", expectedName: "GitStep" },
    ])(
      "should create $type step with name $expectedName",
      ({ type, expectedName }) => {
        const step = StepFactory.createStep(type);
        expect(step.getName()).toBe(expectedName);
      }
    );
  });
});
