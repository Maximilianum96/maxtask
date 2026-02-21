/**
 * HACOY Future - Research Agent Type Definitions
 * Hyper-local fabric production & commerce model for Bavaria
 */

/** @enum {string} Agent roles in the HACOY research team */
export const AgentRole = {
  FABRIC_SOURCING: 'fabric-sourcing',
  MANUFACTURER_SCOUT: 'manufacturer-scout',
  SUPPLY_CHAIN: 'supply-chain',
  SUSTAINABILITY: 'sustainability',
  MARKET_INTELLIGENCE: 'market-intelligence',
  ORCHESTRATOR: 'orchestrator',
};

/** @enum {string} Research task status */
export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  BLOCKED: 'blocked',
};

/** @enum {string} Bavarian regions relevant to textile production */
export const BavarianRegion = {
  OBERBAYERN: 'Oberbayern',
  NIEDERBAYERN: 'Niederbayern',
  OBERPFALZ: 'Oberpfalz',
  OBERFRANKEN: 'Oberfranken',
  MITTELFRANKEN: 'Mittelfranken',
  UNTERFRANKEN: 'Unterfranken',
  SCHWABEN: 'Schwaben',
};

/** @enum {string} Fabric categories for research */
export const FabricCategory = {
  ORGANIC_COTTON: 'organic-cotton',
  LINEN: 'linen',
  HEMP: 'hemp',
  WOOL: 'wool',
  RECYCLED_SYNTHETIC: 'recycled-synthetic',
  TENCEL_LYOCELL: 'tencel-lyocell',
  BAVARIAN_LODEN: 'bavarian-loden',
  TRADITIONAL_TRACHT: 'traditional-tracht-fabrics',
};

/**
 * @typedef {Object} ResearchFinding
 * @property {string} id
 * @property {string} agentRole
 * @property {string} topic
 * @property {string} summary
 * @property {Object} details
 * @property {string[]} sources
 * @property {string} region
 * @property {number} confidence - 0 to 1
 * @property {string} timestamp
 */

/**
 * @typedef {Object} ResearchTask
 * @property {string} id
 * @property {string} assignedAgent
 * @property {string} description
 * @property {string} status
 * @property {string[]} dependencies
 * @property {ResearchFinding[]} findings
 */

/**
 * @typedef {Object} ManufacturerProfile
 * @property {string} name
 * @property {string} region
 * @property {string} city
 * @property {string[]} capabilities
 * @property {string[]} fabricTypes
 * @property {string} scaleCategory - 'micro' | 'small' | 'medium'
 * @property {boolean} hyperLocalCapable
 * @property {Object} sustainability
 * @property {Object} contact
 */

/**
 * @typedef {Object} SupplyChainNode
 * @property {string} id
 * @property {string} type - 'supplier' | 'manufacturer' | 'distributor' | 'retail'
 * @property {string} name
 * @property {string} location
 * @property {number} distanceKm
 * @property {string[]} connections
 */
