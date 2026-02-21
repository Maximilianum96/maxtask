/**
 * HACOY Future - Base Research Agent
 * Foundation class for all specialized research agents
 */

import { TaskStatus } from './types.js';

export class BaseAgent {
  constructor({ role, name, description, capabilities }) {
    this.role = role;
    this.name = name;
    this.description = description;
    this.capabilities = capabilities || [];
    this.findings = [];
    this.tasks = [];
    this.status = 'idle';
    this.createdAt = new Date().toISOString();
  }

  /** Create a new research task for this agent */
  createTask(description, dependencies = []) {
    const task = {
      id: `${this.role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      assignedAgent: this.role,
      description,
      status: TaskStatus.PENDING,
      dependencies,
      findings: [],
      createdAt: new Date().toISOString(),
    };
    this.tasks.push(task);
    return task;
  }

  /** Record a research finding */
  addFinding({ topic, summary, details, sources = [], region = '', confidence = 0.5 }) {
    const finding = {
      id: `finding-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      agentRole: this.role,
      topic,
      summary,
      details,
      sources,
      region,
      confidence,
      timestamp: new Date().toISOString(),
    };
    this.findings.push(finding);
    return finding;
  }

  /** Execute the agent's research process - override in subclasses */
  async research(context) {
    throw new Error(`${this.name}: research() must be implemented by subclass`);
  }

  /** Generate a report from this agent's findings */
  generateReport() {
    return {
      agent: this.name,
      role: this.role,
      totalFindings: this.findings.length,
      findings: this.findings,
      tasks: this.tasks.map(t => ({ id: t.id, description: t.description, status: t.status })),
      generatedAt: new Date().toISOString(),
    };
  }

  /** Get a summary of agent status */
  getStatus() {
    return {
      name: this.name,
      role: this.role,
      status: this.status,
      taskCount: this.tasks.length,
      findingCount: this.findings.length,
      completedTasks: this.tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
    };
  }

  /** Log activity with agent prefix */
  log(message) {
    const timestamp = new Date().toISOString().slice(11, 19);
    console.log(`[${timestamp}] [${this.name}] ${message}`);
  }
}
