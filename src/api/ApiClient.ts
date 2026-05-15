import type { APIRequestContext, APIResponse } from '@playwright/test';
import { expect } from '@playwright/test';
import { z, ZodSchema } from 'zod';

// Thin wrapper around Playwright's APIRequestContext that adds: - response-status assertion with a useful failure message - schema-based body validation via Zod (replaces fragile `JSON.stringify(...).includes(key)` checks from the legacy framework)
export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  async get(path: string, init?: { params?: Record<string, string | number> }): Promise<APIResponse> {
    return this.request.get(path, { params: init?.params });
  }

  async post<T>(path: string, body: T): Promise<APIResponse> {
    return this.request.post(path, { data: body });
  }

  async put<T>(path: string, body: T): Promise<APIResponse> {
    return this.request.put(path, { data: body });
  }

  async delete(path: string): Promise<APIResponse> {
    return this.request.delete(path);
  }

  async expectOk(response: APIResponse): Promise<void> {
    if (!response.ok()) {
      const body = await response.text().catch(() => '<no body>');
      expect(
        response.ok(),
        `Expected 2xx response but got ${response.status()} for ${response.url()}:\n${body}`,
      ).toBe(true);
    }
  }

  async parseAndValidate<T extends ZodSchema>(
    response: APIResponse,
    schema: T,
  ): Promise<z.infer<T>> {
    const json: unknown = await response.json();
    const result = schema.safeParse(json);
    if (!result.success) {
      throw new Error(
        `Response did not match schema for ${response.url()}:\n${result.error.toString()}\nBody: ${JSON.stringify(json)}`,
      );
    }
    return result.data;
  }
}
