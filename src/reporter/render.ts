import type { ReportData } from './types';

// Render a self-contained HTML report. The output has no external dependencies (no CDN, no fonts to fetch) so it remains usable as a CI artifact, an email attachment, or an offline viewer.
export function renderHtml(data: ReportData): string {
  const dataJson = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(data.meta.title)}</title>
<style>${CSS}</style>
</head>
<body>
<header class="topbar">
  <div class="topbar__title">
    <h1>${escapeHtml(data.meta.title)}</h1>
    <div class="topbar__meta">
      <span>env <b>${escapeHtml(data.meta.env)}</b></span>
      <span>shard <b>${escapeHtml(data.meta.shard)}</b></span>
      <span>${formatDuration(data.meta.durationMs)}</span>
      <span>Playwright ${escapeHtml(data.meta.playwrightVersion)}</span>
    </div>
  </div>
  <div class="summary" id="summary"></div>
</header>

<section class="controls">
  <label class="control">
    <span>Chart</span>
    <select id="chartType">
      <option value="pie">Status distribution (pie)</option>
      <option value="bar">Pass / fail per project (bar)</option>
      <option value="line">Test duration sequence (line)</option>
      <option value="trend">Pass rate across runs (trend)</option>
    </select>
  </label>
  <label class="control">
    <span>Project</span>
    <select id="filterProject"><option value="">All</option></select>
  </label>
  <label class="control">
    <span>Status</span>
    <select id="filterStatus">
      <option value="">All</option>
      <option value="passed">Passed</option>
      <option value="failed">Failed</option>
      <option value="flaky">Flaky</option>
      <option value="skipped">Skipped</option>
      <option value="timedOut">Timed out</option>
    </select>
  </label>
  <label class="control">
    <span>Tag</span>
    <select id="filterTag"><option value="">All</option></select>
  </label>
  <label class="control control--grow">
    <span>Search</span>
    <input type="search" id="filterSearch" placeholder="filter by test name…">
  </label>
</section>

<section class="chart-panel">
  <div id="chart"></div>
  <ul class="legend" id="legend"></ul>
</section>

<section class="results" id="results"></section>

<script>const REPORT = ${dataJson};\n${SCRIPT}</script>
</body>
</html>`;
}

// ─── helpers ────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const r = (s - m * 60).toFixed(0);
  return `${m}m ${r}s`;
}

// ─── inlined stylesheet ─────────────────────────────────────────────

const CSS = `
:root {
  --bg: #fafafa;
  --card: #ffffff;
  --border: #e5e7eb;
  --text: #111827;
  --muted: #6b7280;
  --accent: #2563eb;
  --passed: #16a34a;
  --failed: #dc2626;
  --flaky: #ca8a04;
  --skipped: #9ca3af;
  --timedOut: #c2410c;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px; line-height: 1.4;
}
h1, h2, h3 { margin: 0; }
b { font-weight: 600; }

.topbar {
  background: var(--card); border-bottom: 1px solid var(--border);
  padding: 16px 24px; display: flex; flex-direction: column; gap: 12px;
}
.topbar__title h1 { font-size: 18px; font-weight: 600; }
.topbar__meta { color: var(--muted); font-size: 12px; display: flex; gap: 16px; margin-top: 4px; flex-wrap: wrap; }
.topbar__meta b { color: var(--text); }

.summary { display: flex; gap: 8px; flex-wrap: wrap; }
.chip {
  background: var(--card); border: 1px solid var(--border); border-radius: 8px;
  padding: 10px 14px; display: flex; flex-direction: column; gap: 2px; min-width: 84px;
}
.chip__num { font-size: 18px; font-weight: 600; line-height: 1.1; }
.chip__label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
.chip--passed .chip__num { color: var(--passed); }
.chip--failed .chip__num { color: var(--failed); }
.chip--flaky  .chip__num { color: var(--flaky); }
.chip--skipped .chip__num { color: var(--skipped); }
.chip--timedOut .chip__num { color: var(--timedOut); }

