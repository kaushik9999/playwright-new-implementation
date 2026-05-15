import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { version as playwrightVersion } from '@playwright/test/package.json';
import type {
  AttachmentData,
  AttachmentKind,
  ReportData,
  StepData,
  TestData,
  TestStatus,
  TrendEntry,
} from './types';
import { renderHtml } from './render';

interface CustomReporterOptions {
  outputDir?: string;
  title?: string;
}

const TAG_RE = /@[\w-]+/g;

export default class CustomReporter implements Reporter {
  private startTime = 0;
  private suite!: Suite;
  private readonly outputDir: string;
  private readonly title: string;

  constructor(options: CustomReporterOptions = {}) {
    this.outputDir = path.resolve(
      process.cwd(),
      options.outputDir ?? 'reports/custom',
      `shard-${process.env.SHARD_INDEX ?? 'local'}`,
    );
    this.title = options.title ?? 'Playwright Test Report';
  }

  onBegin(_config: FullConfig, suite: Suite): void {
    this.startTime = Date.now();
    this.suite = suite;
  }

  async onEnd(_result: FullResult): Promise<void> {
    const finishedAt = Date.now();
    const tests = this.collectTests();
    const fileGroups = this.groupByFile(tests);
    const summary = this.summarize(tests);
    const startedIso = new Date(this.startTime).toISOString();

    // Trend history: append this run's summary, cap to last 30 entries.
    const trend = this.appendTrend({
      startedAt: startedIso,
      durationMs: finishedAt - this.startTime,
      total: summary.total,
      passed: summary.passed,
      failed: summary.failed,
      flaky: summary.flaky,
      skipped: summary.skipped,
      passRate: summary.passRate,
    });

    const data: ReportData = {
      meta: {
        title: this.title,
        env: process.env.ENV ?? 'unknown',
        shard: process.env.SHARD_INDEX ?? 'local',
        startedAt: startedIso,
        finishedAt: new Date(finishedAt).toISOString(),
        durationMs: finishedAt - this.startTime,
        playwrightVersion,
      },
      summary,
      projects: [...new Set(tests.map((t) => t.project))].sort(),
      tags: [...new Set(tests.flatMap((t) => t.tags))].sort(),
      fileGroups,
      trend,
    };

    await fs.promises.mkdir(this.outputDir, { recursive: true });
    const outFile = path.join(this.outputDir, 'index.html');
    await fs.promises.writeFile(outFile, renderHtml(data), 'utf8');

    // eslint-disable-next-line no-console
    console.log(`\n[custom-reporter] Report written: ${outFile}`);
  }

