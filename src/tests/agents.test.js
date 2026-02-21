import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { FabricSourcingAgent } from '../agents/fabric-sourcing-agent.js';
import { ManufacturerScoutAgent } from '../agents/manufacturer-scout-agent.js';
import { SupplyChainAgent } from '../agents/supply-chain-agent.js';
import { SustainabilityAgent } from '../agents/sustainability-agent.js';
import { MarketIntelligenceAgent } from '../agents/market-intelligence-agent.js';
import { HACOYOrchestrator } from '../core/orchestrator.js';
import { ResearchContext } from '../core/research-context.js';
import { AgentRole } from '../core/types.js';

describe('HACOY Agent Team', () => {
  describe('Agent initialization', () => {
    it('creates all five agents with correct roles', () => {
      const agents = [
        new FabricSourcingAgent(),
        new ManufacturerScoutAgent(),
        new SupplyChainAgent(),
        new SustainabilityAgent(),
        new MarketIntelligenceAgent(),
      ];

      assert.equal(agents.length, 5);
      assert.equal(agents[0].role, AgentRole.FABRIC_SOURCING);
      assert.equal(agents[1].role, AgentRole.MANUFACTURER_SCOUT);
      assert.equal(agents[2].role, AgentRole.SUPPLY_CHAIN);
      assert.equal(agents[3].role, AgentRole.SUSTAINABILITY);
      assert.equal(agents[4].role, AgentRole.MARKET_INTELLIGENCE);
    });

    it('agents start with idle status and no findings', () => {
      const agent = new FabricSourcingAgent();
      assert.equal(agent.status, 'idle');
      assert.equal(agent.findings.length, 0);
      assert.equal(agent.tasks.length, 0);
    });
  });

  describe('Research context', () => {
    it('initializes with correct project parameters', () => {
      const ctx = new ResearchContext();
      assert.equal(ctx.projectName, 'HACOY Future');
      assert.ok(ctx.targetRegions.length > 0);
      assert.ok(ctx.targetFabrics.length > 0);
      assert.equal(ctx.params.maxDistanceKm, 200);
    });

    it('supports message passing between agents', () => {
      const ctx = new ResearchContext();
      ctx.postMessage('fabric-sourcing', 'supply-chain', { data: 'test' });
      const messages = ctx.getMessages('supply-chain');
      assert.equal(messages.length, 1);
      assert.deepEqual(messages[0].content, { data: 'test' });
    });

    it('supports knowledge base contributions and queries', () => {
      const ctx = new ResearchContext();
      ctx.contribute('manufacturers', { name: 'Test GmbH', region: 'Oberbayern' });
      const results = ctx.query('manufacturers');
      assert.equal(results.length, 1);
      assert.equal(results[0].name, 'Test GmbH');
    });
  });

  describe('Agent research execution', () => {
    it('fabric sourcing agent produces findings', async () => {
      const agent = new FabricSourcingAgent();
      const ctx = new ResearchContext();
      const report = await agent.research(ctx);
      assert.ok(report.totalFindings > 0);
      assert.equal(agent.status, 'completed');
    });

    it('manufacturer scout agent produces findings', async () => {
      const agent = new ManufacturerScoutAgent();
      const ctx = new ResearchContext();
      const report = await agent.research(ctx);
      assert.ok(report.totalFindings > 0);
      assert.equal(agent.status, 'completed');
    });

    it('supply chain agent produces findings', async () => {
      const agent = new SupplyChainAgent();
      const ctx = new ResearchContext();
      const report = await agent.research(ctx);
      assert.ok(report.totalFindings > 0);
      assert.equal(agent.status, 'completed');
    });

    it('sustainability agent produces findings', async () => {
      const agent = new SustainabilityAgent();
      const ctx = new ResearchContext();
      const report = await agent.research(ctx);
      assert.ok(report.totalFindings > 0);
      assert.equal(agent.status, 'completed');
    });

    it('market intelligence agent produces findings', async () => {
      const agent = new MarketIntelligenceAgent();
      const ctx = new ResearchContext();
      const report = await agent.research(ctx);
      assert.ok(report.totalFindings > 0);
      assert.equal(agent.status, 'completed');
    });
  });

  describe('Orchestrator', () => {
    it('initializes with all five agents', () => {
      const orchestrator = new HACOYOrchestrator();
      assert.equal(orchestrator.agents.size, 5);
    });

    it('runs full research and produces comprehensive report', async () => {
      const orchestrator = new HACOYOrchestrator();
      const report = await orchestrator.runFullResearch();
      assert.ok(report.totalFindings > 10);
      assert.ok(report.executiveSummary);
      assert.ok(report.recommendedNextSteps.length > 0);
      assert.ok(report.highConfidenceFindings.length > 0);
    });
  });
});