.controls {
  display: flex; gap: 12px; padding: 16px 24px; flex-wrap: wrap;
  background: var(--card); border-bottom: 1px solid var(--border);
}
.control { display: flex; flex-direction: column; gap: 4px; min-width: 160px; }
.control--grow { flex: 1 1 240px; }
.control span { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
.control select, .control input {
  border: 1px solid var(--border); background: var(--bg); border-radius: 6px;
  padding: 8px 10px; font-size: 14px; color: var(--text); font-family: inherit;
}
.control select:focus, .control input:focus { outline: none; border-color: var(--accent); }

.chart-panel {
  display: flex; gap: 24px; align-items: center; padding: 24px;
  background: var(--card); border-bottom: 1px solid var(--border);
}
#chart { flex: 0 0 auto; }
#chart svg { display: block; }
.legend { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.legend li { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.legend__swatch { width: 12px; height: 12px; border-radius: 3px; flex: 0 0 12px; }
.legend__label { color: var(--muted); }
.legend__value { color: var(--text); font-weight: 600; margin-left: auto; }

.results { padding: 16px 24px 32px; }
.file {
  background: var(--card); border: 1px solid var(--border); border-radius: 8px;
  margin-bottom: 12px; overflow: hidden;
}
.file__header {
  padding: 12px 16px; display: flex; align-items: center; gap: 8px; cursor: pointer;
  font-weight: 600; user-select: none;
}
.file__header:hover { background: var(--bg); }
.file__caret { color: var(--muted); transition: transform 0.15s; }
.file--open .file__caret { transform: rotate(90deg); }
.file__count { color: var(--muted); font-weight: 400; margin-left: 6px; }
.file__body { display: none; }
.file--open .file__body { display: block; }

.test {
  border-top: 1px solid var(--border); padding: 10px 16px 10px 44px;
  position: relative; cursor: pointer; user-select: none;
}
.test:hover { background: var(--bg); }
.test__num {
  position: absolute; left: 12px; top: 12px; color: var(--muted);
  font-variant-numeric: tabular-nums; font-size: 12px; width: 24px; text-align: right;
}
.test__row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.test__status {
  display: inline-flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; border-radius: 50%; flex: 0 0 16px; color: #fff;
  font-size: 11px; font-weight: 700;
}
.test__status--passed { background: var(--passed); }
.test__status--failed { background: var(--failed); }
.test__status--flaky  { background: var(--flaky); }
.test__status--skipped { background: var(--skipped); }
.test__status--timedOut { background: var(--timedOut); }
.test__title { font-weight: 500; }
.test__meta { color: var(--muted); font-size: 12px; margin-left: auto; display: flex; gap: 12px; }
.test__tags { display: flex; gap: 4px; flex-wrap: wrap; }
.test__tag {
  background: var(--bg); border: 1px solid var(--border); border-radius: 4px;
  padding: 0 6px; font-size: 11px; color: var(--muted);
}

.test__detail {
  margin-top: 10px; padding: 12px 12px 12px 0; display: none;
  border-left: 2px solid var(--border); padding-left: 12px;
}
.test--open .test__detail { display: block; }
.test--open { background: var(--bg); }

.error {
  background: #fef2f2; border-left: 3px solid var(--failed); padding: 10px 12px;
  border-radius: 4px; margin: 6px 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: pre-wrap; font-size: 12px; color: #7f1d1d;
}
.steps, .steps ul { list-style: none; padding: 0; margin: 0; }
.steps > li { padding: 0; margin: 4px 0; }
.steps li { display: block; }

.step-row {
  display: flex; gap: 10px; padding: 4px 6px; align-items: baseline;
  border-radius: 4px; user-select: none;
}
.step-row--clickable { cursor: pointer; }
.step-row--clickable:hover { background: #f8fafc; }
.step-caret {
  width: 12px; color: var(--muted); flex: 0 0 12px;
  transition: transform .1s ease;
  display: inline-block; text-align: center;
}
.step-caret--leaf { visibility: hidden; }
.step-row.open > .step-caret { transform: rotate(90deg); }
.step-num { color: var(--muted); width: 44px; flex: 0 0 44px; font-variant-numeric: tabular-nums; }
.step-title { flex: 1; }
.step-title--testStep { font-weight: 600; }
.step-title--pwApi, .step-title--expect, .step-title--hook, .step-title--fixture {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px;
  color: var(--muted); font-weight: 400;
}
.step-cat {
  font-size: 10px; padding: 1px 6px; border-radius: 999px;
  background: #eef2ff; color: #3730a3; text-transform: uppercase; letter-spacing: .04em;
}
.step-cat--pwApi   { background: #ecfeff; color: #0e7490; }
.step-cat--expect  { background: #f5f3ff; color: #6d28d9; }
.step-cat--hook    { background: #f1f5f9; color: #475569; }
.step-cat--fixture { background: #f1f5f9; color: #475569; }
.step-duration { color: var(--muted); font-variant-numeric: tabular-nums; font-size: 12px; }
.step-row.failed .step-title { color: var(--failed); }
.step-li { list-style: none; }
.step-children { padding-left: 26px; border-left: 1px dashed var(--border); margin-left: 14px; display: none; }
.step-li.open > .step-children { display: block; }
.step-li.open > .step-row > .step-caret { transform: rotate(90deg); }

.attachments { display: flex; flex-direction: column; gap: 8px; margin: 8px 0; }
.attachment {
  background: var(--card); border: 1px solid var(--border); border-radius: 6px;
  padding: 10px 12px;
}
.attachment__head { font-size: 12px; color: var(--muted); margin-bottom: 6px; }
.attachment img { max-width: 100%; border-radius: 4px; display: block; }
.attachment video { max-width: 100%; border-radius: 4px; display: block; }
.attachment a { color: var(--accent); text-decoration: none; }
.attachment a:hover { text-decoration: underline; }

.section-label {
  font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em;
  margin: 12px 0 4px;
}
.empty { padding: 40px; text-align: center; color: var(--muted); }
`;

// ─── inlined client script ──────────────────────────────────────────

const SCRIPT = `
(function () {
  const STATUS_COLOR = {
    passed: getCss('--passed'), failed: getCss('--failed'),
    flaky:  getCss('--flaky'),  skipped: getCss('--skipped'),
    timedOut: getCss('--timedOut'),
  };
  const STATUS_LABEL = {
    passed: 'Passed', failed: 'Failed', flaky: 'Flaky',
    skipped: 'Skipped', timedOut: 'Timed out',
  };

  function getCss(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // populate filter dropdowns
  for (const p of REPORT.projects) addOption('filterProject', p);
  for (const t of REPORT.tags) addOption('filterTag', t);

  function addOption(id, value) {
    const opt = document.createElement('option');
    opt.value = value; opt.textContent = value;
    document.getElementById(id).appendChild(opt);
  }

  const state = {
    chart: 'pie',
    project: '', status: '', tag: '', search: '',
  };

  function filtered() {
    const search = state.search.toLowerCase();
    return REPORT.fileGroups.flatMap(function (g) { return g.tests; }).filter(function (t) {
      if (state.project && t.project !== state.project) return false;
      if (state.status && t.status !== state.status) return false;
      if (state.tag && !t.tags.includes(state.tag)) return false;
      if (search && !t.fullTitle.toLowerCase().includes(search)) return false;
      return true;
    });
  }

  function renderSummary(tests) {
    const counts = { total: tests.length, passed: 0, failed: 0, flaky: 0, skipped: 0, timedOut: 0 };
    tests.forEach(function (t) { counts[t.status]++; });
    const completed = counts.total - counts.skipped;
    const passRate = completed === 0 ? 0 : Math.round((counts.passed + counts.flaky) / completed * 100);
    const chips = [
      ['total',   counts.total,   'Total'],
      ['passed',  counts.passed,  'Passed'],
      ['failed',  counts.failed,  'Failed'],
      ['flaky',   counts.flaky,   'Flaky'],
      ['skipped', counts.skipped, 'Skipped'],
      ['',        passRate + '%', 'Pass rate'],
    ];
    const html = chips.map(function (c) {
      return '<div class="chip' + (c[0] ? ' chip--' + c[0] : '') + '">' +
             '<span class="chip__num">' + c[1] + '</span>' +
             '<span class="chip__label">' + c[2] + '</span></div>';
    }).join('');
    document.getElementById('summary').innerHTML = html;
  }

  // ─── chart renderers ─────────────────────────────────────────────
  function renderChart(tests) {
    const host = document.getElementById('chart');
    const legend = document.getElementById('legend');
    host.innerHTML = ''; legend.innerHTML = '';
    // Trend reads from REPORT.trend (cross-run history), not the
    // filtered tests of the current run.
    if (state.chart === 'trend') return renderTrend(host, legend);
    if (tests.length === 0) {
      host.innerHTML = '<div class="empty">No tests match the current filters.</div>';
      return;
    }
    if (state.chart === 'pie')  return renderPie(tests, host, legend);
    if (state.chart === 'bar')  return renderBar(tests, host, legend);
    if (state.chart === 'line') return renderLine(tests, host, legend);
  }

  function renderPie(tests, host, legend) {
    const counts = {};
    ['passed','failed','flaky','skipped','timedOut'].forEach(function (s) { counts[s] = 0; });
    tests.forEach(function (t) { counts[t.status]++; });
    const total = tests.length;
    const cx = 110, cy = 110, r = 100;
    let angle = -Math.PI / 2;
    const paths = [];
    Object.keys(counts).forEach(function (status) {
      const n = counts[status];
      if (n === 0) return;
      const slice = (n / total) * Math.PI * 2;
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      angle += slice;
      const x2 = cx + r * Math.cos(angle);
      const y2 = cy + r * Math.sin(angle);
      const large = slice > Math.PI ? 1 : 0;
      const d = 'M ' + cx + ' ' + cy + ' L ' + x1 + ' ' + y1 +
                ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2 + ' ' + y2 + ' Z';
      paths.push('<path d="' + d + '" fill="' + STATUS_COLOR[status] + '"></path>');
      legend.insertAdjacentHTML('beforeend',
        '<li><span class="legend__swatch" style="background:' + STATUS_COLOR[status] + '"></span>' +
        '<span class="legend__label">' + STATUS_LABEL[status] + '</span>' +
        '<span class="legend__value">' + n + ' (' + Math.round(n / total * 100) + '%)</span></li>');
    });
    host.innerHTML = '<svg width="220" height="220" viewBox="0 0 220 220">' + paths.join('') + '</svg>';
  }

  function renderBar(tests, host, legend) {
    const byProject = {};
    tests.forEach(function (t) {
      if (!byProject[t.project]) byProject[t.project] = { passed: 0, failed: 0, flaky: 0, skipped: 0, timedOut: 0 };
      byProject[t.project][t.status]++;
    });
    const projects = Object.keys(byProject).sort();
    const max = Math.max.apply(null, projects.map(function (p) {
      return byProject[p].passed + byProject[p].failed + byProject[p].flaky + byProject[p].skipped + byProject[p].timedOut;
    }));
    const W = 480, H = 240, padL = 40, padR = 10, padT = 10, padB = 40;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const barW = Math.min(60, chartW / projects.length - 8);
    const xStep = chartW / projects.length;
    const statuses = ['passed','flaky','failed','timedOut','skipped'];

    let svg = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">';
    // y-axis grid
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH * i / 4);
      const v = Math.round(max - (max * i / 4));
      svg += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="#e5e7eb" />';
      svg += '<text x="' + (padL - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" fill="#6b7280">' + v + '</text>';
    }
    projects.forEach(function (p, i) {
      const cx = padL + xStep * i + xStep / 2;
      const x = cx - barW / 2;
      let yCursor = padT + chartH;
      statuses.forEach(function (s) {
        const n = byProject[p][s];
        if (n === 0) return;
        const h = (n / max) * chartH;
        yCursor -= h;
        svg += '<rect x="' + x + '" y="' + yCursor + '" width="' + barW + '" height="' + h +
               '" fill="' + STATUS_COLOR[s] + '"><title>' + s + ': ' + n + '</title></rect>';
      });
      svg += '<text x="' + cx + '" y="' + (H - padB + 16) + '" text-anchor="middle" font-size="11" fill="#374151">' + p + '</text>';
    });
    svg += '</svg>';
    host.innerHTML = svg;

    statuses.forEach(function (s) {
      const total = projects.reduce(function (a, p) { return a + byProject[p][s]; }, 0);
      if (total === 0) return;
      legend.insertAdjacentHTML('beforeend',
        '<li><span class="legend__swatch" style="background:' + STATUS_COLOR[s] + '"></span>' +
        '<span class="legend__label">' + STATUS_LABEL[s] + '</span>' +
        '<span class="legend__value">' + total + '</span></li>');
    });
  }

  function renderLine(tests, host, legend) {
    const sorted = tests.slice().sort(function (a, b) { return a.index - b.index; });
    const W = 600, H = 240, padL = 40, padR = 10, padT = 10, padB = 30;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const max = Math.max.apply(null, sorted.map(function (t) { return t.duration; }));
    const points = sorted.map(function (t, i) {
      const x = padL + (sorted.length === 1 ? chartW / 2 : (chartW * i / (sorted.length - 1)));
      const y = padT + chartH - (t.duration / max) * chartH;
      return { x: x, y: y, t: t };
    });
    let svg = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">';
    // y axis
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH * i / 4);
      const v = Math.round(max - (max * i / 4));
      svg += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="#e5e7eb" />';
      svg += '<text x="' + (padL - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" fill="#6b7280">' + v + 'ms</text>';
    }
    // path
    const d = points.map(function (p, i) { return (i === 0 ? 'M ' : 'L ') + p.x + ' ' + p.y; }).join(' ');
    svg += '<path d="' + d + '" stroke="' + getCss('--accent') + '" fill="none" stroke-width="2" />';
    // dots colored by status
    points.forEach(function (p) {
      svg += '<circle cx="' + p.x + '" cy="' + p.y + '" r="3" fill="' + STATUS_COLOR[p.t.status] + '">' +
             '<title>' + p.t.fullTitle + ' — ' + p.t.duration + 'ms (' + p.t.status + ')</title></circle>';
    });
    svg += '</svg>';
    host.innerHTML = svg;
    legend.innerHTML =
      '<li><span class="legend__label">Tests</span><span class="legend__value">' + sorted.length + '</span></li>' +
      '<li><span class="legend__label">Max duration</span><span class="legend__value">' + max + 'ms</span></li>';
  }

  // Trend across the last N runs — uses REPORT.trend (history.json).
  function renderTrend(host, legend) {
    const trend = REPORT.trend || [];
    if (trend.length === 0) {
      host.innerHTML = '<div class="empty">No prior runs recorded yet. Trend appears after the second run.</div>';
      return;
    }
    const W = 600, H = 240, padL = 40, padR = 10, padT = 10, padB = 30;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const points = trend.map(function (e, i) {
      const rate = e.total === 0 ? 0 : Math.round(e.passRate * 100);
      const x = padL + (trend.length === 1 ? chartW / 2 : (chartW * i / (trend.length - 1)));
      const y = padT + chartH - (rate / 100) * chartH;
      return { x: x, y: y, e: e, rate: rate };
    });
    let svg = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">';
    // Y axis at 0/25/50/75/100% pass rate.
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH * i / 4);
      const v = 100 - (25 * i);
      svg += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="#e5e7eb" />';
      svg += '<text x="' + (padL - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" fill="#6b7280">' + v + '%</text>';
    }
    // Line path connecting pass-rate points.
    const d = points.map(function (p, i) { return (i === 0 ? 'M ' : 'L ') + p.x + ' ' + p.y; }).join(' ');
    svg += '<path d="' + d + '" stroke="' + getCss('--accent') + '" fill="none" stroke-width="2" />';
    // Dots — green if 100% pass, red if any failure, amber if flaky-only.
    points.forEach(function (p) {
      const color = p.e.failed > 0 ? getCss('--failed') :
                    p.e.flaky > 0 ? getCss('--flaky') :
                    getCss('--passed');
      const title = new Date(p.e.startedAt).toLocaleString() +
                    ' — ' + p.e.passed + '/' + p.e.total + ' passed' +
                    (p.e.failed > 0 ? ', ' + p.e.failed + ' failed' : '') +
                    (p.e.flaky > 0 ? ', ' + p.e.flaky + ' flaky' : '') +
                    ' (' + p.rate + '%)';
      svg += '<circle cx="' + p.x + '" cy="' + p.y + '" r="4" fill="' + color + '">' +
             '<title>' + title + '</title></circle>';
    });
    svg += '</svg>';
    host.innerHTML = svg;
    const latest = trend[trend.length - 1];
    const firstRate = trend[0].passRate * 100;
    const latestRate = latest.passRate * 100;
    const delta = latestRate - firstRate;
    const deltaText = (delta === 0) ? 'no change' :
                      (delta > 0)  ? '+' + delta.toFixed(1) + 'pp' :
                                     delta.toFixed(1) + 'pp';
    legend.innerHTML =
      '<li><span class="legend__label">Runs recorded</span><span class="legend__value">' + trend.length + '</span></li>' +
      '<li><span class="legend__label">Latest pass rate</span><span class="legend__value">' + latestRate.toFixed(1) + '%</span></li>' +
      '<li><span class="legend__label">Window change</span><span class="legend__value">' + deltaText + '</span></li>';
  }

  // ─── test list ──────────────────────────────────────────────────
  function renderResults(tests) {
    const host = document.getElementById('results');
    if (tests.length === 0) {
      host.innerHTML = '<div class="empty">No tests match the current filters.</div>';
      return;
    }
    const byFile = {};
    tests.forEach(function (t) { (byFile[t.file] = byFile[t.file] || []).push(t); });
    const files = Object.keys(byFile).sort();
    host.innerHTML = files.map(function (file) { return renderFile(file, byFile[file]); }).join('');
  }

  function renderFile(file, tests) {
    return '<section class="file file--open" data-file="' + esc(file) + '">' +
           '<header class="file__header"><span class="file__caret">▸</span>' + esc(file) +
           '<span class="file__count">(' + tests.length + ')</span></header>' +
           '<div class="file__body">' + tests.map(renderTest).join('') + '</div></section>';
  }

  function renderTest(t, i) {
    const detail = [
      t.errors.length > 0 ? '<div class="section-label">Errors</div>' + t.errors.map(function (e) {
        return '<div class="error">' + esc(e) + '</div>';
      }).join('') : '',
      t.steps.length > 0 ? '<div class="section-label">Steps</div><ul class="steps">' +
        t.steps.map(renderStep).join('') + '</ul>' : '',
      t.attachments.length > 0 ? '<div class="section-label">Attachments</div><div class="attachments">' +
        t.attachments.map(renderAttachment).join('') + '</div>' : '',
    ].join('');

    return '<article class="test" data-id="' + esc(t.id) + '">' +
           '<div class="test__num">' + (i + 1) + '.</div>' +
           '<div class="test__row">' +
           '<span class="test__status test__status--' + t.status + '" title="' + t.status + '">' + statusGlyph(t.status) + '</span>' +
           '<span class="test__title">' + esc(t.displayTitle || t.fullTitle) + '</span>' +
           '<span class="test__tags">' + t.tags.map(function (tg) { return '<span class="test__tag">' + esc(tg) + '</span>'; }).join('') + '</span>' +
           '<span class="test__meta">' +
           '<span>' + esc(t.project) + '</span>' +
           '<span>' + t.duration + 'ms</span>' +
           (t.retries > 0 ? '<span>' + t.retries + ' retry</span>' : '') +
           '</span></div>' +
           '<div class="test__detail">' + detail + '</div></article>';
  }

  function renderStep(s) {
    var hasChildren = s.children && s.children.length > 0;
    // Top-level test.step entries (and their failed parents) open by default.
    var openByDefault = s.category === 'test.step' || s.status === 'failed';
    var liClass = 'step-li' + (openByDefault && hasChildren ? ' open' : '');
    var rowClass = 'step-row step-row--' + s.category.replace(/[^a-z]/gi, '') +
                   (s.status === 'failed' ? ' failed' : '');
    var titleClass = 'step-title step-title--' + ({
      'test.step': 'testStep', 'pw:api': 'pwApi', 'expect': 'expect',
      'hook': 'hook', 'fixture': 'fixture', 'other': 'other'
    }[s.category] || 'other');
    var catClass = 'step-cat step-cat--' + ({
      'test.step': 'testStep', 'pw:api': 'pwApi', 'expect': 'expect',
      'hook': 'hook', 'fixture': 'fixture', 'other': 'other'
    }[s.category] || 'other');
    var catLabel = s.category === 'test.step' ? 'STEP' :
                   s.category === 'pw:api' ? 'API' :
                   s.category === 'expect' ? 'EXPECT' :
                   s.category.toUpperCase();

    var rowHtml =
      '<div class="' + rowClass + (hasChildren ? ' step-row--clickable' : '') + '">' +
        '<span class="step-caret' + (hasChildren ? '' : ' step-caret--leaf') + '">▸</span>' +
        '<span class="step-num">' + s.number + '</span>' +
        '<span class="' + catClass + '">' + catLabel + '</span>' +
        '<span class="' + titleClass + '">' + esc(s.title) + '</span>' +
        '<span class="step-duration">' + s.duration + 'ms</span>' +
      '</div>';
    var errorHtml = s.error ? '<div class="error">' + esc(s.error) + '</div>' : '';
    var childrenHtml = hasChildren
      ? '<ul class="step-children">' + s.children.map(renderStep).join('') + '</ul>'
      : '';
    return '<li class="' + liClass + '">' + rowHtml + errorHtml + childrenHtml + '</li>';
  }

  function renderAttachment(a) {
    if (a.kind === 'screenshot') {
      return '<div class="attachment"><div class="attachment__head">📸 ' + esc(a.name) + '</div>' +
             '<img src="' + esc(a.path) + '" loading="lazy" alt="' + esc(a.name) + '"></div>';
    }
    if (a.kind === 'video') {
      return '<div class="attachment"><div class="attachment__head">🎬 ' + esc(a.name) + '</div>' +
             '<video src="' + esc(a.path) + '" controls preload="metadata"></video></div>';
    }
    if (a.kind === 'trace') {
      return '<div class="attachment"><div class="attachment__head">🧵 ' + esc(a.name) + '</div>' +
             '<a href="' + esc(a.path) + '" download>Download trace.zip</a> — open with ' +
             '<a href="https://trace.playwright.dev/" target="_blank">trace.playwright.dev</a> or ' +
             '<code>npx playwright show-trace ' + esc(a.path) + '</code></div>';
    }
    return '<div class="attachment"><div class="attachment__head">📎 ' + esc(a.name) + '</div>' +
           '<a href="' + esc(a.path) + '" target="_blank">' + esc(a.path) + '</a></div>';
  }

  function statusGlyph(s) {
    return s === 'passed' ? '✓' : s === 'failed' ? '✗' : s === 'flaky' ? '!' : s === 'timedOut' ? '⏱' : '–';
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ─── wiring ─────────────────────────────────────────────────────
  function update() {
    const tests = filtered();
    renderSummary(tests);
    renderChart(tests);
    renderResults(tests);
  }

  document.getElementById('chartType').addEventListener('change', function (e) {
    state.chart = e.target.value; renderChart(filtered());
  });
  document.getElementById('filterProject').addEventListener('change', function (e) { state.project = e.target.value; update(); });
  document.getElementById('filterStatus').addEventListener('change', function (e) { state.status = e.target.value; update(); });
  document.getElementById('filterTag').addEventListener('change', function (e) { state.tag = e.target.value; update(); });
  document.getElementById('filterSearch').addEventListener('input', function (e) { state.search = e.target.value; update(); });

  document.getElementById('results').addEventListener('click', function (e) {
    // Step rows with children: clicking the row toggles the parent <li>'s
    // open state, which the CSS uses to show/hide the children block.
    const stepRow = e.target.closest('.step-row--clickable');
    if (stepRow) { stepRow.parentElement.classList.toggle('open'); return; }
    const fileHeader = e.target.closest('.file__header');
    if (fileHeader) { fileHeader.parentElement.classList.toggle('file--open'); return; }
    const test = e.target.closest('.test');
    if (test) test.classList.toggle('test--open');
  });

  update();
})();
`;