  // Read existing history (if any), append this run, write back capped.
  // History lives one level above the shard dir so all shards see the
  // same file; in real shard merges you'd dedupe by `startedAt`.
  private appendTrend(entry: TrendEntry): TrendEntry[] {
    const historyFile = path.join(path.dirname(this.outputDir), 'history.json');
    const MAX = 30;
    let prior: TrendEntry[] = [];
    try {
      if (fs.existsSync(historyFile)) {
        const raw = fs.readFileSync(historyFile, 'utf8');
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) prior = parsed as TrendEntry[];
      }
    } catch {
      // Corrupt or unreadable history — start fresh rather than blow up.
      prior = [];
    }
    const updated = [...prior, entry].slice(-MAX);
    try {
      fs.mkdirSync(path.dirname(historyFile), { recursive: true });
      fs.writeFileSync(historyFile, JSON.stringify(updated, null, 2), 'utf8');
    } catch {
      // Swallow write errors — reporting must not crash the run.
    }
    return updated;
  }

  // ─── data conversion ───────────────────────────────────────────────

  private collectTests(): TestData[] {
    const tests: TestData[] = [];
    let counter = 0;

    for (const testCase of this.suite.allTests()) {
      const lastResult = testCase.results.at(-1);
      if (!lastResult) continue;

      const outcome = testCase.outcome();
      const status: TestStatus =
        outcome === 'expected'
          ? lastResult.status === 'timedOut'
            ? 'timedOut'
            : 'passed'
          : outcome === 'unexpected'
            ? lastResult.status === 'timedOut'
              ? 'timedOut'
              : 'failed'
            : outcome === 'flaky'
              ? 'flaky'
              : 'skipped';

      const projectName = testCase.parent.project()?.name ?? 'default';
      const fileRel = path.relative(process.cwd(), testCase.location.file);
      const fileAbs = testCase.location.file;
      const fileBase = path.basename(fileAbs);

      // titlePath() returns [rootTitle, projectName, fileLabel, ...describes, testTitle].
      // We strip the project + any segment that matches the file (across the
      // forms Playwright might use) so what's left is describe chain + title.
      const titleParts = testCase.titlePath().filter(Boolean);
      const cleanedParts = titleParts.filter(
        (p) => p !== projectName && p !== fileRel && p !== fileAbs && p !== fileBase,
      );
      const displayTitle = cleanedParts.join(' › ');
      const fullTitle = titleParts.join(' › ');

      tests.push({
        id: testCase.id,
        index: counter++,
        title: testCase.title,
        displayTitle,
        fullTitle,
        file: fileRel,
        line: testCase.location.line,
        project: projectName,
        tags: this.extractTags(testCase),
        status,
        duration: lastResult.duration,
        retries: testCase.results.length - 1,
        errors: lastResult.errors.map((e) => e.message ?? String(e)),
        steps: this.serializeSteps(lastResult.steps),
        attachments: this.mapAttachments(lastResult),
      });
    }

    return tests;
  }

  private extractTags(testCase: TestCase): string[] {
    const fromAnnotation = (testCase.tags ?? []) as string[];
    const fromTitle = (testCase.titlePath().join(' ').match(TAG_RE) ?? []) as string[];
    return [...new Set([...fromAnnotation, ...fromTitle])].sort();
  }

  // Preserve the step hierarchy that Playwright records. `test.step` entries are kept as top-level; the technical sub-steps Playwright emits underneath them (`pw:api` for locator actions, `expect` for assertions) become children. This is what lets the report show "high-level intent" with "technical detail buried under it". `hook` and `fixture` categories are skipped at the top level — they belong to setup/teardown, not the test body itself.
  private serializeSteps(
    steps: ReadonlyArray<TestStep>,
    prefix = '',
  ): StepData[] {
    const out: StepData[] = [];
    let i = 0;
    for (const step of steps) {
      const cat = this.classifyStepCategory(step.category);
      if (!cat) continue;
      // Skip hook/fixture noise at the outermost level.
      if (prefix === '' && (cat === 'hook' || cat === 'fixture')) continue;

      const number = prefix ? `${prefix}.${++i}` : String(++i);
      out.push({
        number,
        title: step.title,
        category: cat,
        duration: step.duration,
        status: step.error ? 'failed' : 'passed',
        error: step.error?.message,
        children: step.steps ? this.serializeSteps(step.steps, number) : [],
      });
    }
    return out;
  }

  private classifyStepCategory(c: string): StepData['category'] | null {
    if (c === 'test.step') return 'test.step';
    if (c === 'pw:api') return 'pw:api';
    if (c === 'expect') return 'expect';
    if (c === 'hook') return 'hook';
    if (c === 'fixture') return 'fixture';
    // Drop attach/etc. — they're noise in the report.
    return null;
  }

  private mapAttachments(result: TestResult): AttachmentData[] {
    const reportDir = this.outputDir;
    return result.attachments
      .filter((a) => !!a.path)
      .map((a) => {
        const abs = a.path!;
        return {
          name: a.name,
          contentType: a.contentType,
          path: path.relative(reportDir, abs),
          kind: this.classifyAttachment(a.name, a.contentType),
        };
      });
  }

  private classifyAttachment(name: string, contentType: string): AttachmentKind {
    if (contentType.startsWith('image/')) return 'screenshot';
    if (contentType.startsWith('video/')) return 'video';
    if (name === 'trace' || contentType === 'application/zip') return 'trace';
    return 'other';
  }

  private groupByFile(tests: TestData[]) {
    const map = new Map<string, TestData[]>();
    for (const t of tests) {
      const arr = map.get(t.file);
      if (arr) arr.push(t);
      else map.set(t.file, [t]);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([file, fileTests]) => ({ file, tests: fileTests }));
  }

  private summarize(tests: TestData[]) {
    const summary = {
      total: tests.length,
      passed: 0,
      failed: 0,
      flaky: 0,
      skipped: 0,
      timedOut: 0,
      passRate: 0,
    };
    for (const t of tests) {
      summary[t.status] += 1;
    }
    const completed = summary.total - summary.skipped;
    summary.passRate = completed === 0 ? 0 : (summary.passed + summary.flaky) / completed;
    return summary;
  }
}
