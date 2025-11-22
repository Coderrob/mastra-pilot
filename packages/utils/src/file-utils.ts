import path from "node:path";
import fs from "fs-extra";

const DEFAULT_ENCODING: BufferEncoding = "utf8";

/**
 * Secure file operations with path validation
 */
export const FileUtils = {
  /**
   * Ensure directory exists
   * @param dirPath - The directory path to ensure
   * @param baseDir - The base directory to validate against
   * @returns Promise that resolves when directory is ensured
   */
  async ensureDir(dirPath: string, baseDir: string): Promise<void> {
    this.validatePath(dirPath, baseDir);
    await fs.ensureDir(dirPath);
  },

  /**
   * Check if file exists safely
   * @param filePath - The file path to check
   * @param baseDir - The base directory to validate against
   * @returns Promise resolving to true if file exists, false otherwise
   */
  async existsSafe(filePath: string, baseDir: string): Promise<boolean> {
    try {
      this.validatePath(filePath, baseDir);
      return fs.pathExists(filePath);
    } catch {
      return false;
    }
  },

  /**
   * Read file with line range
   * @param filePath - The file path to read
   * @param from - Starting line number (1-indexed)
   * @param to - Ending line number (-1 for end of file)
   * @param baseDir - The base directory to validate against
   * @returns Promise resolving to array of lines
   */
  async readFileLines(
    filePath: string,
    from: number,
    to: number,
    baseDir: string
  ): Promise<string[]> {
    this.validatePath(filePath, baseDir);
    const content = await fs.readFile(filePath, DEFAULT_ENCODING);
    const lines = content.split("\n");

    const startLine = Math.max(0, from - 1);
    const endLine = to === -1 ? lines.length : Math.min(lines.length, to);

    return lines.slice(startLine, endLine);
  },

  /**
   * Safely read file with path validation
   * @param filePath - The file path to read
   * @param baseDir - The base directory to validate against
   * @param encoding - The character encoding to use
   * @returns Promise resolving to the file contents
   */
  async readFileSafe(
    filePath: string,
    baseDir: string,
    encoding: BufferEncoding = DEFAULT_ENCODING
  ): Promise<string> {
    this.validatePath(filePath, baseDir);
    return fs.readFile(filePath, encoding);
  },

  /**
   * Validate that path is within allowed directory (prevent path traversal)
   * @param filePath - The file path to validate
   * @param baseDir - The base directory to validate against
   * @returns void
   */
  validatePath(filePath: string, baseDir: string): void {
    const resolvedPath = path.resolve(filePath);
    const resolvedBase = path.resolve(baseDir);

    if (!resolvedPath.startsWith(resolvedBase)) {
      throw new Error(`Path traversal detected: ${filePath} is outside ${baseDir}`);
    }
  },

  /**
   * Safely write file with path validation
   * @param filePath - The file path to write
   * @param content - The content to write
   * @param baseDir - The base directory to validate against
   * @param encoding - The character encoding to use
   * @returns Promise that resolves when write is complete
   */
  async writeFileSafe(
    filePath: string,
    content: string,
    baseDir: string,
    encoding: BufferEncoding = DEFAULT_ENCODING
  ): Promise<void> {
    this.validatePath(filePath, baseDir);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, encoding);
  },
};
