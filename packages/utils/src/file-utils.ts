import path from "node:path";
import fs from "fs-extra";

const DEFAULT_ENCODING: BufferEncoding = "utf-8";

/**
 * Secure file operations with path validation
 */
export class FileUtils {
  /**
   * Validate that path is within allowed directory (prevent path traversal)
   */
  static validatePath(filePath: string, baseDir: string): void {
    const resolvedPath = path.resolve(filePath);
    const resolvedBase = path.resolve(baseDir);

    if (!resolvedPath.startsWith(resolvedBase)) {
      throw new Error(`Path traversal detected: ${filePath} is outside ${baseDir}`);
    }
  }

  /**
   * Safely read file with path validation
   */
  static async readFileSafe(
    filePath: string,
    baseDir: string,
    encoding: BufferEncoding = DEFAULT_ENCODING
  ): Promise<string> {
    this.validatePath(filePath, baseDir);
    return fs.readFile(filePath, encoding);
  }

  /**
   * Safely write file with path validation
   */
  static async writeFileSafe(
    filePath: string,
    content: string,
    baseDir: string,
    encoding: BufferEncoding = DEFAULT_ENCODING
  ): Promise<void> {
    this.validatePath(filePath, baseDir);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, encoding);
  }

  /**
   * Read file with line range
   */
  static async readFileLines(
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
  }

  /**
   * Check if file exists safely
   */
  static async existsSafe(filePath: string, baseDir: string): Promise<boolean> {
    try {
      this.validatePath(filePath, baseDir);
      return fs.pathExists(filePath);
    } catch {
      return false;
    }
  }

  /**
   * Ensure directory exists
   */
  static async ensureDir(dirPath: string, baseDir: string): Promise<void> {
    this.validatePath(dirPath, baseDir);
    await fs.ensureDir(dirPath);
  }
}
