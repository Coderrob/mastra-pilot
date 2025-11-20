import { readFileSync } from "node:fs";
import { InputParseError } from "@repo/core";

export function parseInput(options: {
  input?: string;
  file?: string;
}): unknown {
  try {
    return parseInputFromSource(options);
  } catch (error) {
    return handleParseError(error, options);
  }
}

function parseInputFromSource(options: {
  input?: string;
  file?: string;
}): unknown {
  if (options.input) {
    return JSON.parse(options.input);
  }

  if (options.file) {
    return JSON.parse(readFileSync(options.file, "utf-8"));
  }

  return {};
}

function handleParseError(
  error: unknown,
  options: { input?: string; file?: string }
): never {
  const source = getErrorSource(options);
  throw new InputParseError(
    `Failed to parse JSON from ${source}`,
    source,
    error instanceof Error ? error : undefined
  );
}

function getErrorSource(options: { input?: string; file?: string }): string {
  return options.input ? "input string" : options.file || "unknown";
}
