import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { z } from "zod";
import { BaseStep, IStepContext, StepResult } from "@repo/core";

export const HttpInputSchema = z.object({
  url: z.string().url("Valid URL is required"),
  method: z
    .enum(["GET", "POST", "PUT", "DELETE", "PATCH"])
    .optional()
    .default("GET"),
  headers: z.record(z.string()).optional(),
  data: z.any().optional(),
  params: z.record(z.string()).optional(),
  timeout: z.number().int().positive().optional().default(30000),
});

export type HttpInput = z.infer<typeof HttpInputSchema>;

export interface HttpOutput {
  status: number;
  statusText: string;
  data: any;
  headers: Record<string, string>;
}

/**
 * HttpStep makes HTTP requests using axios
 * Implements Factory pattern for creating requests
 */
export class HttpStep extends BaseStep<HttpInput, HttpOutput> {
  constructor() {
    super("HttpStep");
  }

  protected async run(
    input: HttpInput,
    _context: IStepContext
  ): Promise<StepResult<HttpOutput>> {
    try {
      const config = this.createRequestConfig(input);
      _context.logger.debug({ config }, "Making HTTP request");

      const response: AxiosResponse = await axios(config);

      return {
        success: this.isSuccessStatus(response.status),
        data: this.createHttpOutput(response),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  private createRequestConfig(input: HttpInput): AxiosRequestConfig {
    const { url, method, headers, data, params, timeout } = input;
    return {
      url,
      method,
      headers,
      data,
      params,
      timeout,
      validateStatus: () => true, // Don't throw on any status
    };
  }

  private isSuccessStatus(status: number): boolean {
    return status >= 200 && status < 300;
  }

  private createHttpOutput(response: AxiosResponse): HttpOutput {
    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers as Record<string, string>,
    };
  }
}
