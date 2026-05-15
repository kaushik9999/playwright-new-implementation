import { Client, type QueryResult, type QueryResultRow } from 'pg';

// Per-test Postgres client. The legacy framework stored the client on a module-level variable, which meant parallel tests stomped on each other's connections. Each `DbClient` instance owns its own connection; callers are responsible for `close()` (or use the `dbClient` fixture which handles lifecycle).
export class DbClient {
  private readonly client: Client;
  private connected = false;

  constructor(opts: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }) {
    this.client = new Client({
      host: opts.host,
      port: opts.port,
      user: opts.user,
      password: opts.password,
      database: opts.database,
    });
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    await this.client.connect();
    this.connected = true;
  }

  async query<R extends QueryResultRow = QueryResultRow>(
    text: string,
    params: ReadonlyArray<unknown> = [],
  ): Promise<QueryResult<R>> {
    if (!this.connected) {
      throw new Error(`DbClient.query called before connect().`);
    }
    return this.client.query<R>(text, params as unknown[]);
  }

  async close(): Promise<void> {
    if (!this.connected) return;
    await this.client.end();
    this.connected = false;
  }
}
