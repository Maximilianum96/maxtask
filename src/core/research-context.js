/**
 * HACOY Future - Shared Research Context
 * Central knowledge base shared across all research agents
 */

import { BavarianRegion, FabricCategory } from './types.js';

export class ResearchContext {
  constructor() {
    this.projectName = 'HACOY Future';
    this.mission = 'Hyper-local fabric production and commerce model for Bavaria';

    this.targetRegions = Object.values(BavarianRegion);
    this.targetFabrics = Object.values(FabricCategory);

    /** Shared knowledge base - agents contribute and read from here */
    this.knowledgeBase = {
      manufacturers: [],
      fabricSources: [],
      supplyChainNodes: [],
      regulations: [],
      marketData: [],
      sustainabilityMetrics: [],
    };

    /** Cross-agent messages for coordination */
    this.messageBoard = [];

    /** Research parameters */
    this.params = {
      maxDistanceKm: 200,           // Hyper-local radius from central Bavaria
      minSustainabilityScore: 0.6,  // Minimum sustainability threshold
      preferredScale: ['micro', 'small', 'medium'],
      focusCities: [
        'Munich', 'Augsburg', 'Nuremberg', 'Regensburg', 'Ingolstadt',
        'Rosenheim', 'Kempten', 'Bayreuth', 'Bamberg', 'Passau',
      ],
      priorityFabrics: [
        FabricCategory.ORGANIC_COTTON,
        FabricCategory.LINEN,
        FabricCategory.HEMP,
        FabricCategory.BAVARIAN_LODEN,
      ],
    };
  }

  /** Post a message to the shared board for other agents */
  postMessage(fromAgent, toAgent, content) {
    const msg = {
      id: `msg-${Date.now()}`,
      from: fromAgent,
      to: toAgent || 'all',
      content,
      timestamp: new Date().toISOString(),
      read: false,
    };
    this.messageBoard.push(msg);
    return msg;
  }

  /** Read messages for a specific agent */
  getMessages(agentRole) {
    return this.messageBoard.filter(
      m => (m.to === agentRole || m.to === 'all') && !m.read
    );
  }

  /** Add data to the shared knowledge base */
  contribute(category, data) {
    if (!this.knowledgeBase[category]) {
      this.knowledgeBase[category] = [];
    }
    this.knowledgeBase[category].push({
      ...data,
      contributedAt: new Date().toISOString(),
    });
  }

  /** Query the shared knowledge base */
  query(category, filterFn) {
    const items = this.knowledgeBase[category] || [];
    return filterFn ? items.filter(filterFn) : items;
  }

  /** Get a snapshot of the entire research state */
  getSnapshot() {
    return {
      project: this.projectName,
      mission: this.mission,
      knowledgeBaseSummary: Object.fromEntries(
        Object.entries(this.knowledgeBase).map(([k, v]) => [k, v.length])
      ),
      pendingMessages: this.messageBoard.filter(m => !m.read).length,
      params: this.params,
    };
  }
}
