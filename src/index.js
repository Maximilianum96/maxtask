#!/usr/bin/env node

/**
 * HACOY Future - Fabric Research Agent Team
 * ==========================================
 * Hyper-local fabric production and commerce research agents for Bavaria.
 *
 * Usage:
 *   node src/index.js                    Run full research
 *   node src/index.js --list-agents      List all agents
 *   node src/index.js --agent <role>     Run a specific agent
 *   node src/index.js --export <fmts>    Export report (json,html,md)
 *   node src/index.js --help             Show help
 *
 * Agent roles: fabric-sourcing, manufacturer-scout, supply-chain,
 *              sustainability, market-intelligence
 */

import { HACOYOrchestrator } from './core/orchestrator.js';
import { AgentRole } from './core/types.js';

const HELP_TEXT = `
╔══════════════════════════════════════════════════════════╗
║     HACOY FUTURE - Fabric Research Agent Team           ║
║     Hyper-Local Production & Commerce - Bavaria         ║
╚══════════════════════════════════════════════════════════╝

  A team of specialized research agents investigating fabric production,
  clothing manufacturing, and commerce opportunities in Bavaria for the
  HACOY hyper-local production model.

  USAGE:
    node src/index.js                          Run full research (all agents)
    node src/index.js --mode=full-research     Same as above
    node src/index.js --list-agents            List all agents and capabilities
    node src/index.js --agent <role>           Run a specific agent only
    node src/index.js --export <formats>       Export report after research
    node src/index.js --export-dir <path>      Set export output directory

  AGENT ROLES:
    fabric-sourcing       Identifies local fabric sources in Bavaria
    manufacturer-scout    Scouts clothing manufacturers across Bavaria
    supply-chain          Maps and optimizes hyper-local supply chains
    sustainability        Assesses sustainability and EU compliance
    market-intelligence   Analyzes market trends and consumer demand

  EXPORT FORMATS:
    json       Machine-readable JSON (default)
    html       Styled HTML report
    md         Markdown report
    all        All three formats

  EXAMPLES:
    node src/index.js --agent fabric-sourcing
    node src/index.js --agent manufacturer-scout
    node src/index.js --list-agents
    node src/index.js --export json,html
    node src/index.js --export all
    node src/index.js --export html --export-dir ./my-reports

  PROJECT:
    HACOY Future - Building the future of hyper-local fashion in Bavaria.
    Every garment traceable, sustainable, and made by your neighbors.
`;

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(HELP_TEXT);
    return;
  }

  const orchestrator = new HACOYOrchestrator();

  if (args.includes('--list-agents')) {
    orchestrator.listAgents();
    return;
  }

  // Parse --export and --export-dir flags
  const exportIndex = args.indexOf('--export');
  const exportDirIndex = args.indexOf('--export-dir');
  const exportFormats = parseExportFormats(exportIndex !== -1 ? args[exportIndex + 1] : null);
  const exportDir = exportDirIndex !== -1 ? args[exportDirIndex + 1] : undefined;

  const agentIndex = args.indexOf('--agent');
  if (agentIndex !== -1 && args[agentIndex + 1]) {
    const role = args[agentIndex + 1];
    const validRoles = Object.values(AgentRole).filter(r => r !== AgentRole.ORCHESTRATOR);
    if (!validRoles.includes(role)) {
      console.error(`\n  Unknown agent role: "${role}"`);
      console.error(`  Valid roles: ${validRoles.join(', ')}\n`);
      process.exit(1);
    }
    const report = await orchestrator.runAgent(role);
    console.log(`\n  Agent "${role}" complete. ${report.totalFindings} findings.\n`);

    if (exportFormats) {
      await orchestrator.exportReport(report, exportFormats, exportDir);
    }
    return;
  }

  // Default: run full research
  console.log('\n  Starting HACOY Future full research...\n');
  const report = await orchestrator.runFullResearch();

  console.log('  ══════════════════════════════════════');
  console.log(`  Research complete!`);
  console.log(`  Total findings: ${report.totalFindings}`);
  console.log(`  Report generated at: ${report.generatedAt}`);
  console.log('  ══════════════════════════════════════\n');

  if (exportFormats) {
    await orchestrator.exportReport(report, exportFormats, exportDir);
  }
}

function parseExportFormats(value) {
  if (!value) return null;
  if (value === 'all') return ['json', 'html', 'md'];
  const valid = ['json', 'html', 'md'];
  const formats = value.split(',').map(f => f.trim().toLowerCase());
  for (const f of formats) {
    if (!valid.includes(f)) {
      console.error(`\n  Unknown export format: "${f}". Valid: ${valid.join(', ')}, all\n`);
      process.exit(1);
    }
  }
  return formats;
}

main().catch(err => {
  console.error('\n  HACOY Research Error:', err.message);
  process.exit(1);
});
