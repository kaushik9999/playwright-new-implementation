// Data model emitted by CustomReporter and consumed by the HTML template. Kept in a separate file so both producer (reporter) and consumer (render) can be type-checked against the same shape.
export type TestStatus = 'passed' | 'failed' | 'flaky' | 'skipped' | 'timedOut';
export type StepStatus = 'passed' | 'failed' | 'skipped';
export type AttachmentKind = 'screenshot' | 'video' | 'trace' | 'other';

export interface StepData {
  // Hierarchical numbering: "1", "1.2", "1.2.3", …
  number: string;
  title: string;
  // Origin of the step. `test.step` entries are the user-named high-level descriptions; `pw:api` and `expect` are the technical sub-steps Playwright records under them.
  category: 'test.step' | 'pw:api' | 'expect' | 'hook' | 'fixture' | 'other';
  duration: number;
  status: StepStatus;
  error?: string;
  children: StepData[];
}

export interface AttachmentData {
  name: string;
  contentType: string;
  // path relative to the report HTML file
  path: string;
  kind: AttachmentKind;
}

export interface TestData {
  id: string;
  index: number;
  // The `test('...')` title — the name of the test case itself.
  title: string;
  // Human-readable path through `describe` blocks down to the test: "Checkout @smoke › end-to-end purchase". No file path, no project.
  displayTitle: string;
  // Full path including project & file — kept for search/grep, not for display.
  fullTitle: string;
  file: string;
  line: number;
  project: string;
  tags: string[];
  status: TestStatus;
  duration: number;
  retries: number;
  errors: string[];
  steps: StepData[];
  attachments: AttachmentData[];
}

export interface FileGroup {
  file: string;
  tests: TestData[];
}

export interface ReportSummary {
  total: number;
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  timedOut: number;
  passRate: number;
}

export interface TrendEntry {
  startedAt: string;
  durationMs: number;
  total: number;
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  passRate: number;
}

export interface ReportData {
  meta: {
    title: string;
    env: string;
    shard: string;
    startedAt: string;
    finishedAt: string;
    durationMs: number;
    playwrightVersion: string;
  };
  summary: ReportSummary;
  projects: string[];
  tags: string[];
  fileGroups: FileGroup[];
  // Last N run summaries (oldest → newest). Drives the trend chart.
  trend: TrendEntry[];
}
