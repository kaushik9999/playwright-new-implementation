import * as fs from 'node:fs';
import * as path from 'node:path';
import { z } from 'zod';

// CSV-driven test data. Read + validated at module-load time so each row becomes a separate test in the spec file's `for...of` loop. Schema validation here is the production hedge: if a non-engineer edits the CSV and introduces a typo'd column or an unrecognized outcome, the test run fails fast with a clear Zod error instead of silently exercising the wrong path. Cheap insurance.
const LoginScenarioSchema = z.object({
  username: z.string().min(1),
  expectedOutcome: z.enum(['login_success', 'shows_lockout_banner']),
  notes: z.string(),
});

export type LoginScenario = z.infer<typeof LoginScenarioSchema>;

// Minimal CSV parser — handles unquoted, comma-separated values with a header row. Good enough when the data is engineer-owned and known not to contain commas/quotes in field values. If non-engineers will edit the file, swap this for `csv-parse` (proper RFC 4180 support).
function parseSimpleCsv(text: string): Array<Record<string, string>> {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));
  if (lines.length < 2) return [];

  const headers = lines[0]!.split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? '';
    });
    return row;
  });
}

function loadCsv<T>(relativePath: string, schema: z.ZodType<T>): T[] {
  const abs = path.resolve(__dirname, relativePath);
  const raw = fs.readFileSync(abs, 'utf-8');
  const rows = parseSimpleCsv(raw);
  return rows.map((row, i) => {
    const result = schema.safeParse(row);
    if (!result.success) {
      throw new Error(
        `${relativePath} row ${i + 2}: ${result.error.toString()}\nRow: ${JSON.stringify(row)}`,
      );
    }
    return result.data;
  });
}

export const loginScenarios: ReadonlyArray<LoginScenario> = loadCsv(
  'login-users.csv',
  LoginScenarioSchema,
);
