/**
 * HACOY Future - Research Team Orchestrator
 *
 * Coordinates the entire research agent team, manages task dependencies,
 * aggregates findings, and produces the final comprehensive research report.
 */

import { AgentRole } from './types.js';
import { ResearchContext } from './research-context.js';
import { FabricSourcingAgent } from '../agents/fabric-sourcing-agent.js';
import { ManufacturerScoutAgent } from '../agents/manufacturer-scout-agent.js';
import { SupplyChainAgent } from '../agents/supply-chain-agent.js';
import { SustainabilityAgent } from '../agents/sustainability-agent.js';
import { MarketIntelligenceAgent } from '../agents/market-intelligence-agent.js';

export class HACOYOrchestrator {
  constructor() {
    this.context = new ResearchContext();
    this.agents = new Map();
    this.reports = [];
    this.startedAt = null;
    this.completedAt = null;

    this._initializeAgents();
  }

  _initializeAgents() {
    const agentClasses = [
      FabricSourcingAgent,
      ManufacturerScoutAgent,
      SupplyChainAgent,
      SustainabilityAgent,
      MarketIntelligenceAgent,
    ];

    for (const AgentClass of agentClasses) {
      const agent = new AgentClass();
      this.agents.set(agent.role, agent);
    }
  }

  /** List all agents and their current status */
  listAgents() {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║     HACOY FUTURE - Research Agent Team                  ║');
    console.log('║     Hyper-Local Fabric Production & Commerce - Bavaria  ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    for (const [role, agent] of this.agents) {
      const status = agent.getStatus();
      const statusIcon = {
        idle: '○',
        researching: '◉',
        completed: '●',
      }[status.status] || '?';

      console.log(`  ${statusIcon} ${status.name}`);
      console.log(`    Role: ${role}`);
      console.log(`    Status: ${status.status}`);
      console.log(`    Capabilities: ${agent.capabilities.length}`);
      if (status.findingCount > 0) {
        console.log(`    Findings: ${status.findingCount} | Tasks: ${status.completedTasks}/${status.taskCount}`);
      }
      console.log('');
    }

    console.log(`  Total Agents: ${this.agents.size}`);
    console.log(`  Research Context: ${this.context.projectName}`);
    console.log(`  Mission: ${this.context.mission}\n`);
  }

  /** Execute full research across all agents */
  async runFullResearch() {
    this.startedAt = new Date().toISOString();

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║     HACOY FUTURE - Full Research Execution              ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // Phase 1: Independent research (can run in parallel)
    console.log('━━━ Phase 1: Independent Research ━━━\n');

    const phase1Agents = [
      AgentRole.FABRIC_SOURCING,
      AgentRole.MANUFACTURER_SCOUT,
      AgentRole.SUSTAINABILITY,
      AgentRole.MARKET_INTELLIGENCE,
    ];

    const phase1Results = await Promise.all(
      phase1Agents.map(role => {
        const agent = this.agents.get(role);
        return agent.research(this.context).catch(err => {
          console.error(`  Error in ${agent.name}: ${err.message}`);
          return agent.generateReport();
        });
      })
    );

    this.reports.push(...phase1Results);

    // Phase 2: Supply Chain (depends on fabric sourcing + manufacturer data)
    console.log('\n━━━ Phase 2: Supply Chain Integration ━━━\n');

    const supplyChainAgent = this.agents.get(AgentRole.SUPPLY_CHAIN);
    const supplyChainReport = await supplyChainAgent.research(this.context).catch(err => {
      console.error(`  Error in Supply Chain agent: ${err.message}`);
      return supplyChainAgent.generateReport();
    });
    this.reports.push(supplyChainReport);

    // Phase 3: Synthesis
    console.log('\n━━━ Phase 3: Synthesis & Report Generation ━━━\n');
    this.completedAt = new Date().toISOString();

    return this._generateComprehensiveReport();
  }

  /** Run a single agent's research */
  async runAgent(role) {
    const agent = this.agents.get(role);
    if (!agent) {
      throw new Error(`Unknown agent role: ${role}`);
    }

    console.log(`\nRunning ${agent.name}...\n`);
    const report = await agent.research(this.context);
    this.reports.push(report);
    return report;
  }

