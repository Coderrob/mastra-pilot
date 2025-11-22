import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { z } from "zod";
import { BaseStep, IStepContext, StepResult } from "@repo/core";
import { StepIds } from "./step-ids";

/**
 * Input schema for HTTP request operations
 * Validates URL, HTTP method, headers, and request parameters
 */
export const HttpInputSchema = z.object({
  data: z.unknown().optional(),
  headers: z.record(z.string()).optional(),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).optional().default("GET"),
  params: z.record(z.string()).optional(),
  timeout: z.number().int().positive().optional().default(30_000),
  url: z.string().url("Valid URL is required"),
});

/**
 * Type definition for HTTP step input
 */
export type HttpInput = z.infer<typeof HttpInputSchema>;

/**
 * Output structure for HTTP request operations
 * Contains response status, data, and headers
 */
export interface HttpOutput {
  data: unknown;
  headers: Record<string, string>;
  status: number;
  statusText: string;
}

/**
 * Builder for constructing axios request configurations
 * Translates step input into axios-compatible config objects
 */
export class HttpRequestConfigBuilder {
  /**
   * Creates an axios request configuration from step input
   * @param input - HTTP step input with URL, method, and options
   * @returns Axios request configuration ready for execution
   */
  buildRequestConfig(input: HttpInput): AxiosRequestConfig {
    const { data, headers, method, params, timeout, url } = input;
    return {
      data,
      headers,
      method,
      params,
      timeout,
      url,
      /**
       * Validates HTTP status codes
       * @returns Always true to prevent throwing on any status code
       */
      validateStatus: () => true, // Don't throw on any status
    };
  }
}

/**
 * Mapper for transforming axios responses into step output format
 * Handles response status evaluation and output structure creation
 */
export class HttpResponseMapper {
  /**
   * Converts an exception into a step result error
   * @param error - The caught exception
   * @returns Error result with properly formatted error
   */
  convertErrorToResult(error: unknown): StepResult<HttpOutput> {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
      success: false,
    };
  }

  /**
   * Determines if an HTTP status code indicates success
   * @param statusCode - HTTP status code from response
   * @returns True if status is in success range (200-299), false otherwise
   */
  isSuccessStatus(statusCode: number): boolean {
    return statusCode >= 200 && statusCode < 300;
  }

  /**
   * Creates a standardized HTTP output from axios response
   * @param response - Axios response object
   * @returns Structured HTTP output with status, data, and headers
   */
  mapResponseToOutput(response: AxiosResponse): HttpOutput {
    return {
      data: response.data as unknown,
      headers: response.headers as Record<string, string>,
      status: response.status,
      statusText: response.statusText,
    };
  }
}

/**
 * Step for making HTTP requests using axios
 * Provides flexible HTTP client with configurable method, headers, and parameters
 *
 * @example
 * ```typescript
 * // Make GET request
 * const step = new HttpStep();
 * const result = await step.execute({
 *   url: 'https://api.example.com/users',
 *   method: 'GET'
 * });
 *
 * // POST with data
 * const postResult = await step.execute({
 *   url: 'https://api.example.com/users',
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   data: { name: 'John' }
 * });
 * ```
 */
export class HttpStep extends BaseStep<HttpInput, HttpOutput> {
  /**
   * Creates a new HTTP step instance
   * @param configBuilder - Builder for constructing axios request configurations
   * @param responseMapper - Mapper for transforming axios responses into step output
   */
  constructor(
    readonly configBuilder: HttpRequestConfigBuilder = new HttpRequestConfigBuilder(),
    readonly responseMapper: HttpResponseMapper = new HttpResponseMapper()
  ) {
    super(StepIds.HTTP);
  }

  /**
   * Returns the input validation schema
   * @returns Zod schema for validating input
   */
  getInputSchema() {
    return HttpInputSchema;
  }

  /**
   * Executes the HTTP request operation
   * @param input - HTTP request configuration including URL, method, and options
   * @param _context - Step execution context with logger
   * @returns Result containing response status, data, and headers
   */
  protected async run(input: HttpInput, _context: IStepContext): Promise<StepResult<HttpOutput>> {
    try {
      return await this.executeHttpRequest(input, _context);
    } catch (error) {
      return this.responseMapper.convertErrorToResult(error);
    }
  }

  /**
   * Creates a step result with success status and data
   * @param isSuccess - Whether the operation succeeded
   * @param output - HTTP response output
   * @returns Step result with appropriate success flag
   */
  private createResult(isSuccess: boolean, output: HttpOutput): StepResult<HttpOutput> {
    return {
      data: output,
      success: isSuccess,
    };
  }

  /**
   * Performs the complete HTTP request with configuration and response mapping
   * @param input - HTTP request configuration
   * @param context - Step execution context with logger
   * @returns Successful result with HTTP response data
   */
  private async executeHttpRequest(
    input: HttpInput,
    context: IStepContext
  ): Promise<StepResult<HttpOutput>> {
    const config = this.configBuilder.buildRequestConfig(input);
    context.logger.debug({ config }, "Making HTTP request");

    const response = await this.sendRequest(config);
    const output = this.responseMapper.mapResponseToOutput(response);
    const success = this.responseMapper.isSuccessStatus(response.status);

    return this.createResult(success, output);
  }

  /**
   * Sends an HTTP request using axios
   * @param config - Axios request configuration
   * @returns Axios response object
   */
  private async sendRequest(config: AxiosRequestConfig): Promise<AxiosResponse> {
    return axios(config);
  }
}
