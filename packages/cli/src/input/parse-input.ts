import { readFileSync } from "node:fs";
import { InputParseError } from "@repo/core";

/**
 * Parses JSON input from either a string or file.
 * @param options - Input options
 * @param options.input - JSON string to parse
 * @param options.file - Path to JSON file to read and parse
 * @returns The parsed JSON object
 * @throws {InputParseError} When JSON parsing fails
 */
export function parseInput(options: { file?: string; input?: string }): unknown {
  try {
    return parseInputFromSource(options);
  } catch (error) {
    return handleParseError(error, options);
  }
}

/**
 * Determines the source of the parsing error for error messages
 * @param options Input options
 * @param options.input JSON string input
 * @param options.file File path input
 * @returns Description of the error source
 */
function getErrorSource(options: { file?: string; input?: string }): string {
  return options.input ? "input string" : options.file || "unknown";
}

/**
 * Handles errors during JSON parsing by throwing an InputParseError.
 * @param error - The original error that occurred
 * @param options - Input options used during parsing
 * @param options.input - JSON string that failed to parse
 * @param options.file - Path to file that failed to parse
 * @throws {InputParseError} Always throws with detailed error information
 */
function handleParseError(error: unknown, options: { file?: string; input?: string }): never {
  const source = getErrorSource(options);
  throw new InputParseError(
    `Failed to parse JSON from ${source}`,
    source,
    error instanceof Error ? error : undefined
  );
}

/**
 * Parses input from the provided source (string or file).
 * @param options - Input options
 * @param options.input - JSON string to parse
 * @param options.file - Path to JSON file to read and parse
 * @returns The parsed JSON object, or empty object if no input provided
 */
function parseInputFromSource(options: { file?: string; input?: string }): unknown {
  if (options.input) {
    return JSON.parse(options.input);
  }

  if (options.file) {
    return JSON.parse(readFileSync(options.file, "utf8"));
  }

  return {};
}
