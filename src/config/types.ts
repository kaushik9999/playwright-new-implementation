export type EnvName = 'qa' | 'dev' | 'staging';

export interface EnvConfig {
  readonly name: EnvName;
  readonly baseURL: string;
  readonly apiBaseURL: string;
  readonly defaultTimeout: number;
  readonly navigationTimeout: number;
  readonly expectTimeout: number;
}

export interface Secrets {
  readonly username: string;
  readonly password: string;
  readonly db: {
    readonly host: string;
    readonly port: number;
    readonly user: string;
    readonly password: string;
    readonly database: string;
  } | null;
}
