import { BaseStep, StepContext, StepResult } from '@repo/core';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { z } from 'zod';

export const HttpInputSchema = z.object({
  url: z.string().url('Valid URL is required'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional().default('GET'),
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
    super('HttpStep');
  }

  protected async run(
    input: HttpInput,
    _context: StepContext
  ): Promise<StepResult<HttpOutput>> {
    try {
      const { url, method, headers, data, params, timeout } = input;

      const config: AxiosRequestConfig = {
        url,
        method,
        headers,
        data,
        params,
        timeout,
        validateStatus: () => true, // Don't throw on any status
      };

      _context.logger.debug({ config }, 'Making HTTP request');

      const response: AxiosResponse = await axios(config);

      return {
        success: response.status >= 200 && response.status < 300,
        data: {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          headers: response.headers as Record<string, string>,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}
