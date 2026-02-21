/**
 * HACOY Future - Report Exporter
 *
 * Exports research reports to JSON, HTML, and Markdown formats.
 * Writes files to src/reports/ by default, or a user-specified directory.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const DEFAULT_DIR = new URL('.', import.meta.url).pathname;

export class ReportExporter {
  constructor(outputDir) {
    this.outputDir = outputDir || DEFAULT_DIR;
  }

  /** Export report in the given format(s). Returns array of written file paths. */
  async export(report, formats = ['json']) {
    await mkdir(this.outputDir, { recursive: true });

    const normalized = _normalize(report);
    const written = [];
    const stamp = _timestamp();

    for (const fmt of formats) {
      const path = await this._write(normalized, fmt, stamp);
      written.push(path);
    }

    return written;
  }

  async _write(report, format, stamp) {
    const builders = {
      json: () => this._toJSON(report),
      html: () => this._toHTML(report),
      md: () => this._toMarkdown(report),
    };

    const builder = builders[format];
    if (!builder) {
      throw new Error(`Unknown export format: "${format}". Use json, html, or md.`);
    }

    const ext = format === 'md' ? 'md' : format;
    const filename = `hacoy-report-${stamp}.${ext}`;
    const filepath = join(this.outputDir, filename);

    await writeFile(filepath, builder(), 'utf-8');
    return filepath;
  }

  // ── JSON ──────────────────────────────────────────────

  _toJSON(report) {
    return JSON.stringify(report, null, 2);
  }

  // ── Markdown ──────────────────────────────────────────

  _toMarkdown(report) {
    const lines = [];
    const push = (...l) => lines.push(...l);

    push(`# ${report.title}`);
    push(`**${report.subtitle}**`, '');
    push(`Generated: ${report.generatedAt}  `);
    push(`Execution: ${report.executionTime}`, '');

    // Executive Summary
    const es = report.executiveSummary;
    push('---', '## Executive Summary', '');
    push(`> ${es.vision}`, '');
    push(`**Overall Assessment:** ${es.overallAssessment}`, '');

    push('### Key Findings', '');
    for (const f of es.keyFindings) push(`- ${f}`);
    push('');

    push('### Critical Challenges', '');
    for (const c of es.criticalChallenges) push(`- ${c}`);
    push('');

    // Stats
    push('---', '## Research Statistics', '');
    push(`| Metric | Value |`);
    push(`|--------|-------|`);
    push(`| Total Findings | ${report.totalFindings} |`);
    push(`| High-Confidence Findings | ${report.highConfidenceFindings.length} |`);
    push('');

    push('### Findings by Agent', '');
    push('| Agent | Findings |');
    push('|-------|----------|');
    for (const [role, count] of Object.entries(report.findingsByAgent)) {
      push(`| ${role} | ${count} |`);
    }
    push('');

    // High-confidence findings
    if (report.highConfidenceFindings.length > 0) {
      push('---', '## High-Confidence Findings', '');
      for (const f of report.highConfidenceFindings) {
        push(`### ${f.topic}`);
        push(`**Agent:** ${f.agentRole} | **Confidence:** ${(f.confidence * 100).toFixed(0)}% | **Region:** ${f.region || 'Bavaria-wide'}`, '');
        push(f.summary, '');
        if (f.details) {
          _renderDetails(f.details, lines);
        }
        if (f.sources && f.sources.length > 0) {
          push(`**Sources:** ${f.sources.join(', ')}`, '');
        }
      }
    }

    // Agent Reports
    push('---', '## Agent Reports', '');
    for (const ar of report.agentReports) {
      push(`### ${ar.agent}`);
      push(`**Role:** ${ar.role} | **Findings:** ${ar.totalFindings}`, '');
      for (const f of ar.findings) {
        push(`#### ${f.topic}`);
        push(`*Confidence: ${(f.confidence * 100).toFixed(0)}%*`, '');
        push(f.summary, '');
      }
    }

    // Next Steps
    push('---', '## Recommended Next Steps', '');
    push('| # | Action | Timeline | Owner |');
    push('|---|--------|----------|-------|');
    for (const s of report.recommendedNextSteps) {
      push(`| ${s.priority} | ${s.action} | ${s.timeline} | ${s.owner} |`);
    }
    push('');

    return lines.join('\n');
  }

  // ── HTML ──────────────────────────────────────────────

  _toHTML(report) {
    const es = report.executiveSummary;

    const agentSections = report.agentReports.map(ar => `
      <section class="agent-report">
        <h3>${_esc(ar.agent)}</h3>
        <p class="meta">${_esc(ar.role)} &mdash; ${ar.totalFindings} findings</p>
        ${ar.findings.map(f => `
          <div class="finding">
            <h4>${_esc(f.topic)}</h4>
            <span class="confidence">${(f.confidence * 100).toFixed(0)}%</span>
            <p>${_esc(f.summary)}</p>
          </div>
        `).join('')}
      </section>`).join('\n');

    const highConfSection = report.highConfidenceFindings.map(f => `
      <tr>
        <td>${_esc(f.topic)}</td>
        <td>${_esc(f.agentRole)}</td>
        <td>${(f.confidence * 100).toFixed(0)}%</td>
        <td>${_esc(f.region || 'Bavaria-wide')}</td>
        <td>${_esc(f.summary)}</td>
      </tr>`).join('\n');

    const stepsRows = report.recommendedNextSteps.map(s => `
      <tr>
        <td>${s.priority}</td>
        <td>${_esc(s.action)}</td>
        <td>${_esc(s.description)}</td>
        <td>${_esc(s.timeline)}</td>
        <td>${_esc(s.owner)}</td>
      </tr>`).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${_esc(report.title)}</title>
  <style>
    :root{--bg:#fafaf9;--fg:#1c1917;--accent:#92400e;--accent-light:#fef3c7;--border:#d6d3d1;--card:#ffffff}
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--fg);line-height:1.6;max-width:1100px;margin:0 auto;padding:2rem}
    h1{font-size:1.8rem;color:var(--accent);border-bottom:3px solid var(--accent);padding-bottom:.5rem;margin-bottom:.25rem}
    h2{font-size:1.4rem;margin:2rem 0 1rem;color:var(--accent)}
    h3{font-size:1.15rem;margin:1.5rem 0 .5rem}
    h4{font-size:1rem;margin:.75rem 0 .25rem}
    .subtitle{color:#78716c;margin-bottom:1.5rem}
    .meta-bar{display:flex;gap:2rem;font-size:.85rem;color:#78716c;margin-bottom:2rem}
    blockquote{border-left:4px solid var(--accent);padding:.75rem 1rem;background:var(--accent-light);margin:1rem 0;border-radius:0 6px 6px 0}
    .card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:1.25rem;margin:1rem 0}
    .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin:1rem 0}
    .stat{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:1rem;text-align:center}
    .stat .number{font-size:2rem;font-weight:700;color:var(--accent)}
    .stat .label{font-size:.85rem;color:#78716c}
    table{width:100%;border-collapse:collapse;margin:1rem 0;font-size:.9rem}
    th,td{text-align:left;padding:.6rem .75rem;border-bottom:1px solid var(--border)}
    th{background:#f5f5f4;font-weight:600;position:sticky;top:0}
    tr:hover{background:#fafaf9}
    .finding{border-left:3px solid var(--accent);padding:.5rem 1rem;margin:.5rem 0;background:var(--card);border-radius:0 6px 6px 0}
    .confidence{display:inline-block;background:var(--accent-light);color:var(--accent);font-weight:600;padding:.1rem .5rem;border-radius:4px;font-size:.8rem}
    .agent-report{margin:1.5rem 0}
    .agent-report .meta{font-size:.85rem;color:#78716c}
    ul.challenges li, ul.findings-list li{margin:.4rem 0}
    footer{margin-top:3rem;padding-top:1rem;border-top:1px solid var(--border);font-size:.8rem;color:#a8a29e;text-align:center}
  </style>
</head>
<body>
  <h1>${_esc(report.title)}</h1>
  <p class="subtitle">${_esc(report.subtitle)}</p>
  <div class="meta-bar">
    <span>Generated: ${_esc(report.generatedAt)}</span>
    <span>Execution: ${_esc(report.executionTime)}</span>
  </div>

  <h2>Executive Summary</h2>
  <blockquote>${_esc(es.vision)}</blockquote>
  <div class="card">
    <strong>Overall Assessment:</strong>
    <p>${_esc(es.overallAssessment)}</p>
  </div>

  <h3>Key Findings</h3>
  <ul class="findings-list">
    ${es.keyFindings.map(f => `<li>${_esc(f)}</li>`).join('\n    ')}
  </ul>

  <h3>Critical Challenges</h3>
  <ul class="challenges">
    ${es.criticalChallenges.map(c => `<li>${_esc(c)}</li>`).join('\n    ')}
  </ul>

  <h2>Research Statistics</h2>
  <div class="stats">
    <div class="stat"><div class="number">${report.totalFindings}</div><div class="label">Total Findings</div></div>
    <div class="stat"><div class="number">${report.highConfidenceFindings.length}</div><div class="label">High-Confidence</div></div>
    <div class="stat"><div class="number">${report.agentReports.length}</div><div class="label">Agents</div></div>
  </div>

  <h3>Findings by Agent</h3>
  <table>
    <thead><tr><th>Agent</th><th>Findings</th></tr></thead>
    <tbody>
      ${Object.entries(report.findingsByAgent).map(([r, c]) => `<tr><td>${_esc(r)}</td><td>${c}</td></tr>`).join('\n      ')}
    </tbody>
  </table>

  <h2>High-Confidence Findings</h2>
  <table>
    <thead><tr><th>Topic</th><th>Agent</th><th>Confidence</th><th>Region</th><th>Summary</th></tr></thead>
    <tbody>
      ${highConfSection}
    </tbody>
  </table>

  <h2>Agent Reports</h2>
  ${agentSections}

  <h2>Recommended Next Steps</h2>
  <table>
    <thead><tr><th>#</th><th>Action</th><th>Description</th><th>Timeline</th><th>Owner</th></tr></thead>
    <tbody>
      ${stepsRows}
    </tbody>
  </table>

  <footer>
    HACOY Future &mdash; Hyper-Local Fabric Production &amp; Commerce &mdash; Bavaria
  </footer>
</body>
</html>`;
  }
}

// ── Helpers ────────────────────────────────────────────

/**
 * Normalize a single-agent report into the comprehensive report shape.
 * If it already has the full shape (title, executiveSummary, etc.), return as-is.
 */
function _normalize(report) {
  if (report.executiveSummary) return report;

  // Single-agent report: { agent, role, totalFindings, findings, tasks, generatedAt }
  const highConf = (report.findings || [])
    .filter(f => f.confidence >= 0.75)
    .sort((a, b) => b.confidence - a.confidence);

  return {
    title: `HACOY Future - ${report.agent} Report`,
    subtitle: `Single-Agent Research Export`,
    generatedAt: report.generatedAt,
    executionTime: report.generatedAt,

    executiveSummary: {
      vision: `Research findings from the ${report.agent} agent.`,
      keyFindings: highConf.slice(0, 6).map(f => f.summary),
      criticalChallenges: [],
      overallAssessment: `${report.totalFindings} findings produced by the ${report.agent} (${report.role}).`,
    },

    agentReports: [report],

    knowledgeBase: {},

    totalFindings: report.totalFindings,
    findingsByAgent: { [report.role]: report.totalFindings },

    highConfidenceFindings: highConf,

    recommendedNextSteps: [],
  };
}

function _timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function _esc(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _renderDetails(details, lines) {
  if (typeof details === 'string') {
    lines.push(details, '');
    return;
  }
  if (Array.isArray(details)) {
    for (const item of details) {
      if (typeof item === 'string') {
        lines.push(`- ${item}`);
      } else if (item && typeof item === 'object') {
        lines.push(`- **${item.name || item.title || Object.values(item)[0]}**`);
      }
    }
    lines.push('');
    return;
  }
  if (typeof details === 'object') {
    for (const [key, val] of Object.entries(details)) {
      if (Array.isArray(val)) {
        lines.push(`**${key}:**`);
        for (const v of val) lines.push(`- ${typeof v === 'object' ? JSON.stringify(v) : v}`);
      } else if (typeof val === 'object' && val !== null) {
        lines.push(`**${key}:** ${JSON.stringify(val)}`);
      } else {
        lines.push(`**${key}:** ${val}`);
      }
    }
    lines.push('');
  }
}