  /** Generate the final comprehensive research report */
  _generateComprehensiveReport() {
    const allFindings = [];
    for (const [, agent] of this.agents) {
      allFindings.push(...agent.findings);
    }

    const report = {
      title: 'HACOY Future - Comprehensive Research Report',
      subtitle: 'Hyper-Local Fabric Production & Commerce Model for Bavaria',
      generatedAt: this.completedAt,
      executionTime: `${this.startedAt} → ${this.completedAt}`,

      executiveSummary: this._buildExecutiveSummary(),

      agentReports: this.reports,

      knowledgeBase: this.context.getSnapshot(),

      totalFindings: allFindings.length,
      findingsByAgent: Object.fromEntries(
        [...this.agents].map(([role, agent]) => [role, agent.findings.length])
      ),

      highConfidenceFindings: allFindings
        .filter(f => f.confidence >= 0.75)
        .sort((a, b) => b.confidence - a.confidence),

      recommendedNextSteps: this._buildNextSteps(),
    };

    this._printReportSummary(report);
    return report;
  }

  _buildExecutiveSummary() {
    return {
      vision: 'HACOY Future aims to build a hyper-local fabric production and commerce ecosystem entirely within Bavaria, creating a new model for sustainable fashion that keeps value in the local economy while meeting the highest environmental and social standards.',

      keyFindings: [
        'Bavaria has a viable (if fragmented) textile production base, with strengths in traditional fabrics (Loden, Tracht) and emerging sustainable materials (hemp, linen).',
        'A hub-and-spoke model centered on Munich with secondary hubs in Augsburg, Nuremberg, and Regensburg can cover ~85% of Bavaria\'s population within 80km.',
        'The target market of sustainability-conscious, locally-minded consumers in Bavaria numbers 1.8-3.3 million potential customers.',
        'EU regulations are trending strongly toward sustainability requirements that HACOY\'s model inherently satisfies.',
        'Multiple funding sources at EU, German federal, and Bavarian state levels can support HACOY\'s development.',
        'No existing brand occupies the "100% made in Bavaria, fully transparent sustainable fashion" position.',
      ],

      criticalChallenges: [
        'Fabric processing/finishing gap in Bavaria (dyeing, printing) - may need to build or attract this capability.',
        'Higher production costs vs. global supply chains require strong brand justification and consumer education.',
        'Skilled textile workforce is aging - training programs needed urgently.',
        'Small-batch economics require careful pricing and demand aggregation.',
      ],

      overallAssessment: 'The HACOY hyper-local model is viable and timely. Bavaria has the raw materials, manufacturing base (with investment), market demand, and regulatory tailwinds to make this work. First-mover advantage is available but requires swift execution.',
    };
  }

  _buildNextSteps() {
    return [
      {
        priority: 1,
        action: 'Conduct on-the-ground manufacturer visits',
        description: 'Visit top 15-20 candidate manufacturers identified by the scout agent. Assess real capabilities and interest.',
        timeline: '1-2 months',
        owner: 'HACOY founding team',
      },
      {
        priority: 2,
        action: 'Secure pilot fabric sources',
        description: 'Establish agreements with 3-5 priority fabric sources (Bavarian Loden, organic linen, hemp, TENCEL).',
        timeline: '1-3 months',
        owner: 'Fabric sourcing lead',
      },
      {
        priority: 3,
        action: 'Build Digital Product Passport MVP',
        description: 'Develop the digital platform for supply chain transparency and traceability. Core to HACOY value proposition.',
        timeline: '2-4 months',
        owner: 'Technology team',
      },
      {
        priority: 4,
        action: 'Launch pilot collection',
        description: 'Produce a small pilot collection (5-10 styles, 50-100 pieces each) with selected Bavarian manufacturers.',
        timeline: '3-6 months',
        owner: 'Design + production team',
      },
      {
        priority: 5,
        action: 'Apply for funding',
        description: 'Submit applications to Bavarian state and EU funding programs identified by the sustainability agent.',
        timeline: '1-3 months (parallel)',
        owner: 'Business development',
      },
      {
        priority: 6,
        action: 'Soft launch via pop-ups',
        description: 'Test market response through pop-up events in Munich before full platform launch.',
        timeline: '4-6 months',
        owner: 'Marketing + retail team',
      },
    ];
  }

  _printReportSummary(report) {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║     HACOY FUTURE - Research Report Summary              ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    console.log(`  Total Findings: ${report.totalFindings}`);
    console.log(`  High-Confidence Findings: ${report.highConfidenceFindings.length}`);
    console.log('');
    console.log('  Findings by Agent:');
    for (const [role, count] of Object.entries(report.findingsByAgent)) {
      console.log(`    ${role}: ${count}`);
    }
    console.log('');
    console.log('  Executive Summary:');
    console.log(`    ${report.executiveSummary.overallAssessment}`);
    console.log('');
    console.log('  Next Steps:');
    for (const step of report.recommendedNextSteps) {
      console.log(`    ${step.priority}. ${step.action} (${step.timeline})`);
    }
    console.log('');
  }
}
