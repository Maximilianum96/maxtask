const { v4: uuidv4 } = require('uuid');

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

class SessionStore {
  constructor() {
    this.sessions = new Map();
  }

  create(mode = 'style-advisor') {
    this._prune();
    const id = uuidv4();
    const session = {
      id,
      mode,
      messages: [],
      createdAt: Date.now(),
    };
    this.sessions.set(id, session);
    return session;
  }

  get(id) {
    this._prune();
    return this.sessions.get(id) || null;
  }

  addMessage(id, role, content) {
    const session = this.sessions.get(id);
    if (!session) return null;
    session.messages.push({ role, content });
    return session;
  }

  setMode(id, mode) {
    const session = this.sessions.get(id);
    if (!session) return null;
    session.mode = mode;
    session.messages = [];
    return session;
  }

  destroy(id) {
    return this.sessions.delete(id);
  }

  _prune() {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.createdAt > SESSION_TTL_MS) {
        this.sessions.delete(id);
      }
    }
  }
}

module.exports = new SessionStore();
