import type { EnvConfig } from '../types';

export const qa: EnvConfig = {
  name: 'qa',
  baseURL: 'https://www.saucedemo.com',
  apiBaseURL: 'https://jsonplaceholder.typicode.com',
  defaultTimeout: 30_000,
  navigationTimeout: 30_000,
  expectTimeout: 10_000,
};
