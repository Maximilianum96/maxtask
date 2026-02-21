import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { ReportExporter } from '../reports/report-exporter.js';

/** Build a minimal but complete report object matching orchestrator output */
function buildTestReport() {
  return {
    title: 'HACOY Future - Test Report',
    subtitle: 'Hyper-Local Test',
    generatedAt: '2026-02-21T12:00:00.000Z',
    executionTime: '2026-02-21T12:00:00.000Z → 2026-02-21T12:00:01.000Z',
    executiveSummary: {
      vision: 'Test vision statement.',
      keyFindings: ['Finding A', 'Finding B'],
      criticalChallenges: ['Challenge 1'],
      overallAssessment: 'Looks good for testing.',
    },
    agentReports: [
      {
        agent: 'Test Agent',
        role: 'test-role',
        totalFindings: 2,
        findings: [
          {
            id: 'f-1',
            agentRole: 'test-role',
            topic: 'Topic One',
            summary: 'Summary one.',
            details: { note: 'detail' },
            sources: ['source-a'],
            region: 'Oberbayern',
            confidence: 0.9,
            timestamp: '2026-02-21T12:00:00.000Z',
          },
          {
            id: 'f-2',
            agentRole: 'test-role',
            topic: 'Topic Two',
            summary: 'Summary two.',
            details: 'plain text details',
            sources: [],
            region: '',
            confidence: 0.6,
            timestamp: '2026-02-21T12:00:00.000Z',
          },
        ],
        generatedAt: '2026-02-21T12:00:01.000Z',
      },
    ],
    knowledgeBase: {},
    totalFindings: 2,
    findingsByAgent: { 'test-role': 2 },
    highConfidenceFindings: [
      {
        id: 'f-1',
        agentRole: 'test-role',
        topic: 'Topic One',
        summary: 'Summary one.',
        details: { note: 'detail' },
        sources: ['source-a'],
        region: 'Oberbayern',
        confidence: 0.9,
        timestamp: '2026-02-21T12:00:00.000Z',
      },
    ],
    recommendedNextSteps: [
      {
        priority: 1,
        action: 'Do the thing',
        description: 'Do it well.',
        timeline: '1 month',
        owner: 'Test team',
      },
    ],
  };
}

describe('ReportExporter', () => {
  const testDir = join(tmpdir(), `hacoy-test-${Date.now()}`);

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  it('exports valid JSON', async () => {
    const exporter = new ReportExporter(testDir);
    const report = buildTestReport();
    const paths = await exporter.export(report, ['json']);

    assert.equal(paths.length, 1);
    assert.ok(paths[0].endsWith('.json'));

    const content = await readFile(paths[0], 'utf-8');
    const parsed = JSON.parse(content);
    assert.equal(parsed.title, report.title);
    assert.equal(parsed.totalFindings, 2);
    assert.equal(parsed.highConfidenceFindings.length, 1);
  });

  it('exports valid HTML', async () => {
    const exporter = new ReportExporter(testDir);
    const report = buildTestReport();
    const paths = await exporter.export(report, ['html']);

    assert.equal(paths.length, 1);
    assert.ok(paths[0].endsWith('.html'));

    const content = await readFile(paths[0], 'utf-8');
    assert.ok(content.startsWith('<!DOCTYPE html>'));
    assert.ok(content.includes('HACOY Future'));
    assert.ok(content.includes('Topic One'));
    assert.ok(content.includes('Do the thing'));
  });

  it('exports valid Markdown', async () => {
    const exporter = new ReportExporter(testDir);
    const report = buildTestReport();
    const paths = await exporter.export(report, ['md']);

    assert.equal(paths.length, 1);
    assert.ok(paths[0].endsWith('.md'));

    const content = await readFile(paths[0], 'utf-8');
    assert.ok(content.startsWith('# HACOY Future'));
    assert.ok(content.includes('## Executive Summary'));
    assert.ok(content.includes('Topic One'));
    assert.ok(content.includes('| 1 | Do the thing'));
  });

  it('exports multiple formats at once', async () => {
    const exporter = new ReportExporter(testDir);
    const report = buildTestReport();
    const paths = await exporter.export(report, ['json', 'html', 'md']);

    assert.equal(paths.length, 3);
    assert.ok(paths.some(p => p.endsWith('.json')));
    assert.ok(paths.some(p => p.endsWith('.html')));
    assert.ok(paths.some(p => p.endsWith('.md')));
  });

  it('throws on unknown format', async () => {
    const exporter = new ReportExporter(testDir);
    const report = buildTestReport();

    await assert.rejects(
      () => exporter.export(report, ['pdf']),
      { message: /Unknown export format: "pdf"/ },
    );
  });

  it('escapes HTML entities in HTML output', async () => {
    const report = buildTestReport();
    report.title = 'Test <script>alert("xss")</script>';
    const exporter = new ReportExporter(testDir);
    const paths = await exporter.export(report, ['html']);

    const content = await readFile(paths[0], 'utf-8');
    assert.ok(!content.includes('<script>'));
    assert.ok(content.includes('&lt;script&gt;'));
  });
});
